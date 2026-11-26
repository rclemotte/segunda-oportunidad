'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

/** Botón que ejecuta una server action, con confirmación y motivo opcionales. */
export function BotonAccion({
  accion,
  args,
  texto,
  clase = 'btn-primario h-10 px-4 text-sm',
  confirmar,
  pedirTexto,
}: {
  accion: (...a: string[]) => Promise<{ error?: string }>;
  args: string[];
  texto: string;
  clase?: string;
  confirmar?: string;
  pedirTexto?: string;
}) {
  const [pendiente, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className={clase}
      disabled={pendiente}
      onClick={() => {
        let extra: string[] = [];
        if (pedirTexto) {
          const t = prompt(pedirTexto);
          if (t === null) return;
          extra = [t];
        } else if (confirmar && !confirm(confirmar)) return;
        start(async () => {
          const r = await accion(...args, ...extra);
          if (r?.error) alert(r.error);
          router.refresh();
        });
      }}
    >
      {pendiente ? '…' : texto}
    </button>
  );
}
