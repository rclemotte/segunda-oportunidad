import { Inbox } from 'lucide-react';
import { requerirAdmin } from '@/lib/sesion';
import { fecha, gs } from '@/lib/format';
import { ESTADOS_PEDIDO } from '@/lib/catalogo';
import { linkWhatsapp } from '@/lib/whatsapp';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Vacio } from '@/components/ui/Vacio';
import { BotonAccion } from '../Boton';
import { cancelarPedido, despacharPedido, entregarPedido } from '../actions';

type Pedido = {
  id: string;
  estado: string;
  subtotal_gs: number;
  envio_gs: number;
  comision_gs: number;
  metodo_envio: string;
  guia: string | null;
  creado_en: string;
  vendedor_id: string;
  vendedores: { alias: string; ciudad: string; vendedores_privado: { whatsapp: string; nombre_completo: string } | null } | null;
  compras: { numero: number; nombre_contacto: string; telefono: string; direccion: Record<string, string> } | null;
  pedido_items: { titulo: string; talle: string }[];
};

export default async function PedidosAdmin({ searchParams }: { searchParams: { ver?: string } }) {
  const { supabase } = await requerirAdmin();
  const estados = searchParams.ver === 'todos' ? ['preparar_envio', 'en_camino', 'entregado', 'cancelado'] : ['preparar_envio', 'en_camino'];
  const { data } = await supabase
    .from('pedidos')
    .select('*, vendedores(alias, ciudad, vendedores_privado(whatsapp, nombre_completo)), compras(numero, nombre_contacto, telefono, direccion), pedido_items(titulo, talle)')
    .in('estado', estados)
    .order('creado_en', { ascending: false })
    .limit(100);
  const pedidos = (data ?? []) as unknown as Pedido[];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <a href="/admin/pedidos" className={`chip ${searchParams.ver !== 'todos' ? 'chip-activo' : ''}`}>En curso</a>
        <a href="/admin/pedidos?ver=todos" className={`chip ${searchParams.ver === 'todos' ? 'chip-activo' : ''}`}>Todos</a>
      </div>
      {!pedidos.length && <Vacio icono={Inbox} titulo="No hay pedidos en curso" />}
      {pedidos.map((p) => {
        const e = ESTADOS_PEDIDO[p.estado];
        const dir = p.compras?.direccion ?? {};
        const wVend = linkWhatsapp(p.vendedores?.vendedores_privado?.whatsapp, `Hola! Vendiste en Segunda Oportunidad: ${p.pedido_items.map((i) => i.titulo).join(', ')}. Coordinemos el envío.`);
        const wComp = linkWhatsapp(p.compras?.telefono);
        return (
          <article key={p.id} className="tarjeta p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-violeta">
                Compra #{p.compras?.numero} · {p.pedido_items.map((i) => `${i.titulo} (${i.talle})`).join(', ')}
              </p>
              <Etiqueta tono={e?.tono}>{e?.nombre}</Etiqueta>
            </div>
            <div className="mt-2 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-[12px] font-bold uppercase text-carbon-500">Vendedor</p>
                <p>{p.vendedores?.alias} ({p.vendedores?.vendedores_privado?.nombre_completo})</p>
                <p className="text-carbon-500">Despacha desde {p.vendedores?.ciudad}</p>
                {wVend && <a href={wVend} target="_blank" rel="noreferrer" className="font-bold text-violeta underline">WhatsApp vendedor</a>}
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase text-carbon-500">Comprador</p>
                <p>{p.compras?.nombre_contacto}</p>
                <p className="text-carbon-500">{p.metodo_envio}: {[dir.calle, dir.barrio, dir.ciudad, dir.departamento].filter(Boolean).join(', ')}</p>
                {dir.referencia && <p className="text-carbon-500">Ref: {dir.referencia}</p>}
                {wComp && <a href={wComp} target="_blank" rel="noreferrer" className="font-bold text-violeta underline">WhatsApp comprador</a>}
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase text-carbon-500">Montos</p>
                <p>Prendas {gs(p.subtotal_gs)} · envío {gs(p.envio_gs)}</p>
                <p>Comisión {gs(p.comision_gs)} · al vendedor <b>{gs(p.subtotal_gs - p.comision_gs)}</b></p>
                <p className="text-carbon-500">{fecha(p.creado_en)}{p.guia && ` · guía ${p.guia}`}</p>
              </div>
            </div>
            {(p.estado === 'preparar_envio' || p.estado === 'en_camino') && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.estado === 'preparar_envio' && (
                  <BotonAccion accion={despacharPedido} args={[p.id]} texto="Marcar despachado" pedirTexto="Número de guía (opcional):" />
                )}
                <BotonAccion accion={entregarPedido} args={[p.id]} texto="Marcar entregado" clase="btn-lima h-10 px-4 text-sm" confirmar="¿El comprador recibió el pedido? Se libera el saldo del vendedor." />
                <BotonAccion accion={cancelarPedido} args={[p.id]} texto="Cancelar" clase="btn-peligro h-10 px-4 text-sm" confirmar="¿Cancelar este pedido? El reembolso al comprador se hace a mano." />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
