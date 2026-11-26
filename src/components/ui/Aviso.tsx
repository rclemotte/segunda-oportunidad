import { AlertCircle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';

const ESTILOS = {
  info: { c: 'bg-lavanda text-violeta', i: Info },
  ok: { c: 'bg-ok-bg text-ok', i: CheckCircle2 },
  alerta: { c: 'bg-alerta-bg text-alerta', i: AlertCircle },
  error: { c: 'bg-error-bg text-error', i: AlertCircle },
  protegido: { c: 'bg-lavanda text-violeta', i: ShieldCheck },
};

export function Aviso({ tipo = 'info', children }: { tipo?: keyof typeof ESTILOS; children: React.ReactNode }) {
  const { c, i: Icono } = ESTILOS[tipo];
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-medium leading-snug ${c}`}>
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
