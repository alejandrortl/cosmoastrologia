// Modo sin conexión: registra sw.js y pinta en la portada el apartado «Sin conexión»,
// con el botón para guardar también el audiolibro.

const MEDIOS = 'cosmo-medios-v1';
const disponible = 'serviceWorker' in navigator && 'caches' in window
  && (location.protocol === 'https:' || location.hostname === 'localhost');

export function registrarModoSinConexion() {
  if (!disponible) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // Cada vez que se abre con conexión, se comprueba si el curso ha cambiado
      if (navigator.onLine) (reg.active || reg.installing || reg.waiting)?.postMessage({ tipo: 'sincronizar' });
    } catch (e) { /* sin modo sin conexión; la web funciona igual */ }
  });
}

async function grabaciones() {
  const r = await fetch('/audio/indice.json', { cache: 'no-cache' });
  const { pasajes = {} } = await r.json();
  const lista = Object.keys(pasajes).map((k) => `/audio/${k}.mp3`);
  lista.minutos = Math.round(Object.values(pasajes).reduce((a, b) => a + b, 0) / 60);
  return lista;
}

async function cuantasGuardadas(lista) {
  const cache = await caches.open(MEDIOS);
  const guardadas = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  return lista.filter((u) => guardadas.has(u)).length;
}

export function htmlSinConexion() {
  if (!disponible) return '';
  return `
    <section class="sin-conexion" aria-labelledby="t-sin-conexion">
      <h2 id="t-sin-conexion">Sin conexión</h2>
      <p>Esta web guarda el curso en tu dispositivo la primera vez que la abres: los textos, las imágenes y las animaciones. Después se puede leer sin internet. Para tenerla a mano, instálala como una app: en el móvil, abre el menú del navegador y elige <strong>Añadir a pantalla de inicio</strong> (en iPhone, el botón <strong>Compartir</strong>).</p>
      <p>El audiolibro se guarda a medida que lo escuchas. Si lo quieres entero para escucharlo sin conexión, guárdalo aquí.</p>
      <p class="estado-sin-conexion" aria-live="polite"></p>
      <button class="boton secundario guardar-audio" type="button" hidden>Guardar el audiolibro</button>
    </section>`;
}

export async function montarSinConexion(raiz) {
  const seccion = raiz.querySelector('.sin-conexion');
  if (!seccion) return () => {};
  const estado = seccion.querySelector('.estado-sin-conexion');
  const boton = seccion.querySelector('.guardar-audio');
  let parar = false;

  let lista = [];
  try { lista = await grabaciones(); } catch (e) { /* sin índice (sin conexión y sin guardar) */ }
  const pintar = async () => {
    if (!lista.length) { estado.textContent = ''; boton.hidden = true; return; }
    const n = await cuantasGuardadas(lista);
    if (n >= lista.length) {
      estado.textContent = 'El audiolibro está guardado entero en este dispositivo.';
      boton.hidden = true;
    } else {
      estado.textContent = n ? `Audiolibro guardado: ${n} de ${lista.length} pasajes.` : '';
      boton.hidden = false;
      const duracion = lista.minutos >= 90 ? `unas ${Math.round(lista.minutos / 60)} horas` : `${lista.minutos} minutos`;
      boton.textContent = n ? 'Guardar el resto del audiolibro' : `Guardar el audiolibro (${duracion})`;
    }
  };
  await pintar();

  boton.addEventListener('click', async () => {
    if (!navigator.onLine) { estado.textContent = 'Hace falta conexión para guardar el audiolibro.'; return; }
    boton.disabled = true;
    try { await navigator.storage?.persist?.(); } catch (e) { /* nada */ }
    const cache = await caches.open(MEDIOS);
    const guardadas = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const faltan = lista.filter((u) => !guardadas.has(u));
    let hechas = lista.length - faltan.length, fallos = 0;
    for (let i = 0; i < faltan.length && !parar; i += 4) {
      await Promise.all(faltan.slice(i, i + 4).map(async (u) => {
        try {
          const r = await fetch(u);
          if (!r.ok) throw new Error(r.status);
          await cache.put(u, r);
          hechas++;
        } catch (e) { fallos++; }
      }));
      estado.textContent = `Guardando el audiolibro: ${hechas} de ${lista.length} pasajes…`;
    }
    boton.disabled = false;
    await pintar();
    if (fallos) estado.textContent += ` ${fallos} no se han podido guardar; vuelve a intentarlo más tarde.`;
  });

  return () => { parar = true; };
}
