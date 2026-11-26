import Link from 'next/link';
import { BadgeCheck, Clock, Grid2x2, Plus, Settings, ShieldAlert, Wallet } from 'lucide-react';
import { requerirSesion } from '@/lib/sesion';
import { fecha, gs } from '@/lib/format';
import { ESTADOS_PEDIDO } from '@/lib/catalogo';
import { urlFoto } from '@/lib/storage';
import { Aviso } from '@/components/ui/Aviso';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Kpi } from '@/components/ui/Kpi';
import { Titulo } from '@/components/ui/Titulo';
import { FormVendedor } from './FormVendedor';
import { BotonDespachar } from './BotonDespachar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vender' };

type Venta = {
  id: string;
  estado: string;
  subtotal_gs: number;
  comision_gs: number;
  metodo_envio: string;
  ciudad_destino: string;
  guia: string | null;
  creado_en: string;
  pedido_items: { id: string; titulo: string; talle: string; foto: string | null }[];
};

export default async function Vender({ searchParams }: { searchParams: { guardado?: string } }) {
  const { supabase, user } = await requerirSesion('/vender');
  const { data: vendedor } = await supabase.from('vendedores').select('*').eq('perfil_id', user.id).maybeSingle();

  if (!vendedor) {
    return (
      <div className="contenedor max-w-2xl pt-4 md:pt-8">
        <Titulo titulo="Quiero vender" subtitulo="Tres pasos y ya podés publicar" volver="/cuenta" />
        <FormVendedor usuarioId={user.id} inicial={{}} />
      </div>
    );
  }

  const [{ data: saldo }, { data: ventas }, { count: publicadas }, { data: cuenta }] = await Promise.all([
    supabase.from('saldos_vendedor').select('*').eq('vendedor_id', user.id).maybeSingle(),
    supabase
      .from('pedidos')
      .select('id, estado, subtotal_gs, comision_gs, metodo_envio, ciudad_destino, guia, creado_en, pedido_items(id, titulo, talle, foto)')
      .eq('vendedor_id', user.id)
      .neq('estado', 'pago_en_revision')
      .order('creado_en', { ascending: false })
      .limit(30),
    supabase.from('prendas').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).eq('estado', 'activa'),
    supabase.from('cuentas_cobro').select('verificada').eq('vendedor_id', user.id).maybeSingle(),
  ]);

  const lista = (ventas ?? []) as Venta[];
  const vendidoTotal = lista.filter((v) => v.estado !== 'cancelado').reduce((s, v) => s + v.subtotal_gs, 0);
  const porDespachar = lista.filter((v) => v.estado === 'preparar_envio');

  return (
    <div className="contenedor max-w-4xl pt-4 md:pt-8">
      <section className="rounded-[28px] bg-violeta p-5 text-white md:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/70">Tu tienda</p>
            <h1 className="flex items-center gap-1.5 text-2xl font-extrabold">
              {vendedor.alias}
              {vendedor.estado_kyc === 'aprobado' && <BadgeCheck className="h-5 w-5 text-lima" />}
            </h1>
          </div>
          <Link href="/vender/datos" className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Mis datos">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/70">Saldo a cobrar</p>
        <p className="text-3xl font-extrabold text-lima">{gs(saldo?.disponible_gs ?? 0)}</p>
        <p className="text-[12px] text-white/60">Se transfiere a tu cuenta en la próxima liquidación</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Kpi oscuro titulo="Retenido" valor={gs(saldo?.retenido_gs ?? 0)} nota="hasta la entrega" />
          <Kpi oscuro titulo="Vendido" valor={gs(vendidoTotal)} />
          <Kpi oscuro titulo="Publicadas" valor={String(publicadas ?? 0)} />
        </div>
      </section>

      <div className="mt-4 space-y-3">
        {searchParams.guardado && <Aviso tipo="ok">Guardamos tus datos.</Aviso>}
        {vendedor.estado_kyc === 'pendiente' && (
          <Aviso tipo="alerta">Estamos revisando tu cédula y tu cuenta. Ya podés publicar; vas a poder cobrar cuando te aprobemos.</Aviso>
        )}
        {vendedor.estado_kyc === 'rechazado' && (
          <Aviso tipo="error">
            No pudimos verificar tus datos{vendedor.motivo_rechazo ? `: ${vendedor.motivo_rechazo}` : ''}. <Link href="/vender/datos" className="underline">Actualizalos acá</Link>.
          </Aviso>
        )}
        {cuenta && !cuenta.verificada && vendedor.estado_kyc === 'aprobado' && (
          <Aviso tipo="alerta">Estamos verificando tu nueva cuenta de cobro.</Aviso>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/vender/publicar" className="btn-lima h-14">
          <Plus className="h-5 w-5" /> Publicar prenda
        </Link>
        <Link href="/vender/prendas" className="btn-secundario h-14">
          <Grid2x2 className="h-5 w-5" /> Mis prendas
        </Link>
      </div>

      {porDespachar.length > 0 && (
        <div className="mt-6">
          <Aviso tipo="info">
            <b>Tenés {porDespachar.length} {porDespachar.length === 1 ? 'venta' : 'ventas'} para despachar.</b> Te escribimos por WhatsApp para coordinar el retiro o la encomienda.
          </Aviso>
        </div>
      )}

      <h2 className="mb-3 mt-6 text-lg font-extrabold text-violeta">Tus ventas</h2>
      {lista.length ? (
        <ul className="space-y-3">
          {lista.map((v) => {
            const e = ESTADOS_PEDIDO[v.estado];
            return (
              <li key={v.id} className="tarjeta p-4">
                <div className="flex items-start gap-3">
                  <img src={urlFoto(v.pedido_items[0]?.foto)} alt="" className="h-16 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{v.pedido_items.map((i) => i.titulo).join(', ')}</p>
                    <p className="text-[12px] text-carbon-500">
                      {fecha(v.creado_en)} · {v.metodo_envio === 'delivery' ? 'Delivery' : v.metodo_envio === 'encomienda' ? 'Encomienda' : 'Retiro en punto'}
                      {v.ciudad_destino && ` a ${v.ciudad_destino}`}
                    </p>
                    <p className="text-sm">
                      <span className="font-extrabold text-violeta">{gs(v.subtotal_gs - v.comision_gs)}</span>{' '}
                      <span className="text-[12px] text-carbon-500">para vos (vendiste {gs(v.subtotal_gs)})</span>
                    </p>
                  </div>
                  <Etiqueta tono={e?.tono}>{e?.nombre}</Etiqueta>
                </div>
                {v.estado === 'preparar_envio' && (
                  <div className="mt-3">
                    <BotonDespachar pedidoId={v.id} />
                  </div>
                )}
                {v.guia && <p className="mt-2 text-[12px] text-carbon-500">Guía: {v.guia}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="tarjeta flex items-center gap-3 p-5 text-sm text-carbon-500">
          <Clock className="h-5 w-5 text-violeta" /> Todavía no vendiste. Las prendas con buenas fotos se venden más rápido.
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-lavanda p-4 text-[13px] text-violeta">
        <Wallet className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Lo que vendés queda <b>retenido</b> hasta que el comprador recibe la prenda. Después pasa a <b>saldo a cobrar</b> y te lo transferimos.</p>
      </div>
      {vendedor.estado_kyc !== 'aprobado' && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-carbon-500"><ShieldAlert className="h-4 w-4" /> Cobrás cuando verifiquemos tu identidad.</p>
      )}
    </div>
  );
}
