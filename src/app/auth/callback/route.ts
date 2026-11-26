import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';

// Link del email de confirmación: canjea el código por una sesión
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const supabase = crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/ingresar?error=link`);
}
