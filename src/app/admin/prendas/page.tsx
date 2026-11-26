import Link from 'next/link';
import { requerirAdmin } from '@/lib/sesion';
import { gs, haceCuanto } from '@/lib/format';
import { urlFoto } from '@/lib/storage';
import { BotonAccion } from '../Boton';
import { retirarPrenda } from '../actions';

export default async function PrendasAdmin() {
  const { supabase } = await requerirAdmin();
  const { data: prendas } = await supabase.from('catalogo').select('*').eq('estado', 'activa').order('creado_en', { ascending: false }).limit(60);

  return (
    <div>
      <p className="mb-3 text-sm text-carbon-500">
        Las prendas se publican al instante. Retirá las que no cumplan las reglas: fotos de internet, réplicas, ropa interior usada, datos de contacto.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(prendas ?? []).map((p) => (
          <li key={p.id} className="tarjeta flex gap-3 p-3 text-sm">
            <Link href={`/prenda/${p.id}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl">
              <img src={urlFoto(p.fotos[0])} alt="" className="h-full w-full object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.titulo}</p>
              <p className="text-carbon-500">{p.vendedor_alias} · {gs(p.precio_gs)}</p>
              <p className="text-[12px] text-carbon-500">{haceCuanto(p.creado_en)}</p>
              <div className="mt-2">
                <BotonAccion accion={retirarPrenda} args={[p.id]} texto="Retirar" clase="btn-peligro h-8 px-3 text-[13px]" confirmar="¿Retirar esta prenda del catálogo?" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
