const TONOS = {
  ok: 'bg-ok-bg text-ok',
  alerta: 'bg-alerta-bg text-alerta',
  error: 'bg-error-bg text-error',
  violeta: 'bg-lavanda text-violeta',
  lima: 'bg-lima text-violeta',
  gris: 'bg-carbon/5 text-carbon-500',
};

export function Etiqueta({ tono = 'gris', children }: { tono?: keyof typeof TONOS; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold ${TONOS[tono]}`}>
      {children}
    </span>
  );
}
