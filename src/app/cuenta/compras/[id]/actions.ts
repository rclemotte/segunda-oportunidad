'use server';

import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

export async function confirmarEntrega(pedidoId: string) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.rpc('confirmar_entrega', { p_pedido: pedidoId });
  revalidatePath('/cuenta');
  return { error: error?.message };
}
