'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag } from 'lucide-react';
import { useTienda } from '@/components/TiendaProvider';
import type { ItemCarrito } from '@/lib/tipos';

export function BotonComprar({
  prenda,
  disponible,
  esMia,
  estado,
}: {
  prenda: ItemCarrito;
  disponible: boolean;
  esMia: boolean;
  estado: string;
}) {
  const { agregar, enCarrito } = useTienda();
  const router = useRouter();
  const yaEsta = enCarrito(prenda.id);

  let contenido: React.ReactNode;
  if (esMia) {
    contenido = (
      <Link href="/vender/prendas" className="btn-secundario w-full">
        Es tu prenda · Ver mis prendas
      </Link>
    );
  } else if (!disponible) {
    contenido = (
      <button disabled className="btn w-full bg-carbon/10 text-carbon-500">
        {estado === 'reservada' ? 'Reservada por otra persona' : 'Ya se vendió'}
      </button>
    );
  } else if (yaEsta) {
    contenido = (
      <Link href="/carrito" className="btn-primario w-full">
        <Check className="h-5 w-5" /> En tu carrito · Ir a pagar
      </Link>
    );
  } else {
    contenido = (
      <button
        className="btn-primario w-full"
        onClick={() => {
          agregar(prenda);
          router.refresh();
        }}
      >
        <ShoppingBag className="h-5 w-5" /> Agregar al carrito
      </button>
    );
  }

  return (
    <>
      <div className="hidden md:block">{contenido}</div>
      <div className="fixed inset-x-0 bottom-[92px] z-30 px-4 md:hidden">{contenido}</div>
    </>
  );
}
