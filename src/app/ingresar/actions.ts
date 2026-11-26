'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { crearClienteServidor } from '@/lib/supabase/server';

function destinoSeguro(next: FormDataEntryValue | null) {
  const s = typeof next === 'string' ? next : '/';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
}

export async function ingresar(_: unknown, fd: FormData) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get('email') ?? '').trim(),
    password: String(fd.get('password') ?? ''),
  });
  if (error) {
    return {
      error: error.message.includes('Email not confirmed')
        ? 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.'
        : 'Email o contraseña incorrectos.',
    };
  }
  redirect(destinoSeguro(fd.get('next')));
}

export async function registrarse(_: unknown, fd: FormData) {
  const supabase = crearClienteServidor();
  const nombre = String(fd.get('nombre') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  if (!nombre) return { error: 'Escribí tu nombre.' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  const origen = process.env.NEXT_PUBLIC_SITE_URL || headers().get('origin') || '';
  const next = destinoSeguro(fd.get('next'));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: `${origen}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return { error: error.message.includes('registered') ? 'Ya hay una cuenta con ese email. Ingresá.' : error.message };
  }
  if (!data.session) {
    return { ok: `Te mandamos un email a ${email}. Tocá el link para activar tu cuenta.` };
  }
  redirect(next);
}

export async function salir() {
  const supabase = crearClienteServidor();
  await supabase.auth.signOut();
  redirect('/');
}
