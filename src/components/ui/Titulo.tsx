import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function Titulo({ titulo, subtitulo, volver }: { titulo: string; subtitulo?: string; volver?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      {volver && (
        <Link href={volver} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-tarjeta" aria-label="Volver">
          <ChevronLeft className="h-5 w-5 text-violeta" />
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-violeta">{titulo}</h1>
        {subtitulo && <p className="text-sm text-carbon-500">{subtitulo}</p>}
      </div>
    </div>
  );
}
