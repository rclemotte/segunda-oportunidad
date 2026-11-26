import { VistaCarrito } from './VistaCarrito';

export const metadata = { title: 'Mi carrito' };

export default function Carrito() {
  return (
    <div className="contenedor max-w-3xl pt-4 md:pt-8">
      <VistaCarrito />
    </div>
  );
}
