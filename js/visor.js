// Visor de imágenes a pantalla completa con zoom: pellizcar y arrastrar en el móvil,
// rueda y arrastre en el ordenador, doble toque para acercar, y botones +, - y restablecer.
// Abre primero la imagen que ya está cargada y la cambia por la versión grande en cuanto llega.
// Si la imagen tiene un servidor de teselas IIIF, usa OpenSeadragon para un zoom profundo
// que solo descarga la parte visible a la resolución necesaria.

const MIN = 1, MAX = 8;
const OSD = 'https://cdn.jsdelivr.net/npm/openseadragon@4.1.1/build/openseadragon/openseadragon.min.js';
let cargaOSD = null;
function cargarOSD() {
  if (window.OpenSeadragon) return Promise.resolve(window.OpenSeadragon);
  if (!cargaOSD) {
    cargaOSD = new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = OSD; s.async = true;
      s.onload = () => (window.OpenSeadragon ? ok(window.OpenSeadragon) : mal(new Error('sin OpenSeadragon')));
      s.onerror = () => { cargaOSD = null; mal(new Error('no se pudo cargar OpenSeadragon')); };
      document.head.append(s);
    });
  }
  return cargaOSD;
}
let abierto = null;
// Cuando el visor se cierra con su botón, se vuelve atrás en el historial para quitar la entrada
// que añadió al abrirse. Esa vuelta no es un cambio de página: la página no debe volver a pintarse.
let atrasPropio = false;

export function visorAbierto() { return !!abierto; }

// La usa el enrutador: devuelve true (una sola vez) si el último "atrás" lo provocó el visor.
export function consumirAtrasPropio() {
  const v = atrasPropio;
  atrasPropio = false;
  return v;
}

export function cerrarVisor({ desdeHistorial = false } = {}) {
  if (!abierto) return;
  const { capa, anterior, alTeclado, profundo, alCerrar } = abierto;
  abierto = null;
  try { alCerrar?.(); } catch (e) { /* nada */ }
  try { profundo?.destroy(); } catch (e) { /* nada */ }
  document.removeEventListener('keydown', alTeclado);
  document.body.style.overflow = '';
  capa.remove();
  anterior?.focus?.({ preventScroll: true });
  if (!desdeHistorial && history.state?.visor) { atrasPropio = true; history.back(); }
}

export function abrirVisor({ src, grande, alt, pie, credito, iiif, tam, alCerrar }) {
  if (abierto) cerrarVisor();
  const capa = document.createElement('div');
  capa.className = 'visor';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-label', alt || 'Imagen ampliada');
  capa.innerHTML = `
    <div class="visor-escenario"><img class="visor-img" alt=""></div>
    <div class="visor-barra">
      <button type="button" class="visor-boton" data-v="menos" aria-label="Alejar">−</button>
      <button type="button" class="visor-boton" data-v="mas" aria-label="Acercar">+</button>
      <button type="button" class="visor-boton texto" data-v="reiniciar">Ver entera</button>
      <button type="button" class="visor-boton texto" data-v="cerrar">Cerrar</button>
    </div>
    <p class="visor-pie"></p>
    <p class="visor-carga" hidden>Cargando la versión en alta resolución…</p>`;
  const img = capa.querySelector('.visor-img');
  const escenario = capa.querySelector('.visor-escenario');
  const carga = capa.querySelector('.visor-carga');
  img.alt = alt || '';
  img.src = src;
  capa.querySelector('.visor-pie').innerHTML = [pie, credito].filter(Boolean).join(' <span class="visor-credito">') + (credito ? '</span>' : '');

  if (iiif) {
    // Zoom profundo: se monta encima de la imagen en cuanto carga OpenSeadragon
    carga.hidden = false;
    carga.textContent = 'Preparando el zoom en alta resolución…';
    cargarOSD().then((OpenSeadragon) => {
      if (!abierto || abierto.capa !== capa) return;
      const caja = document.createElement('div');
      caja.className = 'visor-profundo';
      escenario.append(caja);
      const visor = OpenSeadragon({
        element: caja,
        tileSources: `${iiif}/info.json`,
        showNavigationControl: false,
        showNavigator: true,
        navigatorPosition: 'TOP_RIGHT',
        maxZoomPixelRatio: 3,
        visibilityRatio: 1,
        constrainDuringPan: true,
        gestureSettingsTouch: { pinchRotate: false, flickEnabled: true, dblClickToZoom: true },
      });
      let reintentado = false, teselasBien = 0, teselasMal = 0;
      let abandonado = false;
      const abandonarProfundo = () => {
        if (abandonado || abierto?.capa !== capa) return;
        abandonado = true;
        // El servidor de teselas no responde: se quita el zoom profundo y se usa la imagen grande
        try { visor.destroy(); } catch (e) { /* nada */ }
        if (abierto?.capa === capa) abierto.profundo = null;
        caja.remove();
        img.style.visibility = '';
        capa.classList.remove('con-profundo');
        cargarGrande();
      };
      visor.addHandler('open', () => { capa.classList.add('con-profundo'); });
      visor.addHandler('tile-loaded', () => {
        // Solo se tapa la imagen de partida cuando ya hay teselas de verdad en pantalla
        if (teselasBien++ === 0) { img.style.visibility = 'hidden'; carga.hidden = true; }
      });
      visor.addHandler('tile-load-failed', () => {
        if (++teselasMal >= 3 && teselasBien === 0) abandonarProfundo();
      });
      // Si en 12 segundos no ha llegado ninguna tesela, tampoco se espera más
      setTimeout(() => { if (abierto?.capa === capa && teselasBien === 0 && caja.isConnected) abandonarProfundo(); }, 12000);
      visor.addHandler('open-failed', () => {
        // Si no se pudo leer la ficha del servidor, se describe la imagen a mano y se reintenta
        if (!reintentado && tam) {
          reintentado = true;
          visor.open({
            '@context': 'http://iiif.io/api/image/2/context.json',
            '@id': iiif,
            protocol: 'http://iiif.io/api/image',
            width: tam[0], height: tam[1],
            profile: ['http://iiif.io/api/image/2/level2.json'],
            tiles: [{ width: 512, scaleFactors: [1, 2, 4, 8, 16] }],
          });
          return;
        }
        abandonarProfundo();
      });
      abierto.profundo = visor;
    }).catch(() => { carga.hidden = true; cargarGrande(); });
  }

  function cargarGrande() {
    if (!grande || grande === src) { carga.hidden = true; return; }
    carga.hidden = false;
    carga.textContent = 'Cargando la versión en alta resolución…';
    const alta = new Image();
    alta.onload = () => { if (abierto?.capa === capa) img.src = grande; carga.hidden = true; };
    alta.onerror = () => { carga.hidden = true; };
    alta.src = grande;
  }
  if (!iiif) cargarGrande();

  // ---- Estado de zoom ----
  let escala = 1, x = 0, y = 0;
  const aplicar = () => {
    // No dejar que la imagen se escape de la pantalla
    const r = escenario.getBoundingClientRect();
    const ancho = img.offsetWidth * escala, alto = img.offsetHeight * escala;
    const mx = Math.max(0, (ancho - r.width) / 2), my = Math.max(0, (alto - r.height) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
    img.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
    capa.classList.toggle('ampliada', escala > 1.01);
  };
  // Acercar o alejar manteniendo fijo el punto (px, py) de la pantalla
  const zoomEn = (nueva, px, py) => {
    nueva = Math.min(MAX, Math.max(MIN, nueva));
    const r = escenario.getBoundingClientRect();
    const cx = px - (r.left + r.width / 2), cy = py - (r.top + r.height / 2);
    x = cx - ((cx - x) * nueva) / escala;
    y = cy - ((cy - y) * nueva) / escala;
    escala = nueva;
    if (escala === 1) { x = 0; y = 0; }
    aplicar();
  };
  const centro = () => {
    const r = escenario.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  // ---- Gestos ----
  const punteros = new Map();
  let inicio = null, ultimoToque = 0;
  escenario.addEventListener('pointerdown', (e) => {
    if (capa.classList.contains('con-profundo')) return;
    escenario.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    inicio = { escala, x, y, punteros: new Map(punteros) };
    const ahora = Date.now();
    if (punteros.size === 1 && ahora - ultimoToque < 300) {
      zoomEn(escala > 1.01 ? 1 : 2.5, e.clientX, e.clientY);
      ultimoToque = 0;
    } else ultimoToque = ahora;
  });
  escenario.addEventListener('pointermove', (e) => {
    if (!punteros.has(e.pointerId)) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...punteros.values()];
    const ini = [...inicio.punteros.values()];
    if (ps.length === 1 && ini.length === 1) {
      x = inicio.x + ps[0].x - ini[0].x;
      y = inicio.y + ps[0].y - ini[0].y;
      aplicar();
    } else if (ps.length >= 2 && ini.length >= 2) {
      const d0 = Math.hypot(ini[0].x - ini[1].x, ini[0].y - ini[1].y) || 1;
      const d1 = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      const mx = (ps[0].x + ps[1].x) / 2, my = (ps[0].y + ps[1].y) / 2;
      escala = inicio.escala; x = inicio.x; y = inicio.y;
      zoomEn(inicio.escala * (d1 / d0), mx, my);
    }
  });
  const soltar = (e) => {
    punteros.delete(e.pointerId);
    inicio = { escala, x, y, punteros: new Map(punteros) };
  };
  escenario.addEventListener('pointerup', soltar);
  escenario.addEventListener('pointercancel', soltar);
  escenario.addEventListener('wheel', (e) => {
    if (capa.classList.contains('con-profundo')) return;
    e.preventDefault();
    zoomEn(escala * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });

  capa.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-v]')?.dataset.v;
    const prof = abierto?.profundo && capa.classList.contains('con-profundo') ? abierto.profundo : null;
    if (accion === 'cerrar') cerrarVisor();
    else if (prof && accion === 'mas') prof.viewport.zoomBy(1.6);
    else if (prof && accion === 'menos') prof.viewport.zoomBy(1 / 1.6);
    else if (prof && accion === 'reiniciar') prof.viewport.goHome();
    else if (accion === 'mas') zoomEn(escala * 1.6, ...centro());
    else if (accion === 'menos') zoomEn(escala / 1.6, ...centro());
    else if (accion === 'reiniciar') { escala = 1; x = 0; y = 0; aplicar(); }
  });

  const alTeclado = (e) => {
    if (e.key === 'Escape') cerrarVisor();
    else if (e.key === '+' || e.key === '=') zoomEn(escala * 1.4, ...centro());
    else if (e.key === '-') zoomEn(escala / 1.4, ...centro());
  };
  document.addEventListener('keydown', alTeclado);

  abierto = { capa, anterior: document.activeElement, alTeclado, alCerrar };
  document.body.style.overflow = 'hidden';
  document.body.append(capa);
  // El botón "atrás" del móvil cierra el visor en lugar de salir de la página
  history.pushState({ ...(history.state || {}), visor: true }, '');
  capa.querySelector('[data-v="cerrar"]').focus();
}
