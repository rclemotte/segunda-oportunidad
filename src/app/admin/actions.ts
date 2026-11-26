'use server';

import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

async function rpc(fn: string, args: Record<string, unknown>) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.rpc(fn, args);
  revalidatePath('/admin', 'layout');
  return { error: error?.message };
}

export async function aprobarPago(compraId: string) {
  return rpc('aprobar_pago', { p_compra: compraId });
}

export async function rechazarPago(compraId: string, motivo: string) {
  return rpc('rechazar_pago', { p_compra: compraId, p_motivo: motivo });
}

export async function despacharPedido(pedidoId: string, guia: string) {
  return rpc('marcar_despachado', { p_pedido: pedidoId, p_guia: guia });
}

export async function entregarPedido(pedidoId: string) {
  return rpc('confirmar_entrega', { p_pedido: pedidoId });
}

export async function cancelarPedido(pedidoId: string) {
  return rpc('cancelar_pedido', { p_pedido: pedidoId });
}

export async function liquidar(vendedorId: string, referencia: string) {
  return rpc('liquidar_vendedor', { p_vendedor: vendedorId, p_referencia: referencia });
}

export async function decidirVendedor(vendedorId: string, aprobado: boolean, motivo: string) {
  const supabase = crearClienteServidor();
  const { error } = await supabase
    .from('vendedores')
    .update({ estado_kyc: aprobado ? 'aprobado' : 'rechazado', motivo_rechazo: aprobado ? null : motivo || null })
    .eq('perfil_id', vendedorId);
  if (!error && aprobado) {
    await supabase.from('cuentas_cobro').update({ verificada: true }).eq('vendedor_id', vendedorId);
  }
  await supabase.rpc('registrar_auditoria', { p_accion: aprobado ? 'aprobar_kyc' : 'rechazar_kyc', p_entidad: 'vendedores', p_entidad_id: vendedorId });
  revalidatePath('/admin/vendedores');
  return { error: error?.message };
}

export async function verificarCuenta(vendedorId: string) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from('cuentas_cobro').update({ verificada: true }).eq('vendedor_id', vendedorId);
  revalidatePath('/admin/vendedores');
  return { error: error?.message };
}

export async function retirarPrenda(prendaId: string) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from('prendas').update({ estado: 'retirada' }).eq('id', prendaId).eq('estado', 'activa');
  revalidatePath('/admin/prendas');
  revalidatePath('/');
  return { error: error?.message };
}
