export type Prenda = {
  id: string;
  vendedor_id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  talle: string;
  marca: string;
  color: string;
  estado_prenda: string;
  precio_gs: number;
  precio_original_gs: number | null;
  fotos: string[];
  estado: 'activa' | 'pausada' | 'reservada' | 'vendida' | 'retirada';
  creado_en: string;
  vendedor_alias?: string;
  vendedor_ciudad?: string;
  vendedor_verificado?: boolean;
};

export type ItemCarrito = {
  id: string;
  titulo: string;
  precio_gs: number;
  talle: string;
  foto: string;
  vendedor_id: string;
  vendedor_alias: string;
};
