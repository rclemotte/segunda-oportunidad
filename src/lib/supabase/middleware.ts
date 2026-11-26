import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista: { name: string; value: string; options: CookieOptions }[]) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  const privada = ['/cuenta', '/vender', '/admin', '/checkout'].some((p) => ruta.startsWith(p));
  if (privada && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/ingresar';
    url.search = `?next=${encodeURIComponent(ruta)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
