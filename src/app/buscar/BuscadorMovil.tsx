'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BuscadorMovil({ inicial }: { inicial: string }) {
  const [q, setQ] = useState(inicial);
  const router = useRouter();
  return (
    <form
      className="mb-4 md:hidden"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar');
      }}
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-carbon-300" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Qué estás buscando?"
          enterKeyHint="search"
          className="campo pl-12"
        />
      </label>
    </form>
  );
}
