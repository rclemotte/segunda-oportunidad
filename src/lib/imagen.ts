'use client';

/** Achica y comprime una foto en el navegador antes de subirla (ahorra datos móviles). */
export async function comprimirImagen(archivo: File, ladoMax = 1600, calidad = 0.82): Promise<Blob> {
  if (!archivo.type.startsWith('image/')) return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', calidad));
    return blob ?? archivo;
  } catch {
    return archivo; // formatos que el navegador no decodifica (ej. HEIC en algunos Android)
  }
}

export function idAleatorio() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
