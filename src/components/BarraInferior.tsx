'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, Plus, Search, User } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Inicio', icono: Home },
  { href: '/buscar', label: 'Buscar', icono: Search },
  { href: '/vender/publicar', label: 'Vender', icono: Plus, central: true },
  { href: '/favoritos', label: 'Favoritos', icono: Heart },
  { href: '/cuenta', label: 'Mi perfil', icono: User },
];

export function BarraInferior() {
  const ruta = usePathname();
  if (ruta.startsWith('/admin') || ruta.startsWith('/checkout')) return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="mx-auto flex max-w-md items-end justify-between rounded-3xl bg-white px-2 pb-2 pt-1.5 shadow-[0_8px_30px_rgba(58,13,102,0.18)]">
        {ITEMS.map(({ href, label, icono: Icono, central }) => {
          const activo = href === '/' ? ruta === '/' : ruta.startsWith(href);
          if (central) {
            return (
              <Link key={href} href={href} className="-mt-6 flex flex-col items-center gap-1">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-lima text-violeta shadow-[0_6px_16px_rgba(58,13,102,0.25)] ring-4 ring-white">
                  <Icono className="h-7 w-7" strokeWidth={2.6} />
                </span>
                <span className="text-[11px] font-bold text-violeta">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-14 flex-col items-center gap-1 rounded-2xl py-1.5 ${activo ? 'text-violeta' : 'text-carbon-300'}`}
            >
              <span className={`grid h-8 w-10 place-items-center rounded-xl ${activo ? 'bg-lavanda' : ''}`}>
                <Icono className="h-[22px] w-[22px]" strokeWidth={activo ? 2.4 : 2} />
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
