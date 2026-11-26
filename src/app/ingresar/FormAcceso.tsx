'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Aviso } from '@/components/ui/Aviso';
import { Logo } from '@/components/Logo';
import { ingresar, registrarse } from './actions';

type Estado = { error?: string; ok?: string } | undefined;

export function FormAcceso({ modo, next }: { modo: 'ingresar' | 'registro'; next: string }) {
  const accion = modo === 'ingresar' ? ingresar : registrarse;
  const [estado, enviar] = useFormState<Estado, FormData>(accion as (s: Estado, fd: FormData) => Promise<Estado>, undefined);

  return (
    <div className="contenedor flex max-w-md flex-col items-center pt-8 md:pt-14">
      <Logo />
      <div className="tarjeta mt-6 w-full p-6">
        <h1 className="text-2xl font-extrabold text-violeta">{modo === 'ingresar' ? 'Ingresá' : 'Creá tu cuenta'}</h1>
        <p className="mb-5 text-sm text-carbon-500">
          {modo === 'ingresar' ? 'Para comprar, vender y seguir tus pedidos.' : 'Con una sola cuenta podés comprar y vender.'}
        </p>
        {estado?.ok ? (
          <Aviso tipo="ok">{estado.ok}</Aviso>
        ) : (
          <form action={enviar} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            {modo === 'registro' && (
              <label className="block">
                <span className="etiqueta-campo">Nombre y apellido</span>
                <input name="nombre" className="campo" autoComplete="name" required />
              </label>
            )}
            <label className="block">
              <span className="etiqueta-campo">Email</span>
              <input name="email" type="email" className="campo" autoComplete="email" required />
            </label>
            <label className="block">
              <span className="etiqueta-campo">Contraseña</span>
              <input
                name="password"
                type="password"
                className="campo"
                autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
                minLength={modo === 'registro' ? 8 : undefined}
                required
              />
            </label>
            {estado?.error && <Aviso tipo="error">{estado.error}</Aviso>}
            <Boton texto={modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'} />
          </form>
        )}
      </div>
      <p className="mt-5 text-sm text-carbon-500">
        {modo === 'ingresar' ? (
          <>
            ¿No tenés cuenta?{' '}
            <Link href={`/registro?next=${encodeURIComponent(next)}`} className="font-bold text-violeta">Registrate</Link>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{' '}
            <Link href={`/ingresar?next=${encodeURIComponent(next)}`} className="font-bold text-violeta">Ingresá</Link>
          </>
        )}
      </p>
    </div>
  );
}

function Boton({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primario w-full" disabled={pending}>
      {pending && <Loader2 className="h-5 w-5 animate-spin" />}
      {texto}
    </button>
  );
}
