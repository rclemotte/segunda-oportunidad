import { Inbox } from 'lucide-react';
import { requerirAdmin } from '@/lib/sesion';
import { fecha } from '@/lib/format';
import { linkWhatsapp } from '@/lib/whatsapp';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Vacio } from '@/components/ui/Vacio';
import { BotonAccion } from '../Boton';
import { aprobarVendedor, rechazarVendedor, verificarCuenta } from '../actions';

type V = {
  perfil_id: string;
  alias: string;
  ciudad: string;
  estado_kyc: string;
  motivo_rechazo: string | null;
  creado_en: string;
  vendedores_privado: { nombre_completo: string; ci_numero: string; whatsapp: string; ci_frente_path: string | null; ci_dorso_path: string | null } | null;
  cuentas_cobro: { banco: string; tipo_cuenta: string; numero_cuenta: string; titular: string; ci_titular: string; verificada: boolean } | null;
};

const TONO = { pendiente: 'alerta', aprobado: 'ok', rechazado: 'error' } as const;

export default async function VendedoresAdmin({ searchParams }: { searchParams: { ver?: string } }) {
  const { supabase } = await requerirAdmin();
  let q = supabase
    .from('vendedores')
    .select('*, vendedores_privado(nombre_completo, ci_numero, whatsapp, ci_frente_path, ci_dorso_path), cuentas_cobro(banco, tipo_cuenta, numero_cuenta, titular, ci_titular, verificada)')
    .order('creado_en', { ascending: false });
  if (searchParams.ver !== 'todos') q = q.eq('estado_kyc', 'pendiente');
  const { data } = await q;
  const vendedores = (data ?? []) as unknown as V[];

  // Fotos de cédula: URLs firmadas de 10 minutos; cada apertura queda en auditoría
  const urls = await Promise.all(
    vendedores.map(async (v) => {
      const paths = [v.vendedores_privado?.ci_frente_path, v.vendedores_privado?.ci_dorso_path].filter(Boolean) as string[];
      if (!paths.length) return [];
      const { data } = await supabase.storage.from('documentos').createSignedUrls(paths, 600);
      await supabase.rpc('registrar_auditoria', { p_accion: 'ver_kyc', p_entidad: 'vendedores', p_entidad_id: v.perfil_id });
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    }),
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <a href="/admin/vendedores" className={`chip ${searchParams.ver !== 'todos' ? 'chip-activo' : ''}`}>Por aprobar</a>
        <a href="/admin/vendedores?ver=todos" className={`chip ${searchParams.ver === 'todos' ? 'chip-activo' : ''}`}>Todos</a>
      </div>
      {!vendedores.length && <Vacio icono={Inbox} titulo="No hay vendedores por aprobar" />}
      {vendedores.map((v, i) => {
        const p = v.vendedores_privado;
        const c = v.cuentas_cobro;
        const w = linkWhatsapp(p?.whatsapp);
        const nombreCoincide = p && c && p.nombre_completo.trim().toLowerCase() === c.titular.trim().toLowerCase();
        return (
          <article key={v.perfil_id} className="tarjeta grid gap-4 p-5 md:grid-cols-[1fr_320px]">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-violeta">{v.alias}</h2>
                <Etiqueta tono={TONO[v.estado_kyc as keyof typeof TONO]}>{v.estado_kyc}</Etiqueta>
              </div>
              <p className="text-carbon-500">{v.ciudad} · desde {fecha(v.creado_en)}</p>
              <dl className="mt-3 grid grid-cols-[130px_1fr] gap-y-1">
                <dt className="text-carbon-500">Nombre</dt><dd className="font-semibold">{p?.nombre_completo}</dd>
                <dt className="text-carbon-500">Cédula</dt><dd className="font-semibold">{p?.ci_numero}</dd>
                <dt className="text-carbon-500">WhatsApp</dt><dd>{w ? <a href={w} target="_blank" rel="noreferrer" className="font-semibold text-violeta underline">{p?.whatsapp}</a> : '—'}</dd>
                <dt className="text-carbon-500">Cuenta</dt>
                <dd className="font-semibold">
                  {c ? `${c.banco} · ${c.tipo_cuenta.replace('_', ' ')} · ${c.numero_cuenta}` : '—'}
                  {c && (c.verificada ? <span className="ml-2 text-ok">verificada</span> : <span className="ml-2 text-alerta">sin verificar</span>)}
                </dd>
                <dt className="text-carbon-500">Titular</dt><dd className="font-semibold">{c?.titular} · {c?.ci_titular}</dd>
              </dl>
              {c && !nombreCoincide && <p className="mt-2 text-[12px] font-bold text-alerta">Ojo: el titular de la cuenta no coincide con el nombre de la cédula.</p>}
              {v.motivo_rechazo && <p className="mt-2 text-error">Motivo del rechazo: {v.motivo_rechazo}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {v.estado_kyc !== 'aprobado' && <BotonAccion accion={aprobarVendedor} args={[v.perfil_id]} texto="Aprobar vendedor" confirmar="¿Cédula legible y titular coincide?" />}
                {v.estado_kyc !== 'rechazado' && <BotonAccion accion={rechazarVendedor} args={[v.perfil_id]} texto="Rechazar" clase="btn-peligro h-10 px-4 text-sm" pedirTexto="Motivo (lo ve el vendedor):" />}
                {v.estado_kyc === 'aprobado' && c && !c.verificada && <BotonAccion accion={verificarCuenta} args={[v.perfil_id]} texto="Verificar nueva cuenta" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {urls[i].length ? urls[i].map((u, k) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-carbon/10">
                  <img src={u} alt={k === 0 ? 'Cédula frente' : 'Cédula dorso'} className="aspect-[3/2] w-full object-cover" />
                </a>
              )) : <p className="col-span-2 text-sm text-error">Sin fotos de cédula</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
