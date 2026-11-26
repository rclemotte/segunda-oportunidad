import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export function Vacio({
  icono: Icono,
  titulo,
  texto,
  accion,
}: {
  icono: LucideIcon;
  titulo: string;
  texto?: string;
  accion?: { href: string; label: string };
}) {
  return (
    <div className="tarjeta flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-lavanda text-violeta">
        <Icono className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-extrabold text-violeta">{titulo}</h2>
      {texto && <p className="mt-1 max-w-sm text-sm text-carbon-500">{texto}</p>}
      {accion && (
        <Link href={accion.href} className="btn-primario mt-6">
          {accion.label}
        </Link>
      )}
    </div>
  );
}
