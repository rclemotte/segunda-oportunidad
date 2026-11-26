// Valores fijos del catálogo. Las categorías también están en la tabla `categorias`.

export const CATEGORIAS = [
  { slug: 'mujer', nombre: 'Mujer' },
  { slug: 'hombre', nombre: 'Hombre' },
  { slug: 'ninos', nombre: 'Niños' },
  { slug: 'calzados', nombre: 'Calzados' },
  { slug: 'accesorios', nombre: 'Accesorios' },
  { slug: 'deportivo', nombre: 'Deportivo' },
  { slug: 'premium', nombre: 'Premium' },
  { slug: 'ofertas', nombre: 'Ofertas' },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]['slug'];

export function nombreCategoria(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug)?.nombre ?? slug;
}

export const ESTADOS_PRENDA = [
  { valor: 'nuevo_etiqueta', nombre: 'Nuevo con etiqueta' },
  { valor: 'como_nuevo', nombre: 'Como nuevo' },
  { valor: 'muy_bueno', nombre: 'Muy bueno' },
  { valor: 'bueno', nombre: 'Bueno' },
] as const;

export function nombreEstadoPrenda(valor: string) {
  return ESTADOS_PRENDA.find((e) => e.valor === valor)?.nombre ?? valor;
}

export const TALLES_ROPA = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];
// Calzados: numeración US (championes), del 4 al 14 con medios números. Se guarda como "US 8.5".
export const TALLES_CALZADO = Array.from({ length: 21 }, (_, i) => `US ${4 + i / 2}`);
export const TALLES_NINOS = ['2', '4', '6', '8', '10', '12', '14', '16'];

export function tallesPara(categoria: string) {
  if (categoria === 'calzados') return TALLES_CALZADO;
  if (categoria === 'ninos') return TALLES_NINOS;
  if (categoria === 'accesorios') return ['Único'];
  return TALLES_ROPA;
}

export const ESTADOS_PEDIDO: Record<string, { nombre: string; tono: 'ok' | 'alerta' | 'error' | 'violeta' | 'gris' }> = {
  pago_en_revision: { nombre: 'Validando pago', tono: 'alerta' },
  preparar_envio: { nombre: 'Preparar envío', tono: 'violeta' },
  en_camino: { nombre: 'En camino', tono: 'alerta' },
  entregado: { nombre: 'Entregado', tono: 'ok' },
  cancelado: { nombre: 'Cancelado', tono: 'error' },
};

export const ESTADOS_PAGO: Record<string, { nombre: string; tono: 'ok' | 'alerta' | 'error' }> = {
  en_revision: { nombre: 'Validando transferencia', tono: 'alerta' },
  aprobado: { nombre: 'Pago confirmado', tono: 'ok' },
  rechazado: { nombre: 'Pago rechazado', tono: 'error' },
};

export const COMISION_PCT_DEFAULT = 15;

export const DEPARTAMENTOS = [
  'Asunción', 'Central', 'Alto Paraná', 'Itapúa', 'Cordillera', 'Paraguarí', 'Caaguazú', 'Guairá',
  'Misiones', 'Ñeembucú', 'San Pedro', 'Concepción', 'Amambay', 'Canindeyú', 'Caazapá',
  'Presidente Hayes', 'Boquerón', 'Alto Paraguay',
];
