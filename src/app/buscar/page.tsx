import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { CATEGORIAS, ESTADOS_PRENDA, nombreCategoria, tallesPara } from '@/lib/catalogo';
import { consultarCatalogo } from '@/lib/consultas';
import { GrillaPrendas } from '@/components/TarjetaPrenda';
import { Vacio } from '@/components/ui/Vacio';
import { BuscadorMovil } from './BuscadorMovil';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Explorar' };

type SP = { q?: string; categoria?: string; talle?: string; estado?: string; max?: string; orden?: string };

function armarUrl(actual: SP, cambio: Partial<SP>) {
  const p = new URLSearchParams();
  const todo = { ...actual, ...cambio };
  Object.entries(todo).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `/buscar?${s}` : '/buscar';
}

export default async function Buscar({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const prendas = await consultarCatalogo({
    q: sp.q,
    categoria: sp.categoria,
    talle: sp.talle,
    estado: sp.estado,
    precioMax: sp.max ? Number(sp.max) : undefined,
    orden: (sp.orden as 'recientes' | 'menor' | 'mayor') ?? 'recientes',
  });
  const talles = tallesPara(sp.categoria ?? '');
  const titulo = sp.q ? `“${sp.q}”` : sp.categoria ? nombreCategoria(sp.categoria) : 'Explorar';

  return (
    <div className="contenedor pt-4 md:pt-8">
      <BuscadorMovil inicial={sp.q ?? ''} />

      <h1 className="mb-3 text-2xl font-extrabold text-violeta">{titulo}</h1>

      <div className="space-y-2.5">
        <FilaChips>
          <Chip href={armarUrl(sp, { categoria: undefined, talle: undefined })} activo={!sp.categoria}>Todo</Chip>
          {CATEGORIAS.map((c) => (
            <Chip key={c.slug} href={armarUrl(sp, { categoria: c.slug, talle: undefined })} activo={sp.categoria === c.slug}>
              {c.nombre}
            </Chip>
          ))}
        </FilaChips>
        <FilaChips>
          <span className="shrink-0 self-center text-[12px] font-bold text-carbon-500">Talle</span>
          {talles.map((t) => (
            <Chip key={t} href={armarUrl(sp, { talle: sp.talle === t ? undefined : t })} activo={sp.talle === t}>{t}</Chip>
          ))}
        </FilaChips>
        <FilaChips>
          <span className="shrink-0 self-center text-[12px] font-bold text-carbon-500">Estado</span>
          {ESTADOS_PRENDA.map((e) => (
            <Chip key={e.valor} href={armarUrl(sp, { estado: sp.estado === e.valor ? undefined : e.valor })} activo={sp.estado === e.valor}>
              {e.nombre}
            </Chip>
          ))}
          <span className="ml-2 shrink-0 self-center text-[12px] font-bold text-carbon-500">Precio</span>
          {[50000, 100000, 200000].map((m) => (
            <Chip key={m} href={armarUrl(sp, { max: sp.max === String(m) ? undefined : String(m) })} activo={sp.max === String(m)}>
              Hasta {m / 1000} mil
            </Chip>
          ))}
        </FilaChips>
        <FilaChips>
          <span className="shrink-0 self-center text-[12px] font-bold text-carbon-500">Ordenar</span>
          <Chip href={armarUrl(sp, { orden: undefined })} activo={!sp.orden}>Más nuevos</Chip>
          <Chip href={armarUrl(sp, { orden: 'menor' })} activo={sp.orden === 'menor'}>Menor precio</Chip>
          <Chip href={armarUrl(sp, { orden: 'mayor' })} activo={sp.orden === 'mayor'}>Mayor precio</Chip>
        </FilaChips>
      </div>

      <p className="mb-3 mt-5 text-sm text-carbon-500">{prendas.length} prendas</p>
      {prendas.length ? (
        <GrillaPrendas prendas={prendas} />
      ) : (
        <Vacio icono={SearchX} titulo="No encontramos prendas" texto="Probá con otra búsqueda o sacá algún filtro." accion={{ href: '/buscar', label: 'Ver todo' }} />
      )}
    </div>
  );
}

function FilaChips({ children }: { children: React.ReactNode }) {
  return <div className="sin-scroll -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">{children}</div>;
}

function Chip({ href, activo, children }: { href: string; activo?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} className={`chip shrink-0 ${activo ? 'chip-activo' : ''}`}>
      {children}
    </Link>
  );
}
