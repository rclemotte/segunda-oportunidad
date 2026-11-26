import { redirect } from 'next/navigation';
import { requerirSesion } from '@/lib/sesion';
import { Titulo } from '@/components/ui/Titulo';
import { FormVendedor } from '../FormVendedor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis datos de vendedor' };

export default async function DatosVendedor() {
  const { supabase, user } = await requerirSesion('/vender/datos');
  const [{ data: v }, { data: p }, { data: c }] = await Promise.all([
    supabase.from('vendedores').select('*').eq('perfil_id', user.id).maybeSingle(),
    supabase.from('vendedores_privado').select('*').eq('perfil_id', user.id).maybeSingle(),
    supabase.from('cuentas_cobro').select('*').eq('vendedor_id', user.id).maybeSingle(),
  ]);
  if (!v) redirect('/vender');

  return (
    <div className="contenedor max-w-2xl pt-4 md:pt-8">
      <Titulo titulo="Mis datos" subtitulo="Solo los ve el equipo de Segunda Oportunidad" volver="/vender" />
      <FormVendedor
        edicion
        usuarioId={user.id}
        inicial={{
          alias: v.alias,
          ciudad: v.ciudad,
          nombreCompleto: p?.nombre_completo,
          ciNumero: p?.ci_numero,
          whatsapp: p?.whatsapp,
          tieneCi: !!(p?.ci_frente_path && p?.ci_dorso_path),
          banco: c?.banco,
          tipoCuenta: c?.tipo_cuenta,
          numeroCuenta: c?.numero_cuenta,
          titular: c?.titular,
          ciTitular: c?.ci_titular,
        }}
      />
    </div>
  );
}
