'use server';

import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

export type DatosVendedor = {
  alias: string;
  ciudad: string;
  nombreCompleto: string;
  ciNumero: string;
  whatsapp: string;
  ciFrentePath: string | null;
  ciDorsoPath: string | null;
  banco: string;
  tipoCuenta: 'caja_ahorro' | 'cuenta_corriente' | 'billetera';
  numeroCuenta: string;
  titular: string;
  ciTitular: string;
};

export async function guardarVendedor(d: DatosVendedor) {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró.' };

  const req = [d.alias, d.ciudad, d.nombreCompleto, d.ciNumero, d.whatsapp, d.banco, d.numeroCuenta, d.titular, d.ciTitular];
  if (req.some((v) => !v?.trim())) return { error: 'Completá todos los campos.' };
  if (/\d{6,}|@|https?:/i.test(d.alias)) return { error: 'El alias no puede tener teléfonos, emails ni links.' };

  const { data: existe } = await supabase.from('vendedores').select('perfil_id').eq('perfil_id', user.id).maybeSingle();

  const v = { alias: d.alias.trim(), ciudad: d.ciudad.trim() };
  const r1 = existe
    ? await supabase.from('vendedores').update(v).eq('perfil_id', user.id)
    : await supabase.from('vendedores').insert({ perfil_id: user.id, ...v });
  if (r1.error) return { error: r1.error.message };

  const privado = {
    perfil_id: user.id,
    nombre_completo: d.nombreCompleto.trim(),
    ci_numero: d.ciNumero.trim(),
    whatsapp: d.whatsapp.trim(),
    ...(d.ciFrentePath ? { ci_frente_path: d.ciFrentePath } : {}),
    ...(d.ciDorsoPath ? { ci_dorso_path: d.ciDorsoPath } : {}),
    actualizado_en: new Date().toISOString(),
  };
  const r2 = await supabase.from('vendedores_privado').upsert(privado);
  if (r2.error) return { error: r2.error.message };

  const cuenta = {
    vendedor_id: user.id,
    banco: d.banco.trim(),
    tipo_cuenta: d.tipoCuenta,
    numero_cuenta: d.numeroCuenta.trim(),
    titular: d.titular.trim(),
    ci_titular: d.ciTitular.trim(),
  };
  const { data: cuentaExiste } = await supabase.from('cuentas_cobro').select('vendedor_id').eq('vendedor_id', user.id).maybeSingle();
  const r3 = cuentaExiste
    ? await supabase.from('cuentas_cobro').update(cuenta).eq('vendedor_id', user.id)
    : await supabase.from('cuentas_cobro').insert(cuenta);
  if (r3.error) return { error: r3.error.message };

  await supabase.from('perfiles').update({ telefono: d.whatsapp.trim() }).eq('id', user.id);

  revalidatePath('/vender');
  return { ok: true };
}

export async function marcarDespachado(pedidoId: string, guia: string) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.rpc('marcar_despachado', { p_pedido: pedidoId, p_guia: guia });
  revalidatePath('/vender');
  return { error: error?.message };
}
