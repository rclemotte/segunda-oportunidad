import Link from 'next/link';
import { Plus, Shirt } from 'lucide-react';
import { requerirSesion } from '@/lib/sesion';
import { gs } from '@/lib/format';
import { urlFoto } from '@/lib/storage';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Titulo } from '@/components/ui/Titulo';
import { Vacio } from '@/components/ui/Vacio';
import { AccionesPrenda } from './AccionesPrenda';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis prendas' };

const TONO = { activa: 'ok', pausada: 'gris', reservada: 'alerta', vendida: 'violeta', retirada: 'error' } as const;
const NOMBRE = { activa: 'Publicada', pausada: 'Pausada', reservada: 'Reservada', vendida: 'Vendida', retirada: 'Retirada' } as const;

export default async function MisPrendas() {
  const { supabase, user } = await requerirSesion('/vender/prendas');
  const { data: prendas } = await supabase
    .from('prendas')
    .select('id, titulo, talle, precio_gs, fotos, estado')
    .eq('vendedor_id', user.id)
    .neq('estado', 'retirada')
    .order('creado_en', { ascending: false });

  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <Titulo titulo="Mis prendas" subtitulo={`${prendas?.length ?? 0} prendas`} volver="/vender" />
      {prendas?.length ? (
        <ul className="space-y-3">
          {prendas.map((p) => (
            <li key={p.id} className="tarjeta flex items-center gap-3 p-3">
              <Link href={`/prenda/${p.id}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-lavanda">
                <img src={urlFoto(p.fotos[0])} alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.titulo}</p>
                <p className="text-[12px] text-carbon-500">Talle {p.talle} · {gs(p.precio_gs)}</p>
                <div className="mt-1"><Etiqueta tono={TONO[p.estado as keyof typeof TONO]}>{NOMBRE[p.estado as keyof typeof NOMBRE]}</Etiqueta></div>
              </div>
              <AccionesPrenda id={p.id} estado={p.estado} />
            </li>
          ))}
        </ul>
      ) : (
        <Vacio icono={Shirt} titulo="No publicaste nada todavía" accion={{ href: '/vender/publicar', label: 'Publicar prenda' }} />
      )}
      <Link href="/vender/publicar" className="btn-lima mt-5 w-full"><Plus className="h-5 w-5" /> Publicar otra prenda</Link>
    </div>
  );
}
