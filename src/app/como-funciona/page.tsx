import Link from 'next/link';
import { Camera, CreditCard, PackageCheck, Search, ShieldCheck, ShoppingBag, Truck, UserCheck, Wallet } from 'lucide-react';

export const metadata = { title: 'Cómo funciona' };

const COMPRA = [
  { i: Search, t: 'Explorá', d: 'Buscá por categoría, talle, estado y precio.' },
  { i: ShoppingBag, t: 'Armá tu carrito', d: 'Una o varias prendas, de distintos vendedores.' },
  { i: Truck, t: 'Elegí la entrega', d: 'Delivery, encomienda al interior o retiro en un punto.' },
  { i: CreditCard, t: 'Pagá por transferencia', d: 'A la cuenta de Segunda Oportunidad, y adjuntás el comprobante.' },
];
const VENTA = [
  { i: UserCheck, t: 'Registrate', d: 'Tus datos, la foto de tu cédula y tu cuenta de cobro.' },
  { i: Camera, t: 'Publicá', d: 'Fotos, talle, estado y precio. Ves al instante cuánto recibís.' },
  { i: PackageCheck, t: 'Despachá', d: 'Te avisamos la venta y coordinamos el envío.' },
  { i: Wallet, t: 'Cobrá', d: 'Te transferimos cuando el comprador recibe la prenda.' },
];

export default function ComoFunciona() {
  return (
    <div className="contenedor max-w-4xl space-y-8 pt-4 md:pt-8">
      <div>
        <h1 className="text-3xl font-extrabold text-violeta">Cómo funciona</h1>
        <p className="mt-1 text-carbon-500">Conectamos a quien quiere vender lo que ya no usa con quien busca ropa buena a buen precio. Todo pasa por nosotros.</p>
      </div>
      <Pasos titulo="Si comprás" pasos={COMPRA} />
      <div className="flex items-start gap-3 rounded-[24px] bg-violeta p-5 text-white">
        <ShieldCheck className="h-6 w-6 shrink-0 text-lima" />
        <p><b className="text-lima">Segunda Oportunidad en el medio:</b> cobramos al comprador, guardamos el pago y se lo transferimos al vendedor cuando se confirma la entrega. El comprador nunca ve los datos personales del vendedor.</p>
      </div>
      <Pasos titulo="Si vendés" pasos={VENTA} />
      <div className="flex flex-wrap gap-3">
        <Link href="/buscar" className="btn-primario">Explorar prendas</Link>
        <Link href="/vender" className="btn-lima">Empezar a vender</Link>
      </div>
    </div>
  );
}

function Pasos({ titulo, pasos }: { titulo: string; pasos: typeof COMPRA }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold text-violeta">{titulo}</h2>
      <ol className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {pasos.map(({ i: I, t, d }, n) => (
          <li key={t} className="tarjeta p-4">
            <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-lavanda text-violeta"><I className="h-5 w-5" /></span>
            <p className="font-bold">{n + 1}. {t}</p>
            <p className="text-sm text-carbon-500">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
