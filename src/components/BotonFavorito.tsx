'use client';

import { Heart } from 'lucide-react';
import { useTienda } from './TiendaProvider';

export function BotonFavorito({ id, className = '' }: { id: string; className?: string }) {
  const { esFavorito, alternarFavorito } = useTienda();
  const activo = esFavorito(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alternarFavorito(id);
      }}
      aria-label={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm ${className}`}
    >
      <Heart className={`h-[18px] w-[18px] ${activo ? 'fill-violeta text-violeta' : 'text-violeta'}`} />
    </button>
  );
}
