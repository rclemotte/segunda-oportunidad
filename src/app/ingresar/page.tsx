import { FormAcceso } from './FormAcceso';

export const metadata = { title: 'Ingresar' };

export default function Ingresar({ searchParams }: { searchParams: { next?: string } }) {
  return <FormAcceso modo="ingresar" next={searchParams.next ?? '/'} />;
}
