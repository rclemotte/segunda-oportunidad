import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { requerirSesion } from '@/lib/sesion';
import { fechaHora, gs } from '@/lib/format';
import { ESTADOS_PAGO, ESTADOS_PEDIDO } from '@/lib/catalogo';
import { urlFoto } from '@/lib/storage';
import { Aviso } from '@/components/ui/Aviso';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Titulo } from '@/components/ui/Titulo';
import { BotonConfirmarEntrega } from './BotonConfirmarEntrega';

export const dynamic = 'force-dynamic';

type Pedido = {
  id: string;
  estado: string;
  guia: string | null;
  subtotal_gs: number;
  envio_gs: number;
  vendedores: { alias: string } | null;
  pedido_items: { id: string; titulo: string; talle: string; foto: string | null; precio_gs: number }[];
};

export default async function DetalleCompra({ params, searchParams }: { params: { id: string }; searchParams: { nueva?: string } }) {
  const { supabase } = await requerirSesion('/cuenta');
  const { data: compra } = await supabase
    .from('compras')
    .select('*, pedidos(id, estado, guia, subtotal_gs, envio_gs, vendedores(alias), pedido_items(id, titulo, talle, foto, precio_gs))')
    .eq('id', params.id)
    .maybeSingle();
  if (!compra) notFound();
  const ep = ESTADOS_PAGO[compra.estado_pago];
  const pedidos = (compra.pedidos ?? []) as Pedido[];
  const soporte = process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE;

  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <Titulo titulo={`Compra #${compra.numero}`} subtitulo={fechaHora(compra.creado_en)} volver="/cuenta" />

      {searchParams.nueva && (
        <div className="tarjeta mb-4 flex flex-col items-center p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-ok" />
          <h2 className="mt-2 text-xl font-extrabold text-violeta">¡Recibimos tu pedido!</h2>
          <p className="mt-1 max-w-sm text-sm text-carbon-500">
            Tus prendas quedan reservadas. Validamos la transferencia y te escribimos al {compra.telefono} para coordinar la entrega.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-carbon-500">Estado del pago</span>
        <Etiqueta tono={ep?.tono}>{ep?.nombre}</Etiqueta>
      </div>
      {compra.estado_pago === 'rechazado' && (
        <div className="mb-4">
          <Aviso tipo="error">
            No pudimos validar tu transferencia{compra.motivo_rechazo ? `: ${compra.motivo_rechazo}` : ''}. Si creés que es un error, escribinos.
          </Aviso>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((p) => {
          const e = ESTADOS_PEDIDO[p.estado];
          return (
            <section key={p.id} className="tarjeta p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wide text-carbon-500">Vende {p.vendedores?.alias}</p>
                <Etiqueta tono={e?.tono}>{e?.nombre}</Etiqueta>
              </div>
              <ul className="divide-y divide-carbon/5">
                {p.pedido_items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2.5">
                    <img src={urlFoto(i.foto)} alt="" className="h-16 w-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-bold">{i.titulo}</p>
                      <p className="text-[12px] text-carbon-500">Talle {i.talle}</p>
                    </div>
                    <p className="font-bold text-violeta">{gs(i.precio_gs)}</p>
                  </li>
                ))}
              </ul>
              {p.guia && <p className="mt-2 text-sm text-carbon-500">Número de guía: <b>{p.guia}</b></p>}
              {(p.estado === 'en_camino' || p.estado === 'preparar_envio') && (
                <div className="mt-3">
                  <BotonConfirmarEntrega pedidoId={p.id} />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="tarjeta mt-4 space-y-2 p-5 text-sm">
        <div className="flex justify-between"><span className="text-carbon-500">Prendas</span><span>{gs(compra.subtotal_gs)}</span></div>
        <div className="flex justify-between"><span className="text-carbon-500">Envío</span><span>{gs(compra.envio_gs)}</span></div>
        <div className="flex justify-between border-t border-carbon/5 pt-3 text-lg font-extrabold text-violeta"><span>Total</span><span>{gs(compra.total_gs)}</span></div>
      </section>

      {soporte && (
        <a href={`https://wa.me/${soporte}?text=${encodeURIComponent(`Hola, consulto por mi compra #${compra.numero}`)}`} target="_blank" rel="noreferrer" className="btn-secundario mt-4 w-full">
          Escribinos por WhatsApp
        </a>
      )}
    </div>
  );
}
