// Interactivo: encontrar los puntos cardinales con la sombra de un palo.
// Vista desde arriba: el palo en el centro y la punta de su sombra a lo largo del día.
// Dos marcas separadas un rato dan la línea oeste-este; la sombra más corta, el norte o el sur.
// Es observación: la posición del Sol se calcula para un día típico de cada estación.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 520, CX = 320, CY = 250, PALO = 46;
const rad = (g) => (g * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const LUGARES = [['Madrid', 40.4], ['Quito', -0.2], ['Buenos Aires', -34.6]];
const EPOCAS = [['21 de marzo', 0], ['21 de junio', 23.44], ['21 de diciembre', -23.44]];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

function solEn(lat, dec, hora) {
  const H = 15 * (hora - 12);
  const sa = Math.sin(rad(lat)) * Math.sin(rad(dec)) + Math.cos(rad(lat)) * Math.cos(rad(dec)) * Math.cos(rad(H));
  const alt = deg(Math.asin(sa));
  const az = (deg(Math.atan2(-Math.cos(rad(dec)) * Math.sin(rad(H)), Math.sin(rad(dec)) * Math.cos(rad(lat)) - Math.cos(rad(dec)) * Math.cos(rad(H)) * Math.sin(rad(lat)))) + 360) % 360;
  return { alt, az };
}
// Punta de la sombra vista desde arriba (norte arriba, este a la derecha)
function punta(sol) {
  if (sol.alt < 4) return null;
  const L = Math.min(PALO / Math.tan(rad(sol.alt)), 230);
  const a = rad(sol.az + 180);
  return { x: CX + L * Math.sin(a), y: CY - L * Math.cos(a), L };
}

export function sombraPalo(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  let lat = 40.4, nombre = 'Madrid', dec = 0, hora = 10;

  function dibujar() {
    svg.innerHTML = '';
    el('rect', { width: W, height: H, fill: '#2d3b2a' }, svg);
    el('circle', { cx: CX, cy: CY, r: 236, fill: '#384a33' }, svg);
    // Recorrido de la punta de la sombra durante el día (cada media hora)
    const recorrido = [];
    for (let t = 4; t <= 20; t += 0.25) { const p = punta(solEn(lat, dec, t)); if (p) recorrido.push({ t, ...p }); }
    if (recorrido.length > 1) {
      el('path', { d: `M${recorrido.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')}`, fill: 'none', stroke: '#e9e2c9', 'stroke-opacity': 0.35, 'stroke-dasharray': '3 4' }, svg);
      for (const p of recorrido) if (Number.isInteger(p.t)) el('circle', { cx: p.x, cy: p.y, r: 2.4, fill: '#e9e2c9', opacity: 0.45 }, svg);
    }
    // Mediodía: la sombra más corta
    const med = punta(solEn(lat, dec, 12));
    if (med && med.L > 3) {
      el('line', { x1: CX, y1: CY, x2: med.x, y2: med.y, stroke: '#8fb0e0', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
      const t = el('text', { x: med.x + 8, y: med.y + (med.y > CY ? 16 : -8), 'font-size': 13, fill: '#c9dbf5', ...fuente }, svg);
      t.textContent = 'sombra de mediodía';
    }
    // Las dos marcas: ahora y media hora después
    const p1 = punta(solEn(lat, dec, hora)), p2 = punta(solEn(lat, dec, hora + 0.5));
    if (p1) {
      el('line', { x1: CX, y1: CY, x2: p1.x, y2: p1.y, stroke: '#1a2214', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.75 }, svg);
      el('circle', { cx: p1.x, cy: p1.y, r: 6, fill: '#d4ae5a' }, svg);
      const t1 = el('text', { x: p1.x - 10, y: p1.y - 12, 'font-size': 13, fill: '#f3e6bf', 'text-anchor': 'end', ...fuente }, svg);
      t1.textContent = '1.ª marca';
    }
    if (p1 && p2) {
      el('circle', { cx: p2.x, cy: p2.y, r: 6, fill: '#f3e6bf' }, svg);
      const t2 = el('text', { x: p2.x + 10, y: p2.y - 12, 'font-size': 13, fill: '#f3e6bf', ...fuente }, svg);
      t2.textContent = '2.ª marca';
      // Línea oeste-este alargada
      const dx = p2.x - p1.x, dy = p2.y - p1.y, n = Math.hypot(dx, dy) || 1;
      el('line', { x1: p1.x - (dx / n) * 60, y1: p1.y - (dy / n) * 60, x2: p2.x + (dx / n) * 60, y2: p2.y + (dy / n) * 60, stroke: '#d4ae5a', 'stroke-width': 2.5 }, svg);
      const to = el('text', { x: p1.x - (dx / n) * 72, y: p1.y - (dy / n) * 72 + 5, 'font-size': 15, 'font-weight': 600, fill: '#f3e6bf', 'text-anchor': 'middle', ...fuente }, svg);
      to.textContent = 'O';
      const te = el('text', { x: p2.x + (dx / n) * 72, y: p2.y + (dy / n) * 72 + 5, 'font-size': 15, 'font-weight': 600, fill: '#f3e6bf', 'text-anchor': 'middle', ...fuente }, svg);
      te.textContent = 'E';
    }
    // El palo
    el('circle', { cx: CX, cy: CY, r: 6, fill: '#8a5a2b', stroke: '#e9e2c9', 'stroke-width': 1.5 }, svg);
    // Rosa de referencia (la verdadera, para comprobar)
    const r = el('g', { transform: `translate(${W - 50} ${H - 56})`, ...fuente, 'font-size': 12, fill: '#c9cfdc', 'text-anchor': 'middle' }, svg);
    el('circle', { r: 26, fill: 'rgba(15,25,48,.6)' }, r);
    el('path', { d: 'M0 -18 L5 0 L0 18 L-5 0 Z', fill: '#c9cfdc', opacity: 0.6 }, r);
    el('path', { d: 'M0 -18 L5 0 L-5 0 Z', fill: '#d9714e' }, r);
    const tn = el('text', { x: 0, y: -31 }, r); tn.textContent = 'N';
    const tl = el('text', { x: 0, y: 44, 'font-size': 11 }, r); tl.textContent = 'para comprobar';
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fLugar = document.createElement('div'); fLugar.className = 'grupo-botones';
  const bLugar = LUGARES.map(([n, la]) => { const b = boton(n, () => { nombre = n; lat = la; actualizar(); }); b.dataset.n = n; return b; });
  fLugar.append(...bLugar);
  const fEpoca = document.createElement('div'); fEpoca.className = 'grupo-botones';
  const bEpoca = EPOCAS.map(([n, d]) => { const b = boton(n, () => { dec = d; actualizar(); }); b.dataset.d = d; return b; });
  fEpoca.append(...bEpoca);
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span class="hora-texto">10:00</span><input type="range" min="6" max="17.5" step="0.25" value="10" aria-label="Hora solar de la primera marca">';
  const iHora = rango.querySelector('input'), tHora = rango.querySelector('.hora-texto');
  iHora.addEventListener('input', () => { hora = +iHora.value; actualizar(); });
  barra.append(dato, fLugar, fEpoca, rango);

  function actualizar() {
    bLugar.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === nombre)));
    bEpoca.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === dec)));
    const hh = Math.floor(hora), mm = Math.round((hora - hh) * 60);
    tHora.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    dibujar();
    const s = solEn(lat, dec, hora), med = solEn(lat, dec, 12);
    let mediodia;
    if (med.alt > 89) mediodia = 'A mediodía el Sol está justo encima y el palo casi no da sombra.';
    else mediodia = `A mediodía la sombra es la más corta del día y apunta al <strong>${med.az > 90 && med.az < 270 ? 'norte' : 'sur'}</strong>.`;
    dato.innerHTML = s.alt < 4
      ? 'A esa hora el Sol está demasiado bajo: elige una hora más cercana al mediodía.'
      : `Marca la punta de la sombra, espera media hora y vuelve a marcarla. La primera marca queda al <strong>oeste</strong> y la segunda al <strong>este</strong>: la línea que las une va de oeste a este. ${mediodia}`;
    svg.setAttribute('aria-label', `Esquema visto desde arriba: un palo y su sombra en ${nombre}. ${dato.textContent}`);
  }
  actualizar();
  return { destruir() {} };
}
