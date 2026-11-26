import Link from 'next/link';
import { Logo } from './Logo';

export function Pie() {
  return (
    <footer className="mb-24 bg-violeta text-white md:mb-0">
      <div className="contenedor grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo claro />
          <p className="mt-3 max-w-xs text-sm text-white/70">
            Moda y accesorios de segunda mano en Paraguay. Pagás a la plataforma y el vendedor cobra cuando recibís tu
            prenda.
          </p>
          <p className="mt-3 text-sm font-bold text-lima">Todo merece otra oportunidad.</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-bold">Comprar</p>
          <ul className="space-y-1.5 text-white/70">
            <li><Link href="/buscar">Explorar prendas</Link></li>
            <li><Link href="/como-funciona">Cómo funciona</Link></li>
            <li><Link href="/carrito">Mi carrito</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-bold">Vender</p>
          <ul className="space-y-1.5 text-white/70">
            <li><Link href="/vender">Panel del vendedor</Link></li>
            <li><Link href="/vender/publicar">Publicar una prenda</Link></li>
            <li><Link href="/terminos">Términos y privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="contenedor flex flex-col gap-1 border-t border-white/10 py-5 text-xs text-white/50 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Segunda Oportunidad · Paraguay</p>
        <p>
          Powered by <span className="font-semibold text-white/80">Riccardo Clemotte</span> &amp;{' '}
          <span className="font-semibold text-white/80">Angel Cabrera</span>
        </p>
      </div>
    </footer>
  );
}
