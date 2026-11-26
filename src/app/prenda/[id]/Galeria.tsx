'use client';

import { useRef, useState } from 'react';
import { urlFoto } from '@/lib/storage';

export function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [actual, setActual] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function irA(i: number) {
    const el = ref.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
  }

  return (
    <div>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="sin-scroll flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto rounded-[24px] bg-lavanda"
      >
        {fotos.map((f, i) => (
          <img key={f} src={urlFoto(f)} alt={`${titulo} · foto ${i + 1}`} className="h-full w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {fotos.length > 1 && (
        <>
          <div className="mt-3 flex justify-center gap-1.5 md:hidden">
            {fotos.map((f, i) => (
              <span key={f} className={`h-1.5 rounded-full transition-all ${i === actual ? 'w-5 bg-violeta' : 'w-1.5 bg-violeta/20'}`} />
            ))}
          </div>
          <div className="mt-3 hidden gap-2 md:flex">
            {fotos.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => irA(i)}
                className={`h-20 w-16 overflow-hidden rounded-xl border-2 ${i === actual ? 'border-violeta' : 'border-transparent'}`}
              >
                <img src={urlFoto(f)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
