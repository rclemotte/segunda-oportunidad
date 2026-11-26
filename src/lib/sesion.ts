import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';

export type Perfil = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rol: 'usuario' | 'admin';
};

export async function obtenerSesion() {
  const supabase = crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, perfil: null as Perfil | null };
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
  return { supabase, user, perfil: perfil as Perfil | null };
}

export async function requerirSesion(siguiente = '/') {
  const s = await obtenerSesion();
  if (!s.user) redirect(`/ingresar?next=${encodeURIComponent(siguiente)}`);
  return s as typeof s & { user: NonNullable<typeof s.user> };
}

export async function requerirAdmin() {
  const s = await requerirSesion('/admin');
  if (s.perfil?.rol !== 'admin') redirect('/');
  return s;
}
