// Modo sin conexión de Cosmoastrología.
//
// - Al instalarse guarda la web y todo el curso: páginas, estilos, código, textos e imágenes
//   (la lista la escribe scripts/copiar-curso.mjs en /curso/archivos.json).
// - Web, código y textos: se piden primero a la red, para tener siempre la última versión;
//   si no hay conexión, se sirve lo guardado.
// - Imágenes del curso y grabaciones del audiolibro: sus nombres cambian cuando cambia el
//   archivo, así que se sirven de lo guardado sin preguntar a la red.
// - El audiolibro se guarda a medida que se escucha, o entero con el botón de la portada.

const APP = 'cosmo-app-v1';
const MEDIOS = 'cosmo-medios-v1';
const EXTERNO = 'cosmo-externo-v1';
const VIGENTES = [APP, MEDIOS, EXTERNO];

async function sincronizar() {
  const r = await fetch('/curso/archivos.json', { cache: 'no-store' });
  if (!r.ok) return;
  const { version, archivos } = await r.json();
  const app = await caches.open(APP);
  const medios = await caches.open(MEDIOS);
  const guardada = await app.match('/curso/version');
  if (guardada && (await guardada.text()) === version) return;

  const esMedio = (a) => a.startsWith('/curso/medios/');
  // Las imágenes que ya están no se vuelven a bajar
  for (const a of archivos.filter(esMedio)) {
    if (!(await medios.match(a))) await medios.add(a).catch(() => {});
  }
  await Promise.all(archivos.filter((a) => !esMedio(a)).map((a) =>
    fetch(a, { cache: 'no-cache' }).then((res) => (res.ok && !res.redirected ? app.put(a, res) : null)).catch(() => {})));
  // Las imágenes que el curso ya no usa se borran
  const usados = new Set(archivos.filter(esMedio));
  for (const req of await medios.keys()) {
    const ruta = new URL(req.url).pathname;
    if (esMedio(ruta) && !usados.has(ruta)) await medios.delete(req);
  }
  await app.put('/curso/version', new Response(version));
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(sincronizar().catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!VIGENTES.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// La página pide sincronizar cada vez que se abre con conexión (por si el curso ha cambiado)
self.addEventListener('message', (e) => {
  if (e.data?.tipo === 'sincronizar') e.waitUntil(sincronizar().catch(() => {}));
});

// Red primero, con un límite de espera; si no llega, lo guardado.
async function redPrimero(req, clave) {
  const app = await caches.open(APP);
  const red = fetch(req).then((res) => {
    if (res.ok && !res.redirected) app.put(clave, res.clone());
    return res;
  });
  red.catch(() => {});
  const espera = new Promise((ok) => setTimeout(ok, 5000));
  try {
    const res = await Promise.race([red, espera.then(() => null)]);
    if (res) return res;
    return (await app.match(clave)) || await red;
  } catch (err) {
    const guardada = await app.match(clave);
    if (guardada) return guardada;
    throw err;
  }
}

// El audio pide trozos (cabecera Range); se sirven desde lo guardado como hace un servidor.
async function servirTrozo(req, res) {
  const rango = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!rango) return res;
  const datos = await res.arrayBuffer();
  const total = datos.byteLength;
  let ini = rango[1] === '' ? total - Number(rango[2]) : Number(rango[1]);
  let fin = rango[1] === '' || rango[2] === '' ? total - 1 : Math.min(Number(rango[2]), total - 1);
  ini = Math.max(0, ini);
  if (ini > fin) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  return new Response(datos.slice(ini, fin + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
      'Content-Range': `bytes ${ini}-${fin}/${total}`,
      'Content-Length': String(fin - ini + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function guardadoPrimero(req) {
  const medios = await caches.open(MEDIOS);
  const url = new URL(req.url);
  const guardada = await medios.match(url.pathname);
  if (guardada) return req.headers.has('range') ? servirTrozo(req, guardada) : guardada;
  if (req.headers.has('range')) return fetch(req); // un trozo suelto no se guarda
  const res = await fetch(req);
  if (res.ok && res.status === 200) medios.put(url.pathname, res.clone());
  return res;
}

// Fuentes y otras imágenes de fuera: lo guardado al momento, y se renueva por detrás.
async function guardadoYRenovar(req, evento) {
  const externo = await caches.open(EXTERNO);
  const guardada = await externo.match(req);
  const red = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') externo.put(req, res.clone());
    return res;
  });
  if (guardada) { evento.waitUntil(red.catch(() => {})); return guardada; }
  return red;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (url.pathname === '/sw.js') return;
    if (req.mode === 'navigate') { e.respondWith(redPrimero(req, '/')); return; }
    if (url.pathname.startsWith('/curso/medios/') || /^\/audio\/[0-9a-f]+\.mp3$/.test(url.pathname)) {
      e.respondWith(guardadoPrimero(req));
      return;
    }
    e.respondWith(redPrimero(req, url.pathname));
    return;
  }

  // De fuera: solo las fuentes de Google y las imágenes (no la base de datos ni otros servicios)
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || req.destination === 'image') {
    e.respondWith(guardadoYRenovar(req, e));
  }
});
