// Sirve una copia del curso (la carpeta que monta scripts/copiar-curso.mjs) en tu propio
// servidor, sin depender de Vercel ni de Supabase. No necesita instalar nada: solo Node 18 o más.
//
// Uso: node scripts/servir-local.mjs [CARPETA] [PUERTO]
//   CARPETA  por defecto public/ (o la variable CARPETA)
//   PUERTO   por defecto 8080 (o la variable PUERTO)
//
// Hace lo mismo que vercel.json: /modulo/... abre index.html, y /algo abre /algo.html si existe.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(import.meta.url), '..', '..');
const CARPETA = resolve(process.argv[2] || process.env.CARPETA || join(RAIZ, 'public'));
const PUERTO = Number(process.argv[3] || process.env.PUERTO || 8080);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8',
};

async function esArchivo(ruta) {
  try { return (await stat(ruta)).isFile(); } catch { return false; }
}

// Traduce la dirección pedida a un archivo de la copia (o null si no existe)
async function buscar(pathname) {
  let ruta;
  try { ruta = decodeURIComponent(pathname); } catch { return null; }
  if (ruta.startsWith('/modulo/')) return join(CARPETA, 'index.html');
  const completa = normalize(join(CARPETA, ruta));
  if (completa !== CARPETA && !completa.startsWith(CARPETA + sep)) return null; // fuera de la carpeta
  for (const candidata of [completa, join(completa, 'index.html'), completa + '.html']) {
    if (await esArchivo(candidata)) return candidata;
  }
  return null;
}

function cabecerasCache(ruta) {
  if (/\/(curso\/medios|audio)\/[^/]+\.(mp3|jpg|png|webp|gif|svg)$/.test(ruta)) return 'public, max-age=31536000, immutable';
  return 'public, max-age=0, must-revalidate';
}

const servidor = createServer(async (pet, res) => {
  if (pet.method !== 'GET' && pet.method !== 'HEAD') { res.writeHead(405).end(); return; }
  const { pathname } = new URL(pet.url, 'http://localhost');
  const archivo = await buscar(pathname);
  if (!archivo) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
    return;
  }
  const { size } = await stat(archivo);
  const cabeceras = {
    'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': cabecerasCache(archivo),
    'Accept-Ranges': 'bytes',
  };
  // Rangos de bytes: el reproductor de audio los usa para saltar dentro de un MP3
  const rango = /^bytes=(\d*)-(\d*)$/.exec(pet.headers.range || '');
  if (rango && (rango[1] || rango[2])) {
    let inicio = rango[1] ? Number(rango[1]) : size - Number(rango[2]);
    let fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), size - 1) : size - 1;
    if (inicio < 0) inicio = 0;
    if (inicio > fin || inicio >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    res.writeHead(206, { ...cabeceras, 'Content-Range': `bytes ${inicio}-${fin}/${size}`, 'Content-Length': fin - inicio + 1 });
    if (pet.method === 'HEAD') { res.end(); return; }
    createReadStream(archivo, { start: inicio, end: fin }).pipe(res);
    return;
  }
  res.writeHead(200, { ...cabeceras, 'Content-Length': size });
  if (pet.method === 'HEAD') { res.end(); return; }
  createReadStream(archivo).pipe(res);
});

if (!(await esArchivo(join(CARPETA, 'index.html')))) {
  console.error(`No hay ninguna copia del curso en ${CARPETA}. Ejecuta antes scripts/copia-local.sh (o node scripts/copiar-curso.mjs).`);
  process.exit(1);
}
servidor.listen(PUERTO, () => {
  console.log(`Curso servido desde ${CARPETA}`);
  console.log(`Ábrelo en http://localhost:${PUERTO} (o con la IP de este servidor en tu red).`);
});
