import type { NextRequest } from 'next/server';
import { actualizarSesion } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
