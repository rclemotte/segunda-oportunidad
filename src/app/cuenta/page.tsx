import Link from 'next/link';
import { ChevronRight, LogOut, Package, ShieldCheck, Store } from 'lucide-react';
import { requerirSesion } from '@/lib/sesion';
import { fecha, gs } from '@/lib/format';
import { ESTADOS_PAGO } from '@/lib/catalogo';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Titulo } from '@/components/ui/Titulo';
import { salir } from '../ingresar/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta' };

export default async function Cuenta() {
  const { supabase, user, perfil } = await requerirSesion('/cuenta');
  const [{ data: compras }, { data: vendedor }] = await Promise.all([
    supabase
      .from('compras')
      .select('id, numero, total_gs, estado_pago, creado_en, pedidos(estado, pedido_items(foto))')
      .eq('comprador_id', user.id)
      .order('creado_en', { ascending: false })
      .limit(30),
    supabase.from('vendedores').select('alias').eq('perfil_id', user.id).maybeSingle(),
  ]);

  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <Titulo titulo={`Hola, ${perfil?.nombre?.split(' ')[0] || 'bienvenido'}`} subtitulo={user.email ?? ''} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/vender" className="tarjeta flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lima text-violeta">
            <Store className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-violeta">{vendedor ? `Mi tienda · ${vendedor.alias}` : 'Quiero vender'}</span>
            <span className="block text-[12px] text-carbon-500">{vendedor ? 'Ventas, saldo y prendas' : 'Registrate como vendedor en 2 minutos'}</span>
          </span>
          <ChevronRight className="h-5 w-5 text-carbon-300" />
        </Link>
        {perfil?.rol === 'admin' && (
          <Link href="/admin" className="tarjeta flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violeta text-lima">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-violeta">Panel de administración</span>
              <span className="block text-[12px] text-carbon-500">Pagos, vendedores y pedidos</span>
            </span>
            <ChevronRight className="h-5 w-5 text-carbon-300" />
          </Link>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-extrabold text-violeta">Mis compras</h2>
      {compras?.length ? (
        <ul className="space-y-3">
          {compras.map((c) => {
            const fotos = (c.pedidos ?? []).flatMap((p: { pedido_items: { foto: string | null }[] }) => p.pedido_items.map((i) => i.foto));
            const ep = ESTADOS_PAGO[c.estado_pago];
            return (
              <li key={c.id}>
                <Link href={`/cuenta/compras/${c.id}`} className="tarjeta flex items-center gap-3 p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-lavanda text-violeta">
                    <Package className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">Compra #{c.numero} · {gs(c.total_gs)}</span>
                    <span className="block text-[12px] text-carbon-500">
                      {fecha(c.creado_en)} · {fotos.length} {fotos.length === 1 ? 'prenda' : 'prendas'}
                    </span>
                  </span>
                  <Etiqueta tono={ep?.tono}>{ep?.nombre}</Etiqueta>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="tarjeta p-5 text-sm text-carbon-500">Todavía no compraste nada. <Link href="/buscar" className="font-bold text-violeta">Explorá prendas →</Link></p>
      )}

      <form action={salir} className="mt-8">
        <button className="btn-secundario w-full">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </form>
    </div>
  );
}
