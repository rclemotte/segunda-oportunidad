'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useTienda } from '@/components/TiendaProvider';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { GrillaPrendas } from '@/components/TarjetaPrenda';
import { Titulo } from '@/components/ui/Titulo';
import { Vacio } from '@/components/ui/Vacio';
import type { Prenda } from '@/lib/tipos';

export default function Favoritos() {
  const { favoritos, listo } = useTienda();
  const [prendas, setPrendas] = useState<Prenda[] | null>(null);
  const clave = favoritos.join(',');

  useEffect(() => {
    if (!listo) return;
    if (!clave) {
      setPrendas([]);
      return;
    }
    crearClienteNavegador()
      .from('catalogo')
      .select('*')
      .in('id', clave.split(','))
      .then(({ data }) => {
        const orden = clave.split(',');
        setPrendas(((data ?? []) as Prenda[]).sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id)));
      });
  }, [clave, listo]);

  return (
    <div className="contenedor pt-4 md:pt-8">
      <Titulo titulo="Favoritos" subtitulo="Lo que te gustó, guardado en este dispositivo" />
      {prendas === null ? null : prendas.length ? (
        <GrillaPrendas prendas={prendas} />
      ) : (
        <Vacio icono={Heart} titulo="Todavía no guardaste nada" texto="Tocá el corazón en una prenda para guardarla acá." accion={{ href: '/buscar', label: 'Explorar prendas' }} />
      )}
    </div>
  );
}
