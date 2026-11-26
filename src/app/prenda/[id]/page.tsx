import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, ShieldCheck } from 'lucide-react';
import { crearClienteServidor } from '@/lib/supabase/server';
import { gs, haceCuanto } from '@/lib/format';
import { nombreCategoria, nombreEstadoPrenda } from '@/lib/catalogo';
import type { Prenda } from '@/lib/tipos';
import { Galeria } from './Galeria';
import { BotonComprar } from './BotonComprar';
import { BotonFavorito } from '@/components/BotonFavorito';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Titulo } from '@/components/ui/Titulo';

export const dynamic = 'force-dynamic';

async function cargar(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = crearClienteServidor();
  const { data } = await supabase.from('catalogo').select('*').eq('id', id).maybeSingle();
  return data as Prenda | null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await cargar(params.id);
  return { title: p ? `${p.titulo} · ${gs(p.precio_gs)}` : 'Prenda' };
}

export default async function PaginaPrenda({ params }: { params: { id: string } }) {
  const prenda = await cargar(params.id);
  if (!prenda) notFound();

  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const esMia = user?.id === prenda.vendedor_id;

  return (
    <div className="contenedor pt-4 md:pt-8">
      <div className="md:hidden">
        <Titulo titulo="" volver="/buscar" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="relative">
          <Galeria fotos={prenda.fotos} titulo={prenda.titulo} />
          <BotonFavorito id={prenda.id} className="absolute right-3 top-3 h-10 w-10" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Etiqueta tono="lima">{nombreEstadoPrenda(prenda.estado_prenda)}</Etiqueta>
            <span className="text-[12px] text-carbon-500">{haceCuanto(prenda.creado_en)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-carbon md:text-3xl">{prenda.titulo}</h1>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-violeta">{gs(prenda.precio_gs)}</span>
              {prenda.precio_original_gs && prenda.precio_original_gs > prenda.precio_gs && (
                <span className="text-sm text-carbon-300 line-through">{gs(prenda.precio_original_gs)} nuevo</span>
              )}
            </p>
          </div>

          <div>
            <p className="etiqueta-campo">Talle</p>
            <div className="flex items-center gap-2">
              <span className="grid h-10 min-w-10 place-items-center rounded-full bg-violeta px-3 text-sm font-bold text-white">{prenda.talle}</span>
              <span className="text-[12px] text-carbon-500">Única prenda</span>
            </div>
          </div>

          <dl className="tarjeta divide-y divide-carbon/5 px-4 text-sm">
            <Fila k="Categoría" v={nombreCategoria(prenda.categoria)} />
            {prenda.marca && <Fila k="Marca" v={prenda.marca} />}
            {prenda.color && <Fila k="Color" v={prenda.color} />}
            <Fila
              k="Vendido por"
              v={
                <span className="inline-flex items-center gap-1">
                  {prenda.vendedor_alias}
                  {prenda.vendedor_verificado && <BadgeCheck className="h-4 w-4 text-ok" aria-label="Vendedor verificado" />}
                </span>
              }
            />
            <Fila
              k="Despacha desde"
              v={
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {prenda.vendedor_ciudad}
                </span>
              }
            />
          </dl>

          {prenda.descripcion && <p className="whitespace-pre-line text-[15px] leading-relaxed text-carbon">{prenda.descripcion}</p>}

          <div className="flex items-start gap-3 rounded-2xl bg-lavanda p-4 text-violeta">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-[13px] font-medium">
              <b>Compra protegida:</b> tu pago queda guardado hasta que recibís la prenda. Nunca le pagás directo al vendedor.
            </p>
          </div>

          <BotonComprar
            prenda={{
              id: prenda.id,
              titulo: prenda.titulo,
              precio_gs: prenda.precio_gs,
              talle: prenda.talle,
              foto: prenda.fotos[0] ?? '',
              vendedor_id: prenda.vendedor_id,
              vendedor_alias: prenda.vendedor_alias ?? '',
            }}
            disponible={prenda.estado === 'activa'}
            esMia={esMia}
            estado={prenda.estado}
          />
        </div>
      </div>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-carbon-500">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
