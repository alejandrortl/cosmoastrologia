// Copia el curso dentro de la web al publicar (lo ejecuta Vercel como comando de build).
//
// 0. Monta la web en public/ (lo que Vercel publica) con los archivos del repositorio.
// 1. Lee todos los módulos, secciones y bloques de Supabase.
// 2. Descarga las imágenes que usan los bloques (de Supabase o de otros servidores) a
//    public/curso/medios/, con el nombre sacado de su contenido, y cambia las rutas en los bloques.
// 3. Escribe public/curso/curso.json y public/curso/archivos.json (la lista que guarda el modo
//    sin conexión).
//
// Así la web no necesita Supabase para mostrarse. Si Supabase no responde (por ejemplo, porque
// el proyecto se ha pausado), se copia el curso de la web ya publicada, para que un cambio de
// código se pueda publicar igual. Si tampoco eso funciona, la web se publica sin copia y lee de
// Supabase directamente, como antes.
//
// Uso: node scripts/copiar-curso.mjs
// Variables opcionales: WEB_PUBLICADA (por defecto https://cosmoastrologia-xi.vercel.app)

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(RAIZ, 'public');
const SALIDA = join(WEB, 'curso');
// Lo que se publica del repositorio
const PUBLICAR = ['index.html', 'sw.js', 'manifest.webmanifest', 'css', 'js', 'img', 'audio'];
const MEDIOS = join(SALIDA, 'medios');

const SUPABASE_URL = 'https://gjkvcdkidjxenhfgxvkc.supabase.co';
const CLAVE = 'sb_publishable_G1TkZy2turQoRMREgLqsNQ_hZbcLteH';
const WEB_PUBLICADA = (process.env.WEB_PUBLICADA || 'https://cosmoastrologia-xi.vercel.app').replace(/\/+$/, '');

// Campos de un bloque que apuntan a un archivo que conviene tener dentro de la web
const CAMPOS_MEDIO = ['url', 'grande'];
const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'audio/mpeg': '.mp3' };

async function pedir(url, opciones = {}, intentos = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r;
    } catch (e) {
      if (i >= intentos) throw new Error(`${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 1500 * i));
    }
  }
}

async function cursoDeSupabase() {
  const r = await pedir(
    `${SUPABASE_URL}/rest/v1/modulos?order=numero.asc` +
    '&select=numero,slug,titulo,resumen,publicado,secciones(orden,slug,titulo,bloques(orden,tipo,contenido))',
    { headers: { apikey: CLAVE, Accept: 'application/json' } },
    2,
  );
  const modulos = await r.json();
  if (!Array.isArray(modulos) || !modulos.length) throw new Error('Supabase no ha devuelto ningún módulo');
  for (const m of modulos) {
    m.secciones = (m.secciones || []).sort((a, b) => a.orden - b.orden);
    for (const s of m.secciones) s.bloques = (s.bloques || []).sort((a, b) => a.orden - b.orden);
  }
  return modulos;
}

function urlDeRuta(ruta) {
  return `${SUPABASE_URL}/storage/v1/object/public/medios/${ruta}`;
}

// Descarga un archivo y lo guarda con un nombre que depende de su contenido (nunca cambia
// para el mismo archivo, así el navegador lo puede guardar para siempre).
const yaBajados = new Map();
async function bajar(url) {
  if (!yaBajados.has(url)) {
    yaBajados.set(url, (async () => {
      const r = await pedir(url, { headers: { 'User-Agent': 'cosmoastrologia-build/1.0' } });
      const datos = Buffer.from(await r.arrayBuffer());
      const tipo = (r.headers.get('content-type') || '').split(';')[0].trim();
      let ext = extname(new URL(url).pathname).toLowerCase();
      if (!/^\.(jpe?g|png|webp|gif|svg|mp3)$/.test(ext)) ext = TIPOS[tipo] || '.bin';
      if (ext === '.jpeg') ext = '.jpg';
      const nombre = createHash('sha256').update(datos).digest('hex').slice(0, 16) + ext;
      await writeFile(join(MEDIOS, nombre), datos);
      return { local: `/curso/medios/${nombre}`, bytes: datos.length };
    })());
  }
  return yaBajados.get(url);
}

// Recorre los bloques y cambia cada imagen externa por su copia local. Si una no se puede
// bajar, se deja la dirección original (la web la sigue cargando de fuera, como antes).
async function copiarMedios(modulos, base) {
  let bien = 0, mal = 0, bytes = 0;
  const tareas = [];
  for (const m of modulos) for (const s of m.secciones) for (const b of s.bloques) {
    const c = b.contenido;
    if (!c || !['imagen', 'audio'].includes(b.tipo)) continue;
    if (c.ruta && !c.url) { c.url = urlDeRuta(c.ruta); delete c.ruta; }
    for (const campo of CAMPOS_MEDIO) {
      const original = c[campo];
      if (!original || typeof original !== 'string') continue;
      const url = original.startsWith('/') ? base + original : original;
      if (!/^https?:\/\//.test(url)) continue;
      tareas.push(() => bajar(url).then(
        (r) => { c[campo] = r.local; bien++; bytes += r.bytes; },
        (e) => { console.warn(`  aviso: no se ha podido copiar ${original} (${e.message})`); mal++; },
      ));
    }
  }
  // Pocas descargas a la vez, para no saturar a nadie
  for (let i = 0; i < tareas.length; i += 6) await Promise.all(tareas.slice(i, i + 6).map((t) => t()));
  console.log(`  ${bien} archivos copiados (${(bytes / 1e6).toFixed(1)} MB)${mal ? `, ${mal} se quedan fuera` : ''}`);
}

async function listar(dir) {
  const salida = [];
  for (const e of await readdir(join(WEB, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) salida.push(...await listar(rel));
    else salida.push(`/${rel}`);
  }
  return salida;
}

async function main() {
  await rm(WEB, { recursive: true, force: true });
  for (const a of PUBLICAR) await cp(join(RAIZ, a), join(WEB, a), { recursive: true });
  await mkdir(MEDIOS, { recursive: true });

  let modulos = null, origen;
  try {
    console.log('Leyendo el curso de Supabase…');
    modulos = await cursoDeSupabase();
    origen = 'supabase';
    await copiarMedios(modulos, '');
  } catch (e) {
    console.warn(`  Supabase no responde (${e.message}).`);
    try {
      console.log(`Copiando el curso de la web publicada (${WEB_PUBLICADA})…`);
      const r = await pedir(`${WEB_PUBLICADA}/curso/curso.json`, { headers: { 'Cache-Control': 'no-cache' } });
      ({ modulos } = await r.json());
      origen = 'web publicada';
      await copiarMedios(modulos, WEB_PUBLICADA);
    } catch (e2) {
      modulos = null;
      console.warn(`  Tampoco se ha podido (${e2.message}).`);
      console.warn('AVISO: se publica sin copia del curso; la web leerá de Supabase directamente.');
    }
  }

  if (modulos) {
    const curso = { generado: new Date().toISOString(), origen, modulos };
    await writeFile(join(SALIDA, 'curso.json'), JSON.stringify(curso));
  }

  // Lo que el modo sin conexión guarda al instalarse (el audio se guarda aparte, a petición)
  const archivos = [
    '/', '/manifest.webmanifest', ...(modulos ? ['/curso/curso.json'] : []), '/audio/indice.json',
    ...await listar('css'), ...await listar('js'), ...await listar('img'),
    ...(await readdir(MEDIOS)).map((n) => `/curso/medios/${n}`),
  ];
  const huella = createHash('sha256');
  for (const a of archivos) {
    if (a === '/') huella.update(await readFile(join(WEB, 'index.html')));
    else huella.update(a).update(await readFile(join(WEB, a)));
  }
  await writeFile(join(SALIDA, 'archivos.json'), JSON.stringify({ version: huella.digest('hex').slice(0, 16), archivos }));

  if (modulos) {
    const publicados = modulos.filter((m) => m.publicado).length;
    console.log(`Curso copiado desde ${origen}: ${modulos.length} módulos (${publicados} publicados).`);
  }
  console.log(`Web lista en public/ (${archivos.length} archivos para usar sin conexión).`);
}

main().catch((e) => { console.error(`No se ha podido montar la web: ${e.message}`); process.exit(1); });
