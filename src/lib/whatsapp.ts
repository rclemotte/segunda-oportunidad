/** Link a WhatsApp a partir de un celular paraguayo (0981 123 456 → 595981123456). */
export function linkWhatsapp(telefono: string | null | undefined, texto?: string) {
  if (!telefono) return null;
  let n = telefono.replace(/\D/g, '');
  if (n.startsWith('0')) n = '595' + n.slice(1);
  else if (!n.startsWith('595')) n = '595' + n;
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}
