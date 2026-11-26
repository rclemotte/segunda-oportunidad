'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, Landmark, Loader2, Lock, User } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { comprimirImagen, idAleatorio } from '@/lib/imagen';
import { Aviso } from '@/components/ui/Aviso';
import { guardarVendedor, type DatosVendedor } from './actions';

type Inicial = Partial<Omit<DatosVendedor, 'ciFrentePath' | 'ciDorsoPath'>> & { tieneCi?: boolean };

const BANCOS = ['Banco Itaú', 'Banco Continental', 'Banco Basa', 'Ueno', 'Banco GNB', 'Banco Familiar', 'Banco Atlas', 'Sudameris', 'Visión Banco', 'Banco Río', 'Interfisa', 'Tigo Money', 'Billetera Personal', 'Otro'];

export function FormVendedor({ usuarioId, inicial, edicion }: { usuarioId: string; inicial: Inicial; edicion?: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [d, setD] = useState({
    alias: inicial.alias ?? '',
    ciudad: inicial.ciudad ?? '',
    nombreCompleto: inicial.nombreCompleto ?? '',
    ciNumero: inicial.ciNumero ?? '',
    whatsapp: inicial.whatsapp ?? '',
    banco: inicial.banco ?? '',
    tipoCuenta: inicial.tipoCuenta ?? ('caja_ahorro' as DatosVendedor['tipoCuenta']),
    numeroCuenta: inicial.numeroCuenta ?? '',
    titular: inicial.titular ?? '',
    ciTitular: inicial.ciTitular ?? '',
  });
  const [frente, setFrente] = useState<File | null>(null);
  const [dorso, setDorso] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });

  function validar(p: number) {
    if (p === 1) {
      if (!d.nombreCompleto.trim() || !d.ciNumero.trim() || !d.whatsapp.trim()) return 'Completá nombre, cédula y WhatsApp.';
      if (!d.alias.trim() || !d.ciudad.trim()) return 'Elegí un nombre de tienda y tu ciudad.';
    }
    if (p === 2 && !inicial.tieneCi && (!frente || !dorso)) return 'Subí la foto de la cédula de frente y de dorso.';
    if (p === 3 && (!d.banco || !d.numeroCuenta.trim() || !d.titular.trim() || !d.ciTitular.trim())) return 'Completá los datos de la cuenta.';
    return '';
  }

  async function subir(archivo: File | null, lado: string) {
    if (!archivo) return null;
    const supabase = crearClienteNavegador();
    const blob = await comprimirImagen(archivo, 1800, 0.85);
    const path = `${usuarioId}/ci-${lado}-${idAleatorio()}.jpg`;
    const { error } = await supabase.storage.from('documentos').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw new Error('No pudimos subir la foto de la cédula: ' + error.message);
    return path;
  }

  async function finalizar() {
    const e = validar(3);
    if (e) return setError(e);
    setError('');
    setGuardando(true);
    try {
      const [ciFrentePath, ciDorsoPath] = await Promise.all([subir(frente, 'frente'), subir(dorso, 'dorso')]);
      const r = await guardarVendedor({ ...d, ciFrentePath, ciDorsoPath });
      if (r.error) throw new Error(r.error);
      router.push(edicion ? '/vender?guardado=1' : '/vender/publicar?bienvenida=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= paso ? 'bg-violeta' : 'bg-violeta/15'}`} />
        ))}
      </div>

      {paso === 1 && (
        <section className="tarjeta space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-violeta"><User className="h-5 w-5" /> Tus datos</h2>
          <Campo label="Nombre y apellido (como en la cédula)"><input className="campo" value={d.nombreCompleto} onChange={set('nombreCompleto')} /></Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Número de cédula"><input className="campo" value={d.ciNumero} onChange={set('ciNumero')} inputMode="numeric" /></Campo>
            <Campo label="Celular (WhatsApp)"><input className="campo" value={d.whatsapp} onChange={set('whatsapp')} inputMode="tel" placeholder="0981 123 456" /></Campo>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Nombre de tu tienda (lo ven los compradores)"><input className="campo" value={d.alias} onChange={set('alias')} placeholder="Ej. El ropero de Mari" maxLength={30} /></Campo>
            <Campo label="Ciudad desde donde despachás"><input className="campo" value={d.ciudad} onChange={set('ciudad')} placeholder="Ej. Lambaré" /></Campo>
          </div>
          <Aviso tipo="protegido">Tu nombre, cédula y teléfono quedan con nosotros. El comprador solo ve el nombre de tu tienda y tu ciudad.</Aviso>
        </section>
      )}

      {paso === 2 && (
        <section className="tarjeta space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-violeta"><Camera className="h-5 w-5" /> Foto de la cédula</h2>
          <p className="text-sm text-carbon-500">La revisamos antes de liberar tu primer cobro. {inicial.tieneCi && 'Ya tenemos tu cédula: subí fotos nuevas solo si querés reemplazarlas.'}</p>
          <div className="grid grid-cols-2 gap-3">
            <FotoCi titulo="Frente" archivo={frente} onChange={setFrente} />
            <FotoCi titulo="Dorso" archivo={dorso} onChange={setDorso} />
          </div>
          <Aviso tipo="protegido">Se guardan en un archivo privado. Solo el equipo de Segunda Oportunidad puede verlas.</Aviso>
        </section>
      )}

      {paso === 3 && (
        <section className="tarjeta space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-violeta"><Landmark className="h-5 w-5" /> ¿Dónde te pagamos?</h2>
          <Campo label="Banco o billetera">
            <select className="campo" value={d.banco} onChange={set('banco')}>
              <option value="">Elegí…</option>
              {BANCOS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Campo>
          <div className="flex gap-2">
            {[
              ['caja_ahorro', 'Caja de ahorro'],
              ['cuenta_corriente', 'Cuenta corriente'],
              ['billetera', 'Billetera'],
            ].map(([v, n]) => (
              <button key={v} type="button" onClick={() => setD({ ...d, tipoCuenta: v as DatosVendedor['tipoCuenta'] })} className={`chip ${d.tipoCuenta === v ? 'chip-activo' : ''}`}>
                {n}
              </button>
            ))}
          </div>
          <Campo label={d.tipoCuenta === 'billetera' ? 'Número de la billetera' : 'Número de cuenta'}><input className="campo" value={d.numeroCuenta} onChange={set('numeroCuenta')} inputMode="numeric" /></Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Titular de la cuenta"><input className="campo" value={d.titular} onChange={set('titular')} /></Campo>
            <Campo label="Cédula o RUC del titular"><input className="campo" value={d.ciTitular} onChange={set('ciTitular')} /></Campo>
          </div>
          <div className="rounded-2xl bg-fondo p-4 text-[13px] text-carbon">
            <p className="mb-1 font-bold text-violeta">¿Cuándo cobro?</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>El comprador paga a Segunda Oportunidad.</li>
              <li>Te avisamos y despachás la prenda.</li>
              <li>Cuando el comprador la recibe, te transferimos lo vendido menos la comisión.</li>
            </ol>
          </div>
          {edicion && <Aviso tipo="alerta">Si cambiás la cuenta, la volvemos a verificar antes del próximo pago.</Aviso>}
        </section>
      )}

      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}

      <div className="mt-5 flex gap-3">
        {paso > 1 && (
          <button className="btn-secundario" onClick={() => setPaso(paso - 1)} disabled={guardando}>Atrás</button>
        )}
        {paso < 3 ? (
          <button
            className="btn-primario flex-1"
            onClick={() => {
              const e = validar(paso);
              setError(e);
              if (!e) setPaso(paso + 1);
            }}
          >
            Siguiente
          </button>
        ) : (
          <button className="btn-primario flex-1" onClick={finalizar} disabled={guardando}>
            {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {edicion ? 'Guardar cambios' : 'Crear mi cuenta de vendedor'}
          </button>
        )}
      </div>
    </div>
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

function FotoCi({ titulo, archivo, onChange }: { titulo: string; archivo: File | null; onChange: (f: File | null) => void }) {
  const url = archivo ? URL.createObjectURL(archivo) : null;
  return (
    <label className={`relative flex aspect-[3/2] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed ${archivo ? 'border-ok' : 'border-violeta/30 bg-lavanda/40'}`}>
      {url ? (
        <>
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <span className="relative flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-ok"><CheckCircle2 className="h-4 w-4" /> {titulo} cargado</span>
        </>
      ) : (
        <>
          <Camera className="h-6 w-6 text-violeta" />
          <span className="text-sm font-bold text-violeta">{titulo}</span>
        </>
      )}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}
