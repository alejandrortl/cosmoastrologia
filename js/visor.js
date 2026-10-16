// Visor de imágenes a pantalla completa con zoom: pellizcar y arrastrar en el móvil,
// rueda y arrastre en el ordenador, doble toque para acercar, y botones +, - y restablecer.
// Abre primero la imagen que ya está cargada y la cambia por la versión grande en cuanto llega.

const MIN = 1, MAX = 8;
let abierto = null;

export function visorAbierto() { return !!abierto; }

export function cerrarVisor({ desdeHistorial = false } = {}) {
  if (!abierto) return;
  const { capa, anterior, alTeclado } = abierto;
  abierto = null;
  document.removeEventListener('keydown', alTeclado);
  document.body.style.overflow = '';
  capa.remove();
  anterior?.focus?.({ preventScroll: true });
  if (!desdeHistorial && history.state?.visor) history.back();
}

export function abrirVisor({ src, grande, alt, pie, credito }) {
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

  if (grande && grande !== src) {
    carga.hidden = false;
    const alta = new Image();
    alta.onload = () => { img.src = grande; carga.hidden = true; };
    alta.onerror = () => { carga.hidden = true; };
    alta.src = grande;
  }

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
    e.preventDefault();
    zoomEn(escala * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });

  capa.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-v]')?.dataset.v;
    if (accion === 'cerrar') cerrarVisor();
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

  abierto = { capa, anterior: document.activeElement, alTeclado };
  document.body.style.overflow = 'hidden';
  document.body.append(capa);
  // El botón "atrás" del móvil cierra el visor en lugar de salir de la página
  history.pushState({ ...(history.state || {}), visor: true }, '');
  capa.querySelector('[data-v="cerrar"]').focus();
}
