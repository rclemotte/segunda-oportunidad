import { Baby, Crown, Dumbbell, Footprints, Gem, Percent, Shirt, User } from 'lucide-react';

const ICONOS: Record<string, typeof Shirt> = {
  mujer: User,
  hombre: Shirt,
  ninos: Baby,
  calzados: Footprints,
  accesorios: Gem,
  deportivo: Dumbbell,
  premium: Crown,
  ofertas: Percent,
};

export function IconoCategoria({ slug, className = 'h-6 w-6' }: { slug: string; className?: string }) {
  const Icono = ICONOS[slug] ?? Shirt;
  return <Icono className={className} />;
}
