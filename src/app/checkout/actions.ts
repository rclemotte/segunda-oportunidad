'use server';

import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

export type DatosCompra = {
  prendas: string[];
  metodoEnvio: string;
  nombre: string;
  telefono: string;
  direccion: { departamento: string; ciudad: string; barrio: string; calle: string; referencia: string };
  comprobantePath: string;
};

export async function crearCompra(d: DatosCompra): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró. Volvé a ingresar.' };

  const { data, error } = await supabase.rpc('crear_compra', {
    p_prendas: d.prendas,
    p_metodo_envio: d.metodoEnvio,
    p_nombre: d.nombre.trim(),
    p_telefono: d.telefono.trim(),
    p_direccion: d.direccion,
    p_comprobante_path: d.comprobantePath,
  });
  if (error) return { ok: false, error: error.message };

  // Guarda nombre y celular en el perfil para la próxima compra
  await supabase.from('perfiles').update({ nombre: d.nombre.trim(), telefono: d.telefono.trim() }).eq('id', user.id);

  revalidatePath('/');
  return { ok: true, id: data as string };
}
