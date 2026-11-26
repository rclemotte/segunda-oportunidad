import { notFound } from 'next/navigation';
import { requerirSesion } from '@/lib/sesion';
import { COMISION_PCT_DEFAULT } from '@/lib/catalogo';
import { Aviso } from '@/components/ui/Aviso';
import { Titulo } from '@/components/ui/Titulo';
import { FormPrenda } from '../../publicar/FormPrenda';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Editar prenda' };

export default async function EditarPrenda({ params }: { params: { id: string } }) {
  const { supabase, user } = await requerirSesion('/vender/prendas');
  const { data: p } = await supabase.from('prendas').select('*').eq('id', params.id).eq('vendedor_id', user.id).maybeSingle();
  if (!p) notFound();
  const { data: ajuste } = await supabase.from('ajustes').select('valor').eq('clave', 'comision_pct').maybeSingle();
  const bloqueada = p.estado === 'reservada' || p.estado === 'vendida';

  return (
    <div className="contenedor max-w-2xl pt-4 md:pt-8">
      <Titulo titulo="Editar prenda" volver="/vender/prendas" />
      {bloqueada ? (
        <Aviso tipo="alerta">Esta prenda ya está {p.estado}: no se puede editar.</Aviso>
      ) : (
        <FormPrenda
          usuarioId={user.id}
          comisionPct={Number(ajuste?.valor ?? COMISION_PCT_DEFAULT)}
          inicial={{
            id: p.id,
            titulo: p.titulo,
            descripcion: p.descripcion,
            categoria: p.categoria,
            talle: p.talle,
            marca: p.marca,
            color: p.color,
            estadoPrenda: p.estado_prenda,
            precioGs: p.precio_gs,
            precioOriginalGs: p.precio_original_gs,
            fotos: p.fotos,
          }}
        />
      )}
    </div>
  );
}
