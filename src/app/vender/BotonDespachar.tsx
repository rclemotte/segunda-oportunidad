'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { marcarDespachado } from './actions';

export function BotonDespachar({ pedidoId }: { pedidoId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [guia, setGuia] = useState('');
  const [pendiente, start] = useTransition();
  const router = useRouter();

  if (!abierto) {
    return (
      <button className="btn-primario h-11 w-full" onClick={() => setAbierto(true)}>
        <Truck className="h-4 w-4" /> Ya lo despaché
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <input className="campo h-11" placeholder="Nº de guía (opcional)" value={guia} onChange={(e) => setGuia(e.target.value)} />
      <button
        className="btn-primario h-11"
        disabled={pendiente}
        onClick={() =>
          start(async () => {
            const r = await marcarDespachado(pedidoId, guia);
            if (r.error) alert(r.error);
            router.refresh();
          })
        }
      >
        {pendiente ? '…' : 'Confirmar'}
      </button>
    </div>
  );
}
