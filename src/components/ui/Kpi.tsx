export function Kpi({ titulo, valor, nota, oscuro }: { titulo: string; valor: string; nota?: string; oscuro?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${oscuro ? 'bg-white/10 text-white' : 'tarjeta'}`}>
      <p className={`text-[12px] font-semibold ${oscuro ? 'text-white/70' : 'text-carbon-500'}`}>{titulo}</p>
      <p className={`mt-1 text-lg font-extrabold ${oscuro ? 'text-white' : 'text-violeta'}`}>{valor}</p>
      {nota && <p className={`mt-0.5 text-[11px] ${oscuro ? 'text-white/60' : 'text-carbon-500'}`}>{nota}</p>}
    </div>
  );
}
