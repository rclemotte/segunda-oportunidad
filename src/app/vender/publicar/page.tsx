import { redirect } from 'next/navigation';
import { requerirSesion } from '@/lib/sesion';
import { COMISION_PCT_DEFAULT } from '@/lib/catalogo';
import { Aviso } from '@/components/ui/Aviso';
import { Titulo } from '@/components/ui/Titulo';
import { FormPrenda } from './FormPrenda';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Publicar prenda' };

export default async function Publicar({ searchParams }: { searchParams: { bienvenida?: string } }) {
  const { supabase, user } = await requerirSesion('/vender/publicar');
  const { data: vendedor } = await supabase.from('vendedores').select('perfil_id').eq('perfil_id', user.id).maybeSingle();
  if (!vendedor) redirect('/vender');
  const { data: ajuste } = await supabase.from('ajustes').select('valor').eq('clave', 'comision_pct').maybeSingle();

  return (
    <div className="contenedor max-w-2xl pt-4 md:pt-8">
      <Titulo titulo="Publicar prenda" subtitulo="En menos de dos minutos" volver="/vender" />
      {searchParams.bienvenida && (
        <div className="mb-4">
          <Aviso tipo="ok">¡Listo, ya sos vendedor! Publicá tu primera prenda.</Aviso>
        </div>
      )}
      <FormPrenda usuarioId={user.id} comisionPct={Number(ajuste?.valor ?? COMISION_PCT_DEFAULT)} />
    </div>
  );
}
