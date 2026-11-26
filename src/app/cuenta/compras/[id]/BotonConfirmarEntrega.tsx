'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { confirmarEntrega } from './actions';

export function BotonConfirmarEntrega({ pedidoId }: { pedidoId: string }) {
  const [pendiente, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className="btn-lima w-full"
      disabled={pendiente}
      onClick={() => {
        if (!confirm('¿Recibiste todo bien? Al confirmar, le liberamos el pago al vendedor.')) return;
        start(async () => {
          const r = await confirmarEntrega(pedidoId);
          if (r.error) alert(r.error);
          router.refresh();
        });
      }}
    >
      <PackageCheck className="h-5 w-5" /> {pendiente ? 'Confirmando…' : 'Llegó bien, confirmar recepción'}
    </button>
  );
}
