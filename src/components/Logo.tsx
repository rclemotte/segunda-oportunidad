type Props = { className?: string; conTexto?: boolean; claro?: boolean };

/** Percha dentro de una flecha circular. Lima sobre violeta, o violeta sobre claro. */
export function Isotipo({ className = 'h-9 w-9', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M41 26.5A17 17 0 1 1 36.2 12"
        stroke={color}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path d="M38.8 4.6 39.4 15.4 28.8 13.4Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M21.6 17.2a2.6 2.6 0 1 1 3.4 2.5c-.6.2-1 .8-1 1.4v1.6M24 22.7 13.4 30.4c-.8.6-.4 1.8.6 1.8h20c1 0 1.4-1.2.6-1.8L24 22.7Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = '', conTexto = true, claro = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl ${claro ? 'bg-white/10' : 'bg-violeta'}`}
      >
        <Isotipo className="h-7 w-7" color="#D9FF00" />
      </span>
      {conTexto && (
        <span className={`text-[15px] font-extrabold leading-[1.05] tracking-tight ${claro ? 'text-white' : 'text-violeta'}`}>
          Segunda
          <br />
          Oportunidad<span className={claro ? 'text-lima' : 'text-lima-600'}>.</span>
        </span>
      )}
    </span>
  );
}
