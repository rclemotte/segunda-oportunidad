/** URL pública de una foto del bucket `prendas`. */
export function urlFoto(path: string | null | undefined): string {
  if (!path) return '/icons/placeholder.svg';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prendas/${path}`;
}
