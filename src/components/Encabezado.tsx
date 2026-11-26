'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import { Logo } from './Logo';
import { useTienda } from './TiendaProvider';
import { useState } from 'react';

export function Encabezado({ logueado, esAdmin }: { logueado: boolean; esAdmin: boolean }) {
  const { carrito, favoritos } = useTienda();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-violeta/5 bg-white/90 backdrop-blur">
      <div className="contenedor flex h-16 items-center gap-4">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-6 text-sm font-semibold text-carbon md:flex">
          <Link href="/buscar" className="hover:text-violeta">Comprar</Link>
          <Link href="/vender" className="hover:text-violeta">Vender</Link>
          <Link href="/como-funciona" className="hover:text-violeta">Cómo funciona</Link>
          {esAdmin && <Link href="/admin" className="text-violeta">Admin</Link>}
        </nav>

        <form onSubmit={buscar} className="ml-auto hidden max-w-xs flex-1 md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-carbon-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="h-10 w-full rounded-full bg-fondo pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violeta/20"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/favoritos" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-lavanda" aria-label="Favoritos">
            <Heart className="h-[22px] w-[22px] text-violeta" />
            {favoritos.length > 0 && <Punto n={favoritos.length} />}
          </Link>
          <Link href="/carrito" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-lavanda" aria-label="Carrito">
            <ShoppingBag className="h-[22px] w-[22px] text-violeta" />
            {carrito.length > 0 && <Punto n={carrito.length} />}
          </Link>
          <Link
            href={logueado ? '/cuenta' : '/ingresar'}
            className="hidden h-10 w-10 place-items-center rounded-full hover:bg-lavanda md:grid"
            aria-label="Mi cuenta"
          >
            <User className="h-[22px] w-[22px] text-violeta" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Punto({ n }: { n: number }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-lima px-1 text-[11px] font-extrabold text-violeta">
      {n}
    </span>
  );
}
