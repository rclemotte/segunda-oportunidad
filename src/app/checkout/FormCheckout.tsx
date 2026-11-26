'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FileCheck2, Landmark, Loader2, Lock, MapPin, Package, Phone, Store, Truck, Upload } from 'lucide-react';
import { useTienda } from '@/components/TiendaProvider';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { comprimirImagen, idAleatorio } from '@/lib/imagen';
import { DEPARTAMENTOS } from '@/lib/catalogo';
import { gs } from '@/lib/format';
import { Aviso } from '@/components/ui/Aviso';
import { Titulo } from '@/components/ui/Titulo';
import { Vacio } from '@/components/ui/Vacio';
import { crearCompra } from './actions';

type Tarifa = { codigo: string; nombre: string; descripcion: string; precio_gs: number };
type Cuenta = { banco: string; titular: string; numero: string; documento: string; alias: string };

const ICONOS: Record<string, typeof Truck> = { delivery: Truck, encomienda: Package, retiro: Store };

export function FormCheckout({
  usuarioId,
  tarifas,
  cuenta,
  nombreInicial,
  telefonoInicial,
}: {
  usuarioId: string;
  tarifas: Tarifa[];
  cuenta: Cuenta;
  nombreInicial: string;
  telefonoInicial: string;
}) {
  const { carrito, vaciar, listo } = useTienda();
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [metodo, setMetodo] = useState(tarifas[0]?.codigo ?? '');
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [dir, setDir] = useState({ departamento: 'Central', ciudad: '', barrio: '', calle: '', referencia: '' });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const vendedores = useMemo(() => new Set(carrito.map((i) => i.vendedor_id)).size, [carrito]);
  const subtotal = carrito.reduce((s, i) => s + i.precio_gs, 0);
  const tarifa = tarifas.find((t) => t.codigo === metodo);
  const envio = (tarifa?.precio_gs ?? 0) * vendedores;
  const total = subtotal + envio;

  if (!listo) return null;
  if (!carrito.length) {
    return <Vacio icono={Package} titulo="No hay nada para pagar" texto="Tu carrito está vacío." accion={{ href: '/buscar', label: 'Explorar prendas' }} />;
  }

  function validarPaso1() {
    if (!nombre.trim()) return 'Escribí tu nombre';
    if (telefono.replace(/\D/g, '').length < 9) return 'Escribí un celular válido (ej. 0981 123 456)';
    if (!metodo) return 'Elegí cómo querés recibirlo';
    if (metodo !== 'retiro' && (!dir.ciudad.trim() || !dir.calle.trim())) return 'Completá ciudad y dirección';
    if (metodo === 'retiro' && !dir.ciudad.trim()) return 'Decinos tu ciudad para asignarte un punto de retiro';
    return '';
  }

  async function confirmar() {
    setError('');
    if (!archivo) {
      setError('Adjuntá el comprobante de la transferencia');
      return;
    }
    setEnviando(true);
    try {
      const supabase = crearClienteNavegador();
      const esPdf = archivo.type === 'application/pdf';
      const blob = esPdf ? archivo : await comprimirImagen(archivo, 1800, 0.85);
      const path = `${usuarioId}/${idAleatorio()}.${esPdf ? 'pdf' : 'jpg'}`;
      const { error: errSubida } = await supabase.storage
        .from('comprobantes')
        .upload(path, blob, { contentType: esPdf ? 'application/pdf' : 'image/jpeg' });
      if (errSubida) throw new Error('No pudimos subir el comprobante: ' + errSubida.message);

      const r = await crearCompra({
        prendas: carrito.map((i) => i.id),
        metodoEnvio: metodo,
        nombre,
        telefono,
        direccion: dir,
        comprobantePath: path,
      });
      if (!r.ok) throw new Error(r.error);
      vaciar();
      router.replace(`/cuenta/compras/${r.id}?nueva=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setEnviando(false);
    }
  }

  return (
    <>
      <Titulo
        titulo={paso === 1 ? 'Entrega' : 'Pago'}
        subtitulo={`Paso ${paso} de 2`}
        volver={paso === 1 ? '/carrito' : undefined}
      />
      <div className="mb-5 flex gap-2">
        <span className="h-1.5 flex-1 rounded-full bg-violeta" />
        <span className={`h-1.5 flex-1 rounded-full ${paso === 2 ? 'bg-violeta' : 'bg-violeta/15'}`} />
      </div>

      {paso === 1 ? (
        <div className="space-y-5">
          <section className="tarjeta space-y-3 p-5">
            <h2 className="font-extrabold text-violeta">¿Cómo te lo enviamos?</h2>
            {tarifas.map((t) => {
              const Icono = ICONOS[t.codigo] ?? Truck;
              const activo = metodo === t.codigo;
              return (
                <button
                  key={t.codigo}
                  type="button"
                  onClick={() => setMetodo(t.codigo)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition ${activo ? 'border-violeta bg-lavanda/50' : 'border-carbon/10'}`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${activo ? 'border-violeta' : 'border-carbon/20'}`}>
                    {activo && <span className="h-2.5 w-2.5 rounded-full bg-violeta" />}
                  </span>
                  <Icono className="h-5 w-5 text-violeta" />
                  <span className="flex-1">
                    <span className="block font-bold">{t.nombre}</span>
                    <span className="block text-[12px] text-carbon-500">{t.descripcion}</span>
                  </span>
                  <span className={`text-sm font-extrabold ${t.precio_gs ? 'text-violeta' : 'text-ok'}`}>
                    {t.precio_gs ? gs(t.precio_gs) : 'Gratis'}
                  </span>
                </button>
              );
            })}
            {vendedores > 1 && tarifa && tarifa.precio_gs > 0 && (
              <Aviso>Tu carrito tiene prendas de {vendedores} vendedores: son {vendedores} envíos.</Aviso>
            )}
          </section>

          <section className="tarjeta space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-violeta">
              <MapPin className="h-4 w-4" /> {metodo === 'retiro' ? '¿Dónde estás?' : '¿Dónde lo recibís?'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Departamento">
                <select className="campo" value={dir.departamento} onChange={(e) => setDir({ ...dir, departamento: e.target.value })}>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Campo>
              <Campo label="Ciudad">
                <input className="campo" value={dir.ciudad} onChange={(e) => setDir({ ...dir, ciudad: e.target.value })} placeholder="Ej. San Lorenzo" />
              </Campo>
              {metodo !== 'retiro' && (
                <>
                  <Campo label="Barrio">
                    <input className="campo" value={dir.barrio} onChange={(e) => setDir({ ...dir, barrio: e.target.value })} />
                  </Campo>
                  <Campo label={metodo === 'encomienda' ? 'Dirección o agencia de encomienda' : 'Calle y número'}>
                    <input className="campo" value={dir.calle} onChange={(e) => setDir({ ...dir, calle: e.target.value })} />
                  </Campo>
                  <div className="sm:col-span-2">
                    <Campo label="Referencia (opcional)">
                      <input className="campo" value={dir.referencia} onChange={(e) => setDir({ ...dir, referencia: e.target.value })} placeholder="Casa de rejas verdes, frente a la plaza…" />
                    </Campo>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="tarjeta space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-violeta">
              <Phone className="h-4 w-4" /> Tus datos de contacto
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Nombre y apellido">
                <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
              </Campo>
              <Campo label="Celular (WhatsApp)">
                <input className="campo" value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0981 123 456" />
              </Campo>
            </div>
            <p className="text-[12px] text-carbon-500">Te escribimos a este número para confirmar el pago y coordinar la entrega.</p>
          </section>

          <Resumen subtotal={subtotal} envio={envio} total={total} n={carrito.length} />
          {error && <Aviso tipo="error">{error}</Aviso>}
          <button
            className="btn-primario w-full"
            onClick={() => {
              const e = validarPaso1();
              setError(e);
              if (!e) {
                setPaso(2);
                window.scrollTo({ top: 0 });
              }
            }}
          >
            Elegir forma de pago
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <Resumen subtotal={subtotal} envio={envio} total={total} n={carrito.length} />

          <section className="tarjeta space-y-4 p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-violeta">
              <Landmark className="h-5 w-5" /> Transferencia bancaria
            </h2>
            <p className="text-sm text-carbon-500">
              Transferí <b className="text-violeta">{gs(total)}</b> a esta cuenta de Segunda Oportunidad y adjuntá el comprobante.
            </p>
            <dl className="divide-y divide-carbon/5 rounded-2xl bg-fondo px-4 text-sm">
              <DatoCuenta k="Banco" v={cuenta.banco} />
              <DatoCuenta k="Titular" v={cuenta.titular} />
              <DatoCuenta k="Número de cuenta" v={cuenta.numero} copiable />
              <DatoCuenta k="CI / RUC" v={cuenta.documento} copiable />
              {cuenta.alias && <DatoCuenta k="Alias" v={cuenta.alias} copiable />}
              <DatoCuenta k="Monto" v={String(total)} mostrar={gs(total)} copiable />
            </dl>

            <label
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition ${archivo ? 'border-ok bg-ok-bg' : 'border-violeta/30 hover:bg-lavanda/50'}`}
            >
              {archivo ? <FileCheck2 className="h-7 w-7 text-ok" /> : <Upload className="h-7 w-7 text-violeta" />}
              <span className="text-sm font-bold text-violeta">{archivo ? archivo.name : 'Adjuntar comprobante'}</span>
              <span className="text-[12px] text-carbon-500">{archivo ? 'Tocá para cambiarlo' : 'Captura de pantalla o PDF de tu banco o billetera'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
            </label>

            <Aviso tipo="protegido">
              Le pagás a Segunda Oportunidad, nunca directo al vendedor. Validamos tu transferencia, avisamos al vendedor y le pagamos recién cuando recibís tu prenda.
            </Aviso>
          </section>

          {error && <Aviso tipo="error">{error}</Aviso>}
          <div className="flex gap-3">
            <button className="btn-secundario" onClick={() => setPaso(1)} disabled={enviando}>
              Atrás
            </button>
            <button className="btn-primario flex-1" onClick={confirmar} disabled={enviando || !archivo}>
              {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
              {enviando ? 'Enviando…' : `Confirmar compra · ${gs(total)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="etiqueta-campo">{label}</span>
      {children}
    </label>
  );
}

function Resumen({ subtotal, envio, total, n }: { subtotal: number; envio: number; total: number; n: number }) {
  return (
    <section className="tarjeta space-y-2 p-5 text-sm">
      <div className="flex justify-between">
        <span className="text-carbon-500">{n} {n === 1 ? 'prenda' : 'prendas'}</span>
        <span className="font-semibold">{gs(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-carbon-500">Envío</span>
        <span className="font-semibold">{envio ? gs(envio) : 'Gratis'}</span>
      </div>
      <div className="flex justify-between border-t border-carbon/5 pt-3 text-lg font-extrabold text-violeta">
        <span>Total</span>
        <span>{gs(total)}</span>
      </div>
    </section>
  );
}

function DatoCuenta({ k, v, mostrar, copiable }: { k: string; v: string; mostrar?: string; copiable?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-carbon-500">{k}</dt>
      <dd className="flex items-center gap-2 text-right font-bold">
        {mostrar ?? (v || '—')}
        {copiable && v && (
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-lg text-violeta hover:bg-lavanda"
            onClick={() => {
              navigator.clipboard?.writeText(v);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
            aria-label={`Copiar ${k}`}
          >
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </dd>
    </div>
  );
}
