import { requerirAdmin } from '@/lib/sesion';
import { NavAdmin } from './NavAdmin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await requerirAdmin();
  return (
    <div className="contenedor pt-4 md:pt-8">
      <h1 className="mb-3 text-2xl font-extrabold text-violeta">Administración</h1>
      <NavAdmin />
      <div className="mt-5">{children}</div>
    </div>
  );
}
