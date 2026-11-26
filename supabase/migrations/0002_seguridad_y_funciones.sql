-- Segunda Oportunidad · RLS y funciones de negocio
-- Todo lo que mueve dinero o estados de pedido pasa por funciones `security definer`
-- que validan quién llama. Las tablas solo permiten lo mínimo por RLS.

-- ─────────────────────────────────────────────────────────────
-- Ajustes (comisión, etc.)
-- ─────────────────────────────────────────────────────────────
create table public.ajustes (
  clave text primary key,
  valor numeric not null
);

insert into public.ajustes (clave, valor) values ('comision_pct', 15);

create or replace function public.comision_pct()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select valor from public.ajustes where clave = 'comision_pct'), 15);
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.vendedores enable row level security;
alter table public.vendedores_privado enable row level security;
alter table public.cuentas_cobro enable row level security;
alter table public.categorias enable row level security;
alter table public.prendas enable row level security;
alter table public.tarifas_envio enable row level security;
alter table public.compras enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.movimientos enable row level security;
alter table public.liquidaciones enable row level security;
alter table public.auditoria enable row level security;
alter table public.ajustes enable row level security;

-- perfiles
create policy perfiles_ver_propio on public.perfiles for select using (id = auth.uid() or public.es_admin());
create policy perfiles_editar_propio on public.perfiles for update using (id = auth.uid() or public.es_admin());

-- vendedores (parte pública: cualquiera puede ver alias/ciudad/estado)
create policy vendedores_ver on public.vendedores for select using (true);
create policy vendedores_crear on public.vendedores for insert with check (perfil_id = auth.uid());
create policy vendedores_editar on public.vendedores for update using (perfil_id = auth.uid() or public.es_admin());

-- vendedores_privado: solo el dueño y admin
create policy privado_ver on public.vendedores_privado for select using (perfil_id = auth.uid() or public.es_admin());
create policy privado_crear on public.vendedores_privado for insert with check (perfil_id = auth.uid());
create policy privado_editar on public.vendedores_privado for update using (perfil_id = auth.uid() or public.es_admin());

-- cuentas_cobro: solo el dueño y admin
create policy cuentas_ver on public.cuentas_cobro for select using (vendedor_id = auth.uid() or public.es_admin());
create policy cuentas_crear on public.cuentas_cobro for insert with check (vendedor_id = auth.uid() and verificada = false);
create policy cuentas_editar on public.cuentas_cobro for update using (vendedor_id = auth.uid() or public.es_admin());

-- categorias, tarifas y ajustes: lectura pública, edición admin
create policy categorias_ver on public.categorias for select using (true);
create policy categorias_admin on public.categorias for all using (public.es_admin()) with check (public.es_admin());
create policy tarifas_ver on public.tarifas_envio for select using (true);
create policy tarifas_admin on public.tarifas_envio for all using (public.es_admin()) with check (public.es_admin());
create policy ajustes_ver on public.ajustes for select using (true);
create policy ajustes_admin on public.ajustes for all using (public.es_admin()) with check (public.es_admin());

-- prendas: el público ve lo publicado (activa, reservada, vendida); el dueño y admin ven todo
create policy prendas_ver on public.prendas for select using (
  estado in ('activa', 'reservada', 'vendida') or vendedor_id = auth.uid() or public.es_admin()
);
create policy prendas_crear on public.prendas for insert with check (vendedor_id = auth.uid());
create policy prendas_editar on public.prendas for update using (vendedor_id = auth.uid() or public.es_admin());

-- compras: el comprador ve las suyas; admin todas. Se crean solo con crear_compra().
create policy compras_ver on public.compras for select using (comprador_id = auth.uid() or public.es_admin());

-- pedidos: comprador (vía compra), vendedor y admin
create policy pedidos_ver on public.pedidos for select using (
  vendedor_id = auth.uid()
  or public.es_admin()
  or exists (select 1 from public.compras c where c.id = compra_id and c.comprador_id = auth.uid())
);

-- Se apoya en la RLS de pedidos: si podés ver el pedido, ves sus prendas
create policy pedido_items_ver on public.pedido_items for select using (
  exists (select 1 from public.pedidos p where p.id = pedido_id)
);

-- movimientos y liquidaciones: el vendedor ve los suyos; admin todo
create policy movimientos_ver on public.movimientos for select using (vendedor_id = auth.uid() or public.es_admin());
create policy liquidaciones_ver on public.liquidaciones for select using (vendedor_id = auth.uid() or public.es_admin());

-- auditoria: solo admin
create policy auditoria_ver on public.auditoria for select using (public.es_admin());

-- ─────────────────────────────────────────────────────────────
-- Compra: reserva las prendas y crea compra + un pedido por vendedor
-- ─────────────────────────────────────────────────────────────
create or replace function public.crear_compra(
  p_prendas uuid[],
  p_metodo_envio text,
  p_nombre text,
  p_telefono text,
  p_direccion jsonb,
  p_comprobante_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tarifa bigint;
  v_compra uuid;
  v_pedido uuid;
  v_subtotal bigint := 0;
  v_envio_total bigint := 0;
  v_pct numeric := public.comision_pct();
  v_no_disponibles int;
  r record;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para comprar';
  end if;
  if p_prendas is null or array_length(p_prendas, 1) is null then
    raise exception 'El carrito está vacío';
  end if;
  if p_comprobante_path is null or p_comprobante_path not like v_uid::text || '/%' then
    raise exception 'Falta el comprobante de la transferencia';
  end if;
  if coalesce(trim(p_telefono), '') = '' then
    raise exception 'Falta el número de celular';
  end if;

  select precio_gs into v_tarifa from public.tarifas_envio where codigo = p_metodo_envio and activo;
  if v_tarifa is null then
    raise exception 'Forma de entrega no válida';
  end if;

  -- Bloquea las prendas para que nadie más las compre a la vez
  perform 1 from public.prendas where id = any (p_prendas) for update;

  select count(*) into v_no_disponibles
  from unnest(p_prendas) as x(id)
  left join public.prendas p on p.id = x.id
  where p.id is null or p.estado <> 'activa' or p.vendedor_id = v_uid;

  if v_no_disponibles > 0 then
    raise exception 'Alguna prenda del carrito ya no está disponible. Actualizá el carrito.';
  end if;

  insert into public.compras (comprador_id, subtotal_gs, envio_gs, total_gs, metodo_envio,
                              nombre_contacto, telefono, direccion, comprobante_path)
  values (v_uid, 0, 0, 0, p_metodo_envio, coalesce(p_nombre, ''), trim(p_telefono),
          coalesce(p_direccion, '{}'::jsonb), p_comprobante_path)
  returning id into v_compra;

  for r in
    select vendedor_id, sum(precio_gs)::bigint as subtotal
    from public.prendas where id = any (p_prendas)
    group by vendedor_id
  loop
    insert into public.pedidos (compra_id, vendedor_id, subtotal_gs, envio_gs, comision_gs, metodo_envio, ciudad_destino)
    values (v_compra, r.vendedor_id, r.subtotal, v_tarifa, round(r.subtotal * v_pct / 100),
            p_metodo_envio, coalesce(p_direccion ->> 'ciudad', ''))
    returning id into v_pedido;

    insert into public.pedido_items (pedido_id, prenda_id, titulo, talle, foto, precio_gs)
    select v_pedido, p.id, p.titulo, p.talle, p.fotos[1], p.precio_gs
    from public.prendas p
    where p.id = any (p_prendas) and p.vendedor_id = r.vendedor_id;

    v_subtotal := v_subtotal + r.subtotal;
    v_envio_total := v_envio_total + v_tarifa;
  end loop;

  update public.compras
  set subtotal_gs = v_subtotal, envio_gs = v_envio_total, total_gs = v_subtotal + v_envio_total
  where id = v_compra;

  perform set_config('app.sistema', 'si', true);
  update public.prendas set estado = 'reservada' where id = any (p_prendas);

  return v_compra;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Admin: validar o rechazar la transferencia
-- ─────────────────────────────────────────────────────────────
create or replace function public.aprobar_pago(p_compra uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  update public.compras
  set estado_pago = 'aprobado', validado_por = auth.uid(), validado_en = now(), motivo_rechazo = null
  where id = p_compra and estado_pago = 'en_revision';
  if not found then raise exception 'La compra no está pendiente de validación'; end if;

  update public.pedidos set estado = 'preparar_envio' where compra_id = p_compra;

  perform set_config('app.sistema', 'si', true);
  update public.prendas set estado = 'vendida'
  where id in (select i.prenda_id from public.pedido_items i join public.pedidos p on p.id = i.pedido_id where p.compra_id = p_compra);

  -- Lo que le corresponde al vendedor queda retenido hasta la entrega
  insert into public.movimientos (vendedor_id, pedido_id, tipo, monto_gs, estado)
  select p.vendedor_id, p.id, 'venta', p.subtotal_gs - p.comision_gs, 'retenido'
  from public.pedidos p where p.compra_id = p_compra;

  perform public.registrar_auditoria('aprobar_pago', 'compras', p_compra::text);
end;
$$;

create or replace function public.rechazar_pago(p_compra uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  update public.compras
  set estado_pago = 'rechazado', motivo_rechazo = p_motivo, validado_por = auth.uid(), validado_en = now()
  where id = p_compra and estado_pago = 'en_revision';
  if not found then raise exception 'La compra no está pendiente de validación'; end if;

  update public.pedidos set estado = 'cancelado' where compra_id = p_compra;

  -- Las prendas vuelven al catálogo
  perform set_config('app.sistema', 'si', true);
  update public.prendas set estado = 'activa'
  where estado = 'reservada'
    and id in (select i.prenda_id from public.pedido_items i join public.pedidos p on p.id = i.pedido_id where p.compra_id = p_compra);

  perform public.registrar_auditoria('rechazar_pago', 'compras', p_compra::text);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Entrega
-- ─────────────────────────────────────────────────────────────
create or replace function public.marcar_despachado(p_pedido uuid, p_guia text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pedidos
  set estado = 'en_camino', guia = nullif(trim(coalesce(p_guia, '')), ''), despachado_en = now()
  where id = p_pedido and estado = 'preparar_envio'
    and (vendedor_id = auth.uid() or public.es_admin());
  if not found then raise exception 'El pedido no se puede marcar como despachado'; end if;
end;
$$;

create or replace function public.confirmar_entrega(p_pedido uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pedidos p
  set estado = 'entregado', entregado_en = now()
  where p.id = p_pedido and p.estado in ('preparar_envio', 'en_camino')
    and (public.es_admin() or exists (select 1 from public.compras c where c.id = p.compra_id and c.comprador_id = auth.uid()));
  if not found then raise exception 'El pedido no se puede confirmar'; end if;

  -- Se libera el saldo del vendedor
  update public.movimientos set estado = 'disponible'
  where pedido_id = p_pedido and estado = 'retenido';
end;
$$;

-- Admin cancela un pedido ya pagado (ej. el vendedor no despachó). El reembolso se hace a mano.
create or replace function public.cancelar_pedido(p_pedido uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  update public.pedidos set estado = 'cancelado'
  where id = p_pedido and estado in ('pago_en_revision', 'preparar_envio', 'en_camino');
  if not found then raise exception 'El pedido no se puede cancelar'; end if;

  update public.movimientos set estado = 'anulado'
  where pedido_id = p_pedido and estado in ('retenido', 'disponible');

  -- Las prendas vuelven al vendedor como pausadas: decide si las republica
  perform set_config('app.sistema', 'si', true);
  update public.prendas set estado = 'pausada'
  where id in (select prenda_id from public.pedido_items where pedido_id = p_pedido)
    and estado in ('reservada', 'vendida');

  perform public.registrar_auditoria('cancelar_pedido', 'pedidos', p_pedido::text);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Liquidación: el admin transfiere al vendedor y lo registra
-- ─────────────────────────────────────────────────────────────
create or replace function public.liquidar_vendedor(p_vendedor uuid, p_referencia text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monto bigint;
  v_liq uuid;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  select coalesce(sum(monto_gs), 0) into v_monto
  from public.movimientos where vendedor_id = p_vendedor and estado = 'disponible';
  if v_monto <= 0 then raise exception 'No hay saldo disponible para liquidar'; end if;

  insert into public.liquidaciones (vendedor_id, monto_gs, referencia, ejecutado_por)
  values (p_vendedor, v_monto, p_referencia, auth.uid())
  returning id into v_liq;

  update public.movimientos set estado = 'pagado', liquidacion_id = v_liq
  where vendedor_id = p_vendedor and estado = 'disponible';

  perform public.registrar_auditoria('liquidar', 'vendedores', p_vendedor::text);
  return v_liq;
end;
$$;

-- Solo usuarios autenticados pueden llamar a las funciones de negocio
revoke execute on function public.crear_compra(uuid[], text, text, text, jsonb, text) from public, anon;
revoke execute on function public.aprobar_pago(uuid) from public, anon;
revoke execute on function public.rechazar_pago(uuid, text) from public, anon;
revoke execute on function public.marcar_despachado(uuid, text) from public, anon;
revoke execute on function public.confirmar_entrega(uuid) from public, anon;
revoke execute on function public.cancelar_pedido(uuid) from public, anon;
revoke execute on function public.liquidar_vendedor(uuid, text) from public, anon;
revoke execute on function public.registrar_auditoria(text, text, text) from public, anon;
grant execute on function public.crear_compra(uuid[], text, text, text, jsonb, text) to authenticated;
grant execute on function public.aprobar_pago(uuid) to authenticated;
grant execute on function public.rechazar_pago(uuid, text) to authenticated;
grant execute on function public.marcar_despachado(uuid, text) to authenticated;
grant execute on function public.confirmar_entrega(uuid) to authenticated;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
grant execute on function public.liquidar_vendedor(uuid, text) to authenticated;
grant execute on function public.registrar_auditoria(text, text, text) to authenticated;
