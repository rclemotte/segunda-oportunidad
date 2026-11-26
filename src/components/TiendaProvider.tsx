'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ItemCarrito } from '@/lib/tipos';

type Tienda = {
  carrito: ItemCarrito[];
  agregar: (item: ItemCarrito) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
  enCarrito: (id: string) => boolean;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
  esFavorito: (id: string) => boolean;
  listo: boolean;
};

const Ctx = createContext<Tienda | null>(null);

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado: no persiste */
  }
}

export function TiendaProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setCarrito(leer('so-carrito', []));
    setFavoritos(leer('so-favoritos', []));
    setListo(true);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (listo) guardar('so-carrito', carrito);
  }, [carrito, listo]);

  useEffect(() => {
    if (listo) guardar('so-favoritos', favoritos);
  }, [favoritos, listo]);

  const agregar = useCallback((item: ItemCarrito) => {
    setCarrito((c) => (c.some((i) => i.id === item.id) ? c : [...c, item]));
  }, []);
  const quitar = useCallback((id: string) => setCarrito((c) => c.filter((i) => i.id !== id)), []);
  const vaciar = useCallback(() => setCarrito([]), []);
  const alternarFavorito = useCallback(
    (id: string) => setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f])),
    [],
  );

  const valor = useMemo<Tienda>(
    () => ({
      carrito,
      agregar,
      quitar,
      vaciar,
      enCarrito: (id) => carrito.some((i) => i.id === id),
      favoritos,
      alternarFavorito,
      esFavorito: (id) => favoritos.includes(id),
      listo,
    }),
    [carrito, favoritos, listo, agregar, quitar, vaciar, alternarFavorito],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useTienda() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTienda fuera de TiendaProvider');
  return c;
}
