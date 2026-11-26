'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { comprimirImagen, idAleatorio } from '@/lib/imagen';
import { CATEGORIAS, ESTADOS_PRENDA, tallesPara } from '@/lib/catalogo';
import { gs, parseGs } from '@/lib/format';
import { urlFoto } from '@/lib/storage';
import { Aviso } from '@/components/ui/Aviso';
import { guardarPrenda, type DatosPrenda } from './actions';

type Foto = { path: string; subiendo?: boolean; local?: string };

export function FormPrenda({ usuarioId, comisionPct, inicial }: { usuarioId: string; comisionPct: number; inicial?: DatosPrenda }) {
  const router = useRouter();
  const [fotos, setFotos] = useState<Foto[]>((inicial?.fotos ?? []).map((path) => ({ path })));
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [categoria, setCategoria] = useState(inicial?.categoria ?? 'mujer');
  const [talle, setTalle] = useState(inicial?.talle ?? '');
  const [estado, setEstado] = useState(inicial?.estadoPrenda ?? '');
  const [marca, setMarca] = useState(inicial?.marca ?? '');
  const [color, setColor] = useState(inicial?.color ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [precio, setPrecio] = useState(inicial?.precioGs ? String(inicial.precioGs) : '');
  const [precioOriginal, setPrecioOriginal] = useState(inicial?.precioOriginalGs ? String(inicial.precioOriginalGs) : '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const precioNum = parseGs(precio);
  const recibe = Math.max(0, precioNum - Math.round((precioNum * comisionPct) / 100));
  const talles = tallesPara(categoria);
  const subiendo = fotos.some((f) => f.subiendo);

  async function agregarFotos(lista: FileList | null) {
    if (!lista) return;
    const archivos = Array.from(lista).slice(0, 6 - fotos.length);
    const supabase = crearClienteNavegador();
    const nuevas: Foto[] = archivos.map((a) => ({ path: `${usuarioId}/${idAleatorio()}.jpg`, subiendo: true, local: URL.createObjectURL(a) }));
    setFotos((f) => [...f, ...nuevas]);
    await Promise.all(
      archivos.map(async (a, i) => {
        const destino = nuevas[i].path;
        const blob = await comprimirImagen(a);
        const { error } = await supabase.storage.from('prendas').upload(destino, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        setFotos((f) =>
          error ? f.filter((x) => x.path !== destino) : f.map((x) => (x.path === destino ? { ...x, subiendo: false } : x)),
        );
        if (error) setError('No pudimos subir una foto: ' + error.message);
      }),
    );
  }

  async function publicar() {
    setError('');
    if (!fotos.length) return setError('Subí al menos una foto.');
    if (!titulo.trim()) return setError('Escribí un título.');
    if (!talle) return setError('Elegí el talle.');
    if (!estado) return setError('Elegí el estado de la prenda.');
    if (precioNum < 5000) return setError('Poné un precio (mínimo Gs. 5.000).');
    setGuardando(true);
    const r = await guardarPrenda({
      id: inicial?.id,
      titulo,
      descripcion,
      categoria,
      talle,
      marca,
      color,
      estadoPrenda: estado,
      precioGs: precioNum,
      precioOriginalGs: parseGs(precioOriginal) || null,
      fotos: fotos.map((f) => f.path),
    });
    if (!r.ok) {
      setError(r.error);
      setGuardando(false);
      return;
    }
    router.push(`/prenda/${r.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="tarjeta p-5">
        <p className="etiqueta-campo">Fotos ({fotos.length}/6) · la primera es la portada</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {fotos.map((f, i) => (
            <div key={f.path} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-lavanda">
              <img src={f.local ?? urlFoto(f.path)} alt="" className={`h-full w-full object-cover ${f.subiendo ? 'opacity-50' : ''}`} />
              {f.subiendo && <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-violeta" />}
              {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-violeta px-2 py-0.5 text-[10px] font-bold text-white">Portada</span>}
              <button type="button" onClick={() => setFotos(fotos.filter((x) => x.path !== f.path))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90" aria-label="Quitar foto">
                <X className="h-3.5 w-3.5" />
              </button>
              {i > 0 && !f.subiendo && (
                <button type="button" onClick={() => setFotos([f, ...fotos.filter((x) => x.path !== f.path)])} className="absolute bottom-1 left-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-violeta">
                  Portada
                </button>
              )}
            </div>
          ))}
          {fotos.length < 6 && (
            <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-violeta/40 bg-lavanda/40 text-violeta">
              <ImagePlus className="h-6 w-6" />
              <span className="text-[12px] font-bold">Agregar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
            </label>
          )}
        </div>
        <p className="mt-2 text-[12px] text-carbon-500">Con luz natural, de frente, dorso, etiqueta y algún detalle o defecto.</p>
      </section>

      <section className="tarjeta space-y-4 p-5">
        <label className="block">
          <span className="etiqueta-campo">Título</span>
          <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} placeholder="Ej. Campera de jean clásica" />
        </label>

        <Grupo titulo="Categoría">
          {CATEGORIAS.map((c) => (
            <Chip key={c.slug} activo={categoria === c.slug} onClick={() => { setCategoria(c.slug); if (!tallesPara(c.slug).includes(talle)) setTalle(''); }}>{c.nombre}</Chip>
          ))}
        </Grupo>
        <Grupo titulo="Talle">
          {talles.map((t) => (
            <Chip key={t} activo={talle === t} onClick={() => setTalle(t)}>{t}</Chip>
          ))}
        </Grupo>
        <Grupo titulo="Estado">
          {ESTADOS_PRENDA.map((e) => (
            <Chip key={e.valor} activo={estado === e.valor} onClick={() => setEstado(e.valor)}>{e.nombre}</Chip>
          ))}
        </Grupo>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta-campo">Marca (opcional)</span>
            <input className="campo" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Sin marca visible" />
          </label>
          <label className="block">
            <span className="etiqueta-campo">Color y material (opcional)</span>
            <input className="campo" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Azul · Algodón" />
          </label>
        </div>
        <label className="block">
          <span className="etiqueta-campo">Descripción (opcional)</span>
          <textarea className="campo h-24 py-3" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} placeholder="Medidas, detalles, por qué la vendés…" />
        </label>
      </section>

      <section className="tarjeta space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta-campo">Precio</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-carbon-500">Gs.</span>
              <input className="campo pl-12 text-lg font-extrabold text-violeta" inputMode="numeric" value={precioNum ? precioNum.toLocaleString('es-PY').replace(/,/g, '.') : ''} onChange={(e) => setPrecio(e.target.value)} placeholder="120.000" />
            </div>
          </label>
          <label className="block">
            <span className="etiqueta-campo">Precio original nuevo (opcional)</span>
            <input className="campo" inputMode="numeric" value={parseGs(precioOriginal) ? parseGs(precioOriginal).toLocaleString('es-PY').replace(/,/g, '.') : ''} onChange={(e) => setPrecioOriginal(e.target.value)} placeholder="Para mostrar el ahorro" />
          </label>
        </div>
        {precioNum > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-lima/30 px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-violeta"><Sparkles className="h-4 w-4" /> Vas a recibir</span>
            <span className="text-right">
              <span className="block text-lg font-extrabold text-violeta">{gs(recibe)}</span>
              <span className="block text-[11px] text-carbon-500">Comisión {comisionPct}% ({gs(precioNum - recibe)})</span>
            </span>
          </div>
        )}
      </section>

      {error && <Aviso tipo="error">{error}</Aviso>}
      <button className="btn-primario w-full" onClick={publicar} disabled={guardando || subiendo}>
        {(guardando || subiendo) && <Loader2 className="h-5 w-5 animate-spin" />}
        {subiendo ? 'Subiendo fotos…' : inicial?.id ? 'Guardar cambios' : 'Publicar prenda'}
      </button>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="etiqueta-campo">{titulo}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`chip ${activo ? 'chip-activo' : ''}`}>
      {children}
    </button>
  );
}
