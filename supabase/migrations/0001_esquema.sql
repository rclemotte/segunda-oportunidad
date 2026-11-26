-- Segunda Oportunidad · esquema inicial del MVP
-- Ejecutar en Supabase: SQL Editor > New query > pegar y "Run" (o `supabase db push`).
-- Convención: tablas y columnas en español, montos en guaraníes enteros (bigint).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Perfiles (1 por usuario de auth). Una persona puede comprar y vender.
-- ─────────────────────────────────────────────────────────────
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  email text,
  telefono text,
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  creado_en timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

-- Evita que un usuario se cambie el rol a sí mismo
-- Evita que un usuario se cambie el rol a sí mismo desde la app.
-- (Sin security definer a propósito: así current_user es el rol real de quien llama.
--  Desde el SQL Editor de Supabase, como postgres, sí se puede asignar admin.)
create or replace function public.proteger_rol()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol
     and current_user in ('anon', 'authenticated')
     and not public.es_admin() then
    raise exception 'No podés cambiar tu rol';
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger_rol
  before update on public.perfiles
  for each row execute function public.proteger_rol();

-- ─────────────────────────────────────────────────────────────
-- Vendedores: parte pública (alias, ciudad) y parte privada (KYC)
-- ─────────────────────────────────────────────────────────────
create table public.vendedores (
  perfil_id uuid primary key references public.perfiles (id) on delete cascade,
  alias text not null,
  ciudad text not null,
  estado_kyc text not null default 'pendiente' check (estado_kyc in ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo text,
  creado_en timestamptz not null default now()
);

-- Datos internos: el comprador nunca los ve. RLS: el propio vendedor y admin.
create table public.vendedores_privado (
  perfil_id uuid primary key references public.vendedores (perfil_id) on delete cascade,
  nombre_completo text not null,
  ci_numero text not null,
  whatsapp text not null,
  ci_frente_path text,
  ci_dorso_path text,
  actualizado_en timestamptz not null default now()
);

create table public.cuentas_cobro (
  vendedor_id uuid primary key references public.vendedores (perfil_id) on delete cascade,
  banco text not null,
  tipo_cuenta text not null check (tipo_cuenta in ('caja_ahorro', 'cuenta_corriente', 'billetera')),
  numero_cuenta text not null,
  titular text not null,
  ci_titular text not null,
  verificada boolean not null default false,
  actualizado_en timestamptz not null default now()
);

-- Si el vendedor cambia la cuenta, vuelve a requerir verificación
create or replace function public.cuenta_cobro_reverificar()
returns trigger
language plpgsql
as $$
begin
  if not public.es_admin() and (
    new.banco is distinct from old.banco or new.numero_cuenta is distinct from old.numero_cuenta
    or new.titular is distinct from old.titular or new.ci_titular is distinct from old.ci_titular
  ) then
    new.verificada := false;
  end if;
  if not public.es_admin() and new.verificada and not old.verificada then
    new.verificada := false;
  end if;
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger cuentas_cobro_reverificar
  before update on public.cuentas_cobro
  for each row execute function public.cuenta_cobro_reverificar();

-- El vendedor no puede aprobarse a sí mismo
create or replace function public.proteger_kyc()
returns trigger
language plpgsql
as $$
begin
  if not public.es_admin() then
    if tg_op = 'INSERT' then
      new.estado_kyc := 'pendiente';
      new.motivo_rechazo := null;
    elsif new.estado_kyc is distinct from old.estado_kyc or new.motivo_rechazo is distinct from old.motivo_rechazo then
      raise exception 'Solo un administrador cambia el estado de verificación';
    end if;
  end if;
  return new;
end;
$$;

create trigger vendedores_proteger_kyc
  before insert or update on public.vendedores
  for each row execute function public.proteger_kyc();

-- ─────────────────────────────────────────────────────────────
-- Catálogo
-- ─────────────────────────────────────────────────────────────
create table public.categorias (
  slug text primary key,
  nombre text not null,
  orden int not null default 0
);

insert into public.categorias (slug, nombre, orden) values
  ('mujer', 'Mujer', 1),
  ('hombre', 'Hombre', 2),
  ('ninos', 'Niños', 3),
  ('calzados', 'Calzados', 4),
  ('accesorios', 'Accesorios', 5),
  ('deportivo', 'Deportivo', 6),
  ('premium', 'Premium', 7),
  ('ofertas', 'Ofertas', 8);

create table public.prendas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.vendedores (perfil_id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 80),
  descripcion text not null default '',
  categoria text not null references public.categorias (slug),
  talle text not null,
  marca text not null default '',
  color text not null default '',
  estado_prenda text not null check (estado_prenda in ('nuevo_etiqueta', 'como_nuevo', 'muy_bueno', 'bueno')),
  precio_gs bigint not null check (precio_gs >= 5000),
  precio_original_gs bigint check (precio_original_gs is null or precio_original_gs > 0),
  fotos text[] not null default '{}' check (array_length(fotos, 1) between 1 and 6),
  estado text not null default 'activa' check (estado in ('activa', 'pausada', 'reservada', 'vendida', 'retirada')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index prendas_catalogo_idx on public.prendas (estado, creado_en desc);
create index prendas_categoria_idx on public.prendas (categoria, estado);
create index prendas_vendedor_idx on public.prendas (vendedor_id);

-- El vendedor solo puede pasar su prenda entre activa / pausada / retirada.
-- Reservada y vendida las maneja el sistema (funciones de compra).
create or replace function public.proteger_estado_prenda()
returns trigger
language plpgsql
as $$
begin
  if public.es_admin() or current_setting('app.sistema', true) = 'si' then
    new.actualizado_en := now();
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.estado := 'activa';
  elsif new.estado is distinct from old.estado then
    if old.estado in ('reservada', 'vendida') or new.estado not in ('activa', 'pausada', 'retirada') then
      raise exception 'No se puede cambiar el estado de una prenda reservada o vendida';
    end if;
  elsif old.estado in ('reservada', 'vendida') then
    raise exception 'No se puede editar una prenda reservada o vendida';
  end if;
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger prendas_proteger_estado
  before insert or update on public.prendas
  for each row execute function public.proteger_estado_prenda();

-- Vista pública del catálogo: prenda + alias y ciudad del vendedor (nada privado)
create or replace view public.catalogo
with (security_invoker = true)
as
select
  p.id, p.vendedor_id, p.titulo, p.descripcion, p.categoria, p.talle, p.marca, p.color,
  p.estado_prenda, p.precio_gs, p.precio_original_gs, p.fotos, p.estado, p.creado_en,
  v.alias as vendedor_alias, v.ciudad as vendedor_ciudad,
  (v.estado_kyc = 'aprobado') as vendedor_verificado
from public.prendas p
join public.vendedores v on v.perfil_id = p.vendedor_id;

-- ─────────────────────────────────────────────────────────────
-- Envíos: tarifas fijas cargadas por el admin
-- ─────────────────────────────────────────────────────────────
create table public.tarifas_envio (
  codigo text primary key,
  nombre text not null,
  descripcion text not null default '',
  precio_gs bigint not null default 0,
  activo boolean not null default true,
  orden int not null default 0
);

insert into public.tarifas_envio (codigo, nombre, descripcion, precio_gs, orden) values
  ('delivery', 'Delivery', 'Asunción y Gran Asunción · 24 a 48 h', 20000, 1),
  ('encomienda', 'Encomienda', 'Al interior del país · 2 a 4 días', 25000, 2),
  ('retiro', 'Retiro en punto', 'Punto aliado · te avisamos cuando llega', 0, 3);

-- ─────────────────────────────────────────────────────────────
-- Compras (lo que se paga de una vez) y pedidos (uno por vendedor)
-- ─────────────────────────────────────────────────────────────
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  comprador_id uuid not null references public.perfiles (id),
  subtotal_gs bigint not null,
  envio_gs bigint not null,
  total_gs bigint not null,
  metodo_envio text not null references public.tarifas_envio (codigo),
  nombre_contacto text not null,
  telefono text not null,
  direccion jsonb not null default '{}',
  medio_pago text not null default 'transferencia',
  comprobante_path text,
  estado_pago text not null default 'en_revision' check (estado_pago in ('en_revision', 'aprobado', 'rechazado')),
  motivo_rechazo text,
  validado_por uuid references public.perfiles (id),
  validado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index compras_comprador_idx on public.compras (comprador_id, creado_en desc);
create index compras_estado_idx on public.compras (estado_pago, creado_en);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  vendedor_id uuid not null references public.vendedores (perfil_id),
  subtotal_gs bigint not null,
  envio_gs bigint not null,
  comision_gs bigint not null,
  metodo_envio text not null,
  ciudad_destino text not null default '',
  estado text not null default 'pago_en_revision'
    check (estado in ('pago_en_revision', 'preparar_envio', 'en_camino', 'entregado', 'cancelado')),
  guia text,
  despachado_en timestamptz,
  entregado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index pedidos_vendedor_idx on public.pedidos (vendedor_id, creado_en desc);
create index pedidos_compra_idx on public.pedidos (compra_id);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  prenda_id uuid not null references public.prendas (id),
  titulo text not null,
  talle text not null,
  foto text,
  precio_gs bigint not null
);

create index pedido_items_pedido_idx on public.pedido_items (pedido_id);

-- Movimientos del vendedor: el saldo sale de sumar, nunca se edita a mano
create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.vendedores (perfil_id),
  pedido_id uuid references public.pedidos (id),
  liquidacion_id uuid,
  tipo text not null check (tipo in ('venta', 'ajuste')),
  monto_gs bigint not null,
  estado text not null check (estado in ('retenido', 'disponible', 'pagado', 'anulado')),
  creado_en timestamptz not null default now()
);

create index movimientos_vendedor_idx on public.movimientos (vendedor_id, estado);

create table public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.vendedores (perfil_id),
  monto_gs bigint not null,
  referencia text,
  ejecutado_por uuid references public.perfiles (id),
  creado_en timestamptz not null default now()
);

alter table public.movimientos
  add constraint movimientos_liquidacion_fk foreign key (liquidacion_id) references public.liquidaciones (id);

create or replace view public.saldos_vendedor
with (security_invoker = true)
as
select
  v.perfil_id as vendedor_id,
  coalesce(sum(m.monto_gs) filter (where m.estado = 'retenido'), 0)::bigint as retenido_gs,
  coalesce(sum(m.monto_gs) filter (where m.estado = 'disponible'), 0)::bigint as disponible_gs,
  coalesce(sum(m.monto_gs) filter (where m.estado = 'pagado'), 0)::bigint as pagado_gs
from public.vendedores v
left join public.movimientos m on m.vendedor_id = v.perfil_id
group by v.perfil_id;

-- Auditoría: incluye cada vez que un admin abre datos privados (KYC, comprobantes)
create table public.auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid references public.perfiles (id),
  accion text not null,
  entidad text not null,
  entidad_id text,
  creado_en timestamptz not null default now()
);

create or replace function public.registrar_auditoria(p_accion text, p_entidad text, p_entidad_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    return;
  end if;
  insert into public.auditoria (actor_id, accion, entidad, entidad_id)
  values (auth.uid(), p_accion, p_entidad, p_entidad_id);
end;
$$;
