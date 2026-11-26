import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
import { TiendaProvider } from '@/components/TiendaProvider';
import { Encabezado } from '@/components/Encabezado';
import { BarraInferior } from '@/components/BarraInferior';
import { Pie } from '@/components/Pie';
import { obtenerSesion } from '@/lib/sesion';

export const metadata: Metadata = {
  title: { default: 'Segunda Oportunidad · Ropa de segunda mano en Paraguay', template: '%s · Segunda Oportunidad' },
  description: 'Comprá y vendé ropa, calzados y accesorios de segunda mano con pago protegido. Todo merece otra oportunidad.',
  applicationName: 'Segunda Oportunidad',
  appleWebApp: { capable: true, title: 'Segunda Op.', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }, { url: '/icons/favicon-32.png', sizes: '32x32' }],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#3A0D66',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let logueado = false;
  let esAdmin = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { user, perfil } = await obtenerSesion();
    logueado = !!user;
    esAdmin = perfil?.rol === 'admin';
  }

  return (
    <html lang="es">
      <body className="min-h-screen">
        <TiendaProvider>
          <Suspense>
            <Encabezado logueado={logueado} esAdmin={esAdmin} />
          </Suspense>
          <main className="pb-28 md:pb-12">{children}</main>
          <Pie />
          <BarraInferior />
        </TiendaProvider>
      </body>
    </html>
  );
}
