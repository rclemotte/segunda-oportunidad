import { FormAcceso } from '../ingresar/FormAcceso';

export const metadata = { title: 'Crear cuenta' };

export default function Registro({ searchParams }: { searchParams: { next?: string } }) {
  return <FormAcceso modo="registro" next={searchParams.next ?? '/'} />;
}
