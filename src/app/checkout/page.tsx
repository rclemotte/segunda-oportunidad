import { requerirSesion } from '@/lib/sesion';
import { FormCheckout } from './FormCheckout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrega y pago' };

export default async function Checkout() {
  const { supabase, user, perfil } = await requerirSesion('/checkout');
  const { data: tarifas } = await supabase.from('tarifas_envio').select('*').eq('activo', true).order('orden');

  const cuenta = {
    banco: process.env.TRANSFERENCIA_BANCO ?? '',
    titular: process.env.TRANSFERENCIA_TITULAR ?? '',
    numero: process.env.TRANSFERENCIA_CUENTA ?? '',
    documento: process.env.TRANSFERENCIA_DOCUMENTO ?? '',
    alias: process.env.TRANSFERENCIA_ALIAS ?? '',
  };

  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <FormCheckout
        usuarioId={user.id}
        tarifas={tarifas ?? []}
        cuenta={cuenta}
        nombreInicial={perfil?.nombre ?? ''}
        telefonoInicial={perfil?.telefono ?? ''}
      />
    </div>
  );
}
