'use server';

import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

export type DatosPrenda = {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  talle: string;
  marca: string;
  color: string;
  estadoPrenda: string;
  precioGs: number;
  precioOriginalGs: number | null;
  fotos: string[];
};

// Evita que se saque la venta de la plataforma: sin teléfonos, emails ni links
const CONTACTO = /(\+?595|09\d{2})[\s.-]?\d{3}[\s.-]?\d{3}|[\w.-]+@[\w-]+\.\w+|https?:\/\/|wa\.me|instagram\.com/i;

export async function guardarPrenda(d: DatosPrenda): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  if (d.titulo.trim().length < 3) return { ok: false, error: 'Escribí un título.' };
  if (!d.fotos.length) return { ok: false, error: 'Subí al menos una foto.' };
  if (d.fotos.some((f) => !f.startsWith(`${user.id}/`))) return { ok: false, error: 'Foto no válida.' };
  if (d.precioGs < 5000) return { ok: false, error: 'El precio mínimo es Gs. 5.000.' };
  if (CONTACTO.test(`${d.titulo} ${d.descripcion}`)) {
    return { ok: false, error: 'No incluyas teléfonos, emails ni links: la venta se hace por la plataforma.' };
  }

  const fila = {
    titulo: d.titulo.trim(),
    descripcion: d.descripcion.trim(),
    categoria: d.categoria,
    talle: d.talle,
    marca: d.marca.trim(),
    color: d.color.trim(),
    estado_prenda: d.estadoPrenda,
    precio_gs: Math.round(d.precioGs),
    precio_original_gs: d.precioOriginalGs ? Math.round(d.precioOriginalGs) : null,
    fotos: d.fotos.slice(0, 6),
  };

  const r = d.id
    ? await supabase.from('prendas').update(fila).eq('id', d.id).eq('vendedor_id', user.id).select('id').single()
    : await supabase.from('prendas').insert({ ...fila, vendedor_id: user.id }).select('id').single();
  if (r.error) return { ok: false, error: r.error.message };

  revalidatePath('/');
  revalidatePath('/vender/prendas');
  return { ok: true, id: r.data.id };
}

export async function cambiarEstadoPrenda(id: string, estado: 'activa' | 'pausada' | 'retirada') {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from('prendas').update({ estado }).eq('id', id);
  revalidatePath('/vender/prendas');
  revalidatePath('/');
  return { error: error?.message };
}
