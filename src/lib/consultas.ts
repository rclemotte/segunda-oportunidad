import { crearClienteServidor } from '@/lib/supabase/server';
import type { Prenda } from '@/lib/tipos';

export type FiltrosCatalogo = {
  q?: string;
  categoria?: string;
  talle?: string;
  estado?: string;
  precioMax?: number;
  orden?: 'recientes' | 'menor' | 'mayor';
  limite?: number;
};

export async function consultarCatalogo(f: FiltrosCatalogo = {}): Promise<Prenda[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = crearClienteServidor();
  let consulta = supabase.from('catalogo').select('*').eq('estado', 'activa');
  if (f.categoria) consulta = consulta.eq('categoria', f.categoria);
  if (f.talle) consulta = consulta.eq('talle', f.talle);
  if (f.estado) consulta = consulta.eq('estado_prenda', f.estado);
  if (f.precioMax) consulta = consulta.lte('precio_gs', f.precioMax);
  if (f.q) {
    const t = f.q.replace(/[%,()]/g, ' ').trim();
    if (t) consulta = consulta.or(`titulo.ilike.%${t}%,marca.ilike.%${t}%,descripcion.ilike.%${t}%,color.ilike.%${t}%`);
  }
  if (f.orden === 'menor') consulta = consulta.order('precio_gs', { ascending: true });
  else if (f.orden === 'mayor') consulta = consulta.order('precio_gs', { ascending: false });
  else consulta = consulta.order('creado_en', { ascending: false });
  const { data, error } = await consulta.limit(f.limite ?? 60);
  if (error) {
    console.error('catalogo', error.message);
    return [];
  }
  return (data ?? []) as Prenda[];
}
