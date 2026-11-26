-- Segunda Oportunidad · permisos explícitos para la API (anon / authenticated)
-- Los proyectos nuevos de Supabase pueden no dar acceso automático a las tablas
-- creadas por SQL. Sin estos GRANT, la app no puede leer perfiles, catálogo, etc.
-- (la RLS sigue decidiendo qué filas ve cada uno). Se puede correr más de una vez.

grant usage on schema public to anon, authenticated;

-- Lectura pública (catálogo)
grant select on public.categorias, public.tarifas_envio, public.ajustes,
                public.vendedores, public.prendas, public.catalogo
  to anon, authenticated;

-- Usuarios con sesión
grant select, update on public.perfiles to authenticated;
grant insert, update on public.vendedores to authenticated;
grant select, insert, update on public.vendedores_privado, public.cuentas_cobro to authenticated;
grant insert, update on public.prendas to authenticated;
grant select on public.compras, public.pedidos, public.pedido_items,
                public.movimientos, public.liquidaciones, public.auditoria,
                public.saldos_vendedor
  to authenticated;

-- Tablas que edita el admin (la RLS limita a admins)
grant insert, update, delete on public.categorias, public.tarifas_envio, public.ajustes to authenticated;

-- Funciones que usan las políticas RLS y los triggers
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.comision_pct() to anon, authenticated;

-- Funciones de negocio (solo con sesión; repetido por si faltaban)
grant execute on function public.crear_compra(uuid[], text, text, text, jsonb, text) to authenticated;
grant execute on function public.aprobar_pago(uuid) to authenticated;
grant execute on function public.rechazar_pago(uuid, text) to authenticated;
grant execute on function public.marcar_despachado(uuid, text) to authenticated;
grant execute on function public.confirmar_entrega(uuid) to authenticated;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
grant execute on function public.liquidar_vendedor(uuid, text) to authenticated;
grant execute on function public.registrar_auditoria(text, text, text) to authenticated;
