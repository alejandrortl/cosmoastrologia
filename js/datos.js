// Acceso a la base de datos del curso (Supabase).
// La clave publicable solo permite leer lo publicado (lo controlan las políticas de la base de datos).

export const SUPABASE_URL = 'https://gjkvcdkidjxenhfgxvkc.supabase.co';
const CLAVE = 'sb_publishable_G1TkZy2turQoRMREgLqsNQ_hZbcLteH';

async function consultar(ruta) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: { apikey: CLAVE, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`La base de datos respondió ${r.status}`);
  return r.json();
}

export function listarModulos() {
  return consultar('modulos?select=numero,slug,titulo,resumen,publicado&order=numero.asc');
}

export async function cargarModulo(slug) {
  const filas = await consultar(
    `modulos?slug=eq.${encodeURIComponent(slug)}` +
    '&select=numero,slug,titulo,resumen,publicado,secciones(orden,slug,titulo,bloques(orden,tipo,contenido))'
  );
  const modulo = filas[0];
  if (!modulo) return null;
  modulo.secciones = (modulo.secciones || []).sort((a, b) => a.orden - b.orden);
  for (const s of modulo.secciones) s.bloques = (s.bloques || []).sort((a, b) => a.orden - b.orden);
  return modulo;
}

export function urlMedio(contenido) {
  if (contenido.url) return contenido.url;
  if (contenido.ruta) return `${SUPABASE_URL}/storage/v1/object/public/medios/${contenido.ruta}`;
  return '';
}
