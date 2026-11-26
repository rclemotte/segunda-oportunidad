import Link from 'next/link';
import { ArrowRight, ShieldCheck, Shirt, Truck, Wallet } from 'lucide-react';
import { CATEGORIAS } from '@/lib/catalogo';
import { consultarCatalogo } from '@/lib/consultas';
import { GrillaPrendas } from '@/components/TarjetaPrenda';
import { IconoCategoria } from '@/components/IconoCategoria';
import { Isotipo } from '@/components/Logo';
import { Vacio } from '@/components/ui/Vacio';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const prendas = await consultarCatalogo({ limite: 20 });

  return (
    <div className="contenedor space-y-8 pt-4 md:pt-8">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-[28px] bg-violeta px-6 py-8 text-white md:px-12 md:py-14">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-5xl">
            Tu estilo también tiene una <span className="text-lima">segunda oportunidad.</span>
          </h1>
          <p className="mt-3 text-sm text-white/75 md:text-base">
            Ropa, calzados y accesorios de segunda mano en Paraguay, con pago protegido hasta que recibís tu prenda.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/buscar" className="btn-lima h-11">
              Explorar ahora <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/vender" className="btn h-11 border border-white/30 text-white hover:bg-white/10">
              Empezar a vender
            </Link>
          </div>
        </div>
        <Isotipo className="absolute -bottom-10 -right-10 h-56 w-56 opacity-20 md:right-10 md:top-1/2 md:h-72 md:w-72 md:-translate-y-1/2 md:opacity-90" color="#D9FF00" />
      </section>

      {/* Categorías */}
      <section>
        <div className="sin-scroll -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:px-0">
          {CATEGORIAS.map((c) => (
            <Link key={c.slug} href={`/buscar?categoria=${c.slug}`} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 md:w-auto">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-violeta shadow-tarjeta transition hover:bg-lavanda md:h-16 md:w-16">
                <IconoCategoria slug={c.slug} />
              </span>
              <span className="text-[12px] font-semibold">{c.nombre}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recién publicados */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-extrabold text-violeta">Recién publicados</h2>
          <Link href="/buscar" className="text-sm font-bold text-violeta">Ver todo →</Link>
        </div>
        {prendas.length ? (
          <GrillaPrendas prendas={prendas} />
        ) : (
          <Vacio
            icono={Shirt}
            titulo="Todavía no hay prendas publicadas"
            texto="Sé la primera persona en darle otra oportunidad a tu ropa."
            accion={{ href: '/vender/publicar', label: 'Publicar una prenda' }}
          />
        )}
      </section>

      {/* Confianza */}
      <section className="grid gap-3 md:grid-cols-3">
        {[
          { i: ShieldCheck, t: 'Compra protegida', d: 'Le pagás a Segunda Oportunidad. El vendedor cobra cuando recibís la prenda.' },
          { i: Truck, t: 'Te lo llevamos', d: 'Delivery en Gran Asunción, encomienda al interior o retiro en un punto aliado.' },
          { i: Wallet, t: 'Vendé lo que no usás', d: 'Publicás en dos minutos desde el celular y cobrás por transferencia.' },
        ].map(({ i: I, t, d }) => (
          <div key={t} className="tarjeta flex gap-3 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lavanda text-violeta">
              <I className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-violeta">{t}</p>
              <p className="text-sm text-carbon-500">{d}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
