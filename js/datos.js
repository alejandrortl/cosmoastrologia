// Acceso al contenido del curso.
// Al publicar, Vercel copia el curso de Supabase dentro de la propia web (scripts/copiar-curso.mjs),
// en /curso/curso.json, con las imágenes en /curso/medios/. La web lee esa copia, así que se muestra
// aunque Supabase no responda, y el modo sin conexión la puede guardar entera.
// Si la copia no existe (por ejemplo, al probar la web en local sin el paso de build), se lee
// directamente de Supabase. La clave publicable solo permite leer lo publicado.

export const SUPABASE_URL = 'https://gjkvcdkidjxenhfgxvkc.supabase.co';
const CLAVE = 'sb_publishable_G1TkZy2turQoRMREgLqsNQ_hZbcLteH';

let copia = null;
function copiaLocal() {
  copia ||= fetch('/curso/curso.json')
    .then((r) => {
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error('sin copia');
      return r.json();
    })
    .then((c) => c.modulos)
    .catch(() => null);
  return copia;
}

async function consultar(ruta) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: { apikey: CLAVE, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`La base de datos respondió ${r.status}`);
  return r.json();
}

function ordenar(modulo) {
  modulo.secciones = (modulo.secciones || []).sort((a, b) => a.orden - b.orden);
  for (const s of modulo.secciones) s.bloques = (s.bloques || []).sort((a, b) => a.orden - b.orden);
  return modulo;
}

export async function listarModulos() {
  const local = await copiaLocal();
  if (local) return local.map(({ numero, slug, titulo, resumen, publicado }) => ({ numero, slug, titulo, resumen, publicado }));
  return consultar('modulos?select=numero,slug,titulo,resumen,publicado&order=numero.asc');
}

export async function cargarModulo(slug) {
  const local = await copiaLocal();
  if (local) {
    const m = local.find((x) => x.slug === slug);
    return m ? ordenar(structuredClone(m)) : null;
  }
  const filas = await consultar(
    `modulos?slug=eq.${encodeURIComponent(slug)}` +
    '&select=numero,slug,titulo,resumen,publicado,secciones(orden,slug,titulo,bloques(orden,tipo,contenido))'
  );
  return filas[0] ? ordenar(filas[0]) : null;
}

export function urlMedio(contenido) {
  if (contenido.url) return contenido.url;
  if (contenido.ruta) return `${SUPABASE_URL}/storage/v1/object/public/medios/${contenido.ruta}`;
  return '';
}
