const nf = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });

/** Gs. 180.000 */
export function gs(monto: number | null | undefined): string {
  return `Gs. ${nf.format(Math.round(monto ?? 0)).replace(/,/g, '.')}`;
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Asuncion',
  });
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-PY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Asuncion',
  });
}

export function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min <= 1 ? 'Publicado recién' : `Publicado hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Publicado hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Publicado ayer' : `Publicado hace ${d} días`;
}

/** Convierte "180.000" o "180000" a 180000 */
export function parseGs(texto: string): number {
  return Number(String(texto).replace(/[^\d]/g, '')) || 0;
}
