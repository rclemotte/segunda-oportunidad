import Link from 'next/link';
import type { Prenda } from '@/lib/tipos';
import { gs } from '@/lib/format';
import { nombreEstadoPrenda } from '@/lib/catalogo';
import { urlFoto } from '@/lib/storage';
import { BotonFavorito } from './BotonFavorito';

export function TarjetaPrenda({ prenda }: { prenda: Prenda }) {
  const vendida = prenda.estado !== 'activa';
  return (
    <Link href={`/prenda/${prenda.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-lavanda">
        <img
          src={urlFoto(prenda.fotos[0])}
          alt={prenda.titulo}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${vendida ? 'opacity-60' : ''}`}
        />
        <BotonFavorito id={prenda.id} className="absolute right-2 top-2" />
        {vendida && (
          <span className="absolute left-2 top-2 rounded-full bg-carbon px-2.5 py-1 text-[11px] font-bold text-white">
            {prenda.estado === 'reservada' ? 'Reservada' : 'Vendida'}
          </span>
        )}
      </div>
      <div className="px-1 pt-2">
        <p className="truncate text-[14px] font-bold text-carbon">{prenda.titulo}</p>
        <p className="truncate text-[12px] text-carbon-500">
          Talle {prenda.talle} · {nombreEstadoPrenda(prenda.estado_prenda)}
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[15px] font-extrabold text-violeta">{gs(prenda.precio_gs)}</span>
          {prenda.precio_original_gs && prenda.precio_original_gs > prenda.precio_gs && (
            <span className="text-[11px] text-carbon-300 line-through">{gs(prenda.precio_original_gs)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function GrillaPrendas({ prendas }: { prendas: Prenda[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
      {prendas.map((p) => (
        <TarjetaPrenda key={p.id} prenda={p} />
      ))}
    </div>
  );
}
