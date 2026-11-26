export const metadata = { title: 'Términos y privacidad' };

// Borrador: revisar con un abogado/contador antes del lanzamiento.
export default function Terminos() {
  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <article className="tarjeta space-y-4 p-6 text-[15px] leading-relaxed">
        <h1 className="text-2xl font-extrabold text-violeta">Términos y privacidad</h1>
        <p className="rounded-xl bg-alerta-bg p-3 text-sm text-alerta">Versión preliminar. Se reemplaza por el texto final antes del lanzamiento.</p>
        <h2 className="font-extrabold text-violeta">Cómo intermediamos</h2>
        <p>Segunda Oportunidad cobra al comprador, retiene el pago mientras la prenda viaja y lo transfiere al vendedor, descontando la comisión, cuando se confirma la entrega.</p>
        <h2 className="font-extrabold text-violeta">Qué no se puede vender</h2>
        <p>Réplicas de marcas, ropa interior usada, prendas sucias o rotas sin declarar, fotos sacadas de internet y artículos que no sean ropa, calzado o accesorios. No se permiten teléfonos, emails ni links en las publicaciones.</p>
        <h2 className="font-extrabold text-violeta">Tus datos</h2>
        <p>La cédula, el teléfono y la cuenta bancaria del vendedor se guardan en almacenamiento privado y solo los ve el equipo de Segunda Oportunidad para verificar identidad y pagar. Los datos de entrega del comprador se usan solo para coordinar el envío.</p>
      </article>
    </div>
  );
}
