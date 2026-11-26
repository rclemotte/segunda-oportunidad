'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { cambiarEstadoPrenda } from '../publicar/actions';

export function AccionesPrenda({ id, estado }: { id: string; estado: string }) {
  const [pendiente, start] = useTransition();
  const router = useRouter();
  if (estado === 'reservada' || estado === 'vendida') return null;

  const cambiar = (e: 'activa' | 'pausada' | 'retirada') =>
    start(async () => {
      const r = await cambiarEstadoPrenda(id, e);
      if (r.error) alert(r.error);
      router.refresh();
    });

  const btn = 'grid h-9 w-9 place-items-center rounded-full text-violeta hover:bg-lavanda disabled:opacity-40';
  return (
    <div className="flex shrink-0 gap-0.5">
      <Link href={`/vender/prendas/${id}`} className={btn} aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
      {estado === 'activa' ? (
        <button className={btn} disabled={pendiente} onClick={() => cambiar('pausada')} aria-label="Pausar"><Pause className="h-4 w-4" /></button>
      ) : (
        <button className={btn} disabled={pendiente} onClick={() => cambiar('activa')} aria-label="Publicar"><Play className="h-4 w-4" /></button>
      )}
      <button
        className={`${btn} text-error hover:bg-error-bg`}
        disabled={pendiente}
        onClick={() => confirm('¿Retirar esta prenda? Deja de verse en el catálogo.') && cambiar('retirada')}
        aria-label="Retirar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
