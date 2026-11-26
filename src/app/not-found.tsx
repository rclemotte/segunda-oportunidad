import { SearchX } from 'lucide-react';
import { Vacio } from '@/components/ui/Vacio';

export default function NoEncontrado() {
  return (
    <div className="contenedor max-w-xl pt-10">
      <Vacio icono={SearchX} titulo="No encontramos esta página" texto="Puede que la prenda ya no esté publicada." accion={{ href: '/buscar', label: 'Explorar prendas' }} />
    </div>
  );
}
