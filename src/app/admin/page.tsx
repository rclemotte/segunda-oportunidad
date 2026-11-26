import { ExternalLink, Inbox } from 'lucide-react';
import { requerirAdmin } from '@/lib/sesion';
import { fechaHora, gs } from '@/lib/format';
import { urlFoto } from '@/lib/storage';
import { linkWhatsapp } from '@/lib/whatsapp';
import { Vacio } from '@/components/ui/Vacio';
import { BotonAccion } from './Boton';
import { aprobarPago, rechazarPago } from './actions';

type Compra = {
  id: string;
  numero: number;
  total_gs: number;
  subtotal_gs: number;
  envio_gs: number;
  metodo_envio: string;
  nombre_contacto: string;
  telefono: string;
  direccion: Record<string, string>;
  comprobante_path: string | null;
  creado_en: string;
  pedidos: { id: string; vendedores: { alias: string } | null; pedido_items: { titulo: string; foto: string | null; precio_gs: number }[] }[];
};

export default async function PagosPorValidar() {
  const { supabase } = await requerirAdmin();
  const { data } = await supabase
    .from('compras')
    .select('*, pedidos(id, vendedores(alias), pedido_items(titulo, foto, precio_gs))')
    .eq('estado_pago', 'en_revision')
    .order('creado_en');
  const compras = (data ?? []) as Compra[];

  const urls = await Promise.all(
    compras.map(async (c) => {
      if (!c.comprobante_path) return null;
      const { data } = await supabase.storage.from('comprobantes').createSignedUrl(c.comprobante_path, 600);
      return data?.signedUrl ?? null;
    }),
  );

  if (!compras.length) return <Vacio icono={Inbox} titulo="No hay pagos por validar" texto="Cuando alguien compre y adjunte su comprobante, aparece acá." />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-carbon-500">
        Revisá en la banca web que la transferencia haya entrado por el monto exacto. Al aprobar, las prendas pasan a vendidas y los vendedores ven la venta para despachar.
      </p>
      {compras.map((c, i) => (
        <article key={c.id} className="tarjeta grid gap-4 p-5 md:grid-cols-[1fr_220px]">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-extrabold text-violeta">Compra #{c.numero} · {gs(c.total_gs)}</h2>
              <span className="text-[12px] text-carbon-500">{fechaHora(c.creado_en)}</span>
            </div>
            <p className="mt-1 text-sm">
              <b>{c.nombre_contacto}</b> · <a className="text-violeta underline" href={linkWhatsapp(c.telefono) ?? '#'} target="_blank" rel="noreferrer">{c.telefono}</a>
            </p>
            <p className="text-sm text-carbon-500">
              {c.metodo_envio} · {[c.direccion.calle, c.direccion.barrio, c.direccion.ciudad, c.direccion.departamento].filter(Boolean).join(', ')}
              {c.direccion.referencia && ` (${c.direccion.referencia})`}
            </p>
            <ul className="mt-3 space-y-2">
              {c.pedidos.flatMap((p) =>
                p.pedido_items.map((it) => (
                  <li key={it.titulo + p.id} className="flex items-center gap-2 text-sm">
                    <img src={urlFoto(it.foto)} alt="" className="h-10 w-8 rounded-lg object-cover" />
                    <span className="flex-1">{it.titulo} <span className="text-carbon-500">· {p.vendedores?.alias}</span></span>
                    <span className="font-semibold">{gs(it.precio_gs)}</span>
                  </li>
                )),
              )}
            </ul>
            <p className="mt-2 text-sm text-carbon-500">Prendas {gs(c.subtotal_gs)} + envío {gs(c.envio_gs)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BotonAccion accion={aprobarPago} args={[c.id]} texto="Aprobar pago" confirmar={`¿Confirmás que entraron ${gs(c.total_gs)}?`} />
              <BotonAccion accion={rechazarPago} args={[c.id]} texto="Rechazar" clase="btn-peligro h-10 px-4 text-sm" pedirTexto="Motivo del rechazo (lo ve el comprador):" />
            </div>
          </div>
          <div>
            {urls[i] ? (
              <a href={urls[i]!} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-carbon/10">
                {c.comprobante_path?.endsWith('.pdf') ? (
                  <span className="flex h-40 items-center justify-center gap-2 bg-fondo text-sm font-bold text-violeta">Ver PDF <ExternalLink className="h-4 w-4" /></span>
                ) : (
                  <img src={urls[i]!} alt="Comprobante" className="max-h-72 w-full object-contain" />
                )}
              </a>
            ) : (
              <p className="text-sm text-error">Sin comprobante</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
