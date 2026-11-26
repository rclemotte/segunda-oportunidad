import { Wallet } from 'lucide-react';
import { requerirAdmin } from '@/lib/sesion';
import { fecha, gs } from '@/lib/format';
import { Vacio } from '@/components/ui/Vacio';
import { BotonAccion } from '../Boton';
import { liquidar } from '../actions';

export default async function Liquidaciones() {
  const { supabase } = await requerirAdmin();
  const [{ data: saldos }, { data: historial }] = await Promise.all([
    supabase.from('saldos_vendedor').select('*').gt('disponible_gs', 0),
    supabase.from('liquidaciones').select('*, vendedores(alias)').order('creado_en', { ascending: false }).limit(30),
  ]);

  const ids = (saldos ?? []).map((s) => s.vendedor_id);
  const { data: vendedores } = ids.length
    ? await supabase.from('vendedores').select('perfil_id, alias, estado_kyc, cuentas_cobro(banco, tipo_cuenta, numero_cuenta, titular, ci_titular, verificada)').in('perfil_id', ids)
    : { data: [] };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-lg font-extrabold text-violeta">Saldos para transferir</h2>
        <p className="mb-3 text-sm text-carbon-500">Transferí desde la banca web y registrá la transferencia acá. Solo se paga a vendedores aprobados con la cuenta verificada.</p>
        {!saldos?.length && <Vacio icono={Wallet} titulo="No hay saldos disponibles" texto="Aparecen cuando un comprador confirma que recibió su pedido." />}
        <div className="space-y-3">
          {(saldos ?? []).map((s) => {
            const v = (vendedores ?? []).find((x) => x.perfil_id === s.vendedor_id) as unknown as {
              alias: string;
              estado_kyc: string;
              cuentas_cobro: { banco: string; tipo_cuenta: string; numero_cuenta: string; titular: string; ci_titular: string; verificada: boolean } | null;
            } | undefined;
            const c = v?.cuentas_cobro;
            const habilitado = v?.estado_kyc === 'aprobado' && c?.verificada;
            return (
              <article key={s.vendedor_id} className="tarjeta flex flex-wrap items-center gap-4 p-4 text-sm">
                <div className="flex-1">
                  <p className="font-extrabold text-violeta">{v?.alias}</p>
                  <p>{c ? `${c.banco} · ${c.tipo_cuenta.replace('_', ' ')} · ${c.numero_cuenta}` : 'Sin cuenta cargada'}</p>
                  <p className="text-carbon-500">{c?.titular} · {c?.ci_titular}</p>
                  {!habilitado && <p className="font-bold text-alerta">Falta aprobar al vendedor o verificar la cuenta.</p>}
                </div>
                <p className="text-xl font-extrabold text-violeta">{gs(s.disponible_gs)}</p>
                {habilitado && (
                  <BotonAccion accion={liquidar} args={[s.vendedor_id]} texto="Registrar transferencia" pedirTexto={`Transferiste ${gs(s.disponible_gs)}. Número de operación o referencia:`} />
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-violeta">Últimas liquidaciones</h2>
        <ul className="tarjeta divide-y divide-carbon/5 px-4 text-sm">
          {(historial ?? []).map((l) => (
            <li key={l.id} className="flex justify-between py-3">
              <span>{(l.vendedores as { alias: string } | null)?.alias} · {fecha(l.creado_en)} {l.referencia && <span className="text-carbon-500">· ref {l.referencia}</span>}</span>
              <b>{gs(l.monto_gs)}</b>
            </li>
          ))}
          {!historial?.length && <li className="py-3 text-carbon-500">Todavía no hay liquidaciones.</li>}
        </ul>
      </section>
    </div>
  );
}
