'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { useTienda } from '@/components/TiendaProvider';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { gs } from '@/lib/format';
import { urlFoto } from '@/lib/storage';
import { Aviso } from '@/components/ui/Aviso';
import { Titulo } from '@/components/ui/Titulo';
import { Vacio } from '@/components/ui/Vacio';

export function VistaCarrito() {
  const { carrito, quitar, listo } = useTienda();
  const [noDisponibles, setNoDisponibles] = useState<string[]>([]);

  const ids = carrito.map((i) => i.id).join(',');
  useEffect(() => {
    if (!ids) return;
    const supabase = crearClienteNavegador();
    supabase
      .from('prendas')
      .select('id, estado')
      .in('id', ids.split(','))
      .then(({ data }) => {
        const activas = new Set((data ?? []).filter((p) => p.estado === 'activa').map((p) => p.id));
        setNoDisponibles(ids.split(',').filter((id) => !activas.has(id)));
      });
  }, [ids]);

  const grupos = useMemo(() => {
    const m = new Map<string, { alias: string; items: typeof carrito }>();
    carrito.forEach((i) => {
      const g = m.get(i.vendedor_id) ?? { alias: i.vendedor_alias, items: [] };
      g.items.push(i);
      m.set(i.vendedor_id, g);
    });
    return [...m.values()];
  }, [carrito]);

  const subtotal = carrito.filter((i) => !noDisponibles.includes(i.id)).reduce((s, i) => s + i.precio_gs, 0);

  if (!listo) return null;

  if (!carrito.length) {
    return (
      <>
        <Titulo titulo="Mi carrito" />
        <Vacio icono={ShoppingBag} titulo="Tu carrito está vacío" texto="Cada prenda es única: cuando te guste una, agregala antes de que se vaya." accion={{ href: '/buscar', label: 'Explorar prendas' }} />
      </>
    );
  }

  return (
    <>
      <Titulo titulo="Mi carrito" subtitulo={`${carrito.length} ${carrito.length === 1 ? 'prenda' : 'prendas'}`} volver="/buscar" />
      <div className="mb-4">
        <Aviso tipo="alerta">Cada prenda es única. Se reserva para vos cuando confirmás la compra con el comprobante.</Aviso>
      </div>

      <div className="space-y-4">
        {grupos.map((g) => (
          <div key={g.alias} className="tarjeta p-4">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-carbon-500">Vende {g.alias}</p>
            <ul className="divide-y divide-carbon/5">
              {g.items.map((i) => {
                const fuera = noDisponibles.includes(i.id);
                return (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <Link href={`/prenda/${i.id}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-lavanda">
                      <img src={urlFoto(i.foto)} alt="" className={`h-full w-full object-cover ${fuera ? 'opacity-40' : ''}`} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{i.titulo}</p>
                      <p className="text-[12px] text-carbon-500">Talle {i.talle}</p>
                      {fuera ? (
                        <p className="text-sm font-bold text-error">Ya no está disponible</p>
                      ) : (
                        <p className="font-extrabold text-violeta">{gs(i.precio_gs)}</p>
                      )}
                    </div>
                    <button onClick={() => quitar(i.id)} className="grid h-10 w-10 place-items-center rounded-full text-carbon-300 hover:bg-error-bg hover:text-error" aria-label="Quitar">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="tarjeta mt-4 space-y-2 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-carbon-500">Subtotal ({carrito.length - noDisponibles.length} prendas)</span>
          <span className="font-semibold">{gs(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-carbon-500">Envío</span>
          <span className="text-carbon-500">Se elige en el paso siguiente</span>
        </div>
        <div className="flex justify-between border-t border-carbon/5 pt-3 text-lg font-extrabold text-violeta">
          <span>Total</span>
          <span>{gs(subtotal)}</span>
        </div>
        {noDisponibles.length > 0 ? (
          <button className="btn-primario mt-2 w-full" onClick={() => noDisponibles.forEach(quitar)}>
            Quitar las no disponibles
          </button>
        ) : (
          <Link href="/checkout" className="btn-primario mt-2 w-full">
            Continuar a la entrega <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <p className="flex items-center justify-center gap-1.5 pt-1 text-[12px] text-carbon-500">
          <Lock className="h-3.5 w-3.5" /> Pagás por transferencia a Segunda Oportunidad
        </p>
      </div>
    </>
  );
}
