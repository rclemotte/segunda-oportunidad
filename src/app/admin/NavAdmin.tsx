'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Pagos por validar' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/vendedores', label: 'Vendedores' },
  { href: '/admin/liquidaciones', label: 'Liquidaciones' },
  { href: '/admin/prendas', label: 'Prendas' },
];

export function NavAdmin() {
  const ruta = usePathname();
  return (
    <nav className="sin-scroll -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={`chip shrink-0 ${ruta === t.href ? 'chip-activo' : ''}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
