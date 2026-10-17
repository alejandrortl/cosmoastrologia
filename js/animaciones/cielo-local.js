// Interactivo: lo que ve cualquiera desde donde está. Horizonte, cenit, puntos cardinales
// y altura de un astro, con la regla del puño (unos 10° con el brazo estirado).
// Es observación: no presupone ningún modelo del mundo.

import { svgNS, barraControles } from './comun.js';

const W = 640, H = 400, CX = 320, CY = 330, R = 250;
const rad = (g) => (g * Math.PI) / 180;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 15, fill: '#a9b2c4', 'text-anchor': 'middle', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}

export function cieloLocal(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  const defs = el('defs', {}, svg);
  const g0 = el('linearGradient', { id: 'cielo-local-g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#0c1528' }, g0);
  el('stop', { offset: 1, 'stop-color': '#22365e' }, g0);
  el('rect', { width: W, height: H, fill: 'url(#cielo-local-g)' }, svg);

  // Cúpula del cielo, cenit y horizonte
  el('path', { d: `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.45, 'stroke-dasharray': '5 6' }, svg);
  el('line', { x1: CX, y1: CY, x2: CX, y2: CY - R, stroke: '#8fb0e0', 'stroke-opacity': 0.35, 'stroke-dasharray': '3 5' }, svg);
  el('circle', { cx: CX, cy: CY - R, r: 4, fill: '#ebe5d5' }, svg);
  texto(svg, CX, CY - R - 12, 'Cenit (90°): justo encima de tu cabeza', { fill: '#ebe5d5' });
  el('rect', { x: 0, y: CY, width: W, height: H - CY, fill: '#0a1122' }, svg);
  el('line', { x1: 0, y1: CY, x2: W, y2: CY, stroke: '#a9c4ea', 'stroke-opacity': 0.6, 'stroke-width': 2 }, svg);
  texto(svg, CX, CY + 52, 'Horizonte (0°)', { fill: '#ebe5d5' });
  texto(svg, 40, CY + 26, 'Norte', { 'text-anchor': 'start', fill: '#ebe5d5' });
  texto(svg, W - 40, CY + 26, 'Sur', { 'text-anchor': 'end', fill: '#ebe5d5' });

  // Observador
  const obs = el('g', { transform: `translate(${CX} ${CY})` }, svg);
  el('circle', { cx: 0, cy: -26, r: 7, fill: '#d4ae5a' }, obs);
  el('path', { d: 'M0 -19 L0 -4 M0 -4 L-6 0 M0 -4 L6 0 M-8 -14 L8 -14', stroke: '#d4ae5a', 'stroke-width': 3, 'stroke-linecap': 'round' }, obs);

  // Astro, ángulo y puños
  const linea = el('line', { x1: CX, y1: CY - 20, stroke: '#f2cf72', 'stroke-width': 2, 'stroke-opacity': 0.8 }, svg);
  const arco = el('path', { fill: 'none', stroke: '#f2cf72', 'stroke-width': 2.5 }, svg);
  const angulo = texto(svg, 0, 0, '', { fill: '#f3e6bf', 'font-size': 17, 'font-weight': 600 });
  const punos = el('g', {}, svg);
  const estrella = el('circle', { r: 8, fill: '#f3ecd8' }, svg);
  const brillo = el('circle', { r: 16, fill: '#f3ecd8', opacity: 0.18 }, svg);

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Altura</span><input type="range" min="0" max="90" step="1" value="40" aria-label="Altura del astro sobre el horizonte, en grados">';
  const entrada = rango.querySelector('input');
  barra.append(dato, rango);

  function fijar(alt) {
    // El astro está hacia el norte (a la izquierda), a la altura elegida
    const a = rad(180 - alt);
    const sx = CX + R * Math.cos(a), sy = CY - R * Math.sin(a);
    estrella.setAttribute('cx', sx); estrella.setAttribute('cy', sy);
    brillo.setAttribute('cx', sx); brillo.setAttribute('cy', sy);
    linea.setAttribute('x2', sx); linea.setAttribute('y2', sy);
    const r = 90;
    const ax = CX + r * Math.cos(a), ay = CY - r * Math.sin(a);
    arco.setAttribute('d', `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${ax} ${ay}`);
    const m = rad(180 - alt / 2);
    angulo.setAttribute('x', CX + (r + 34) * Math.cos(m));
    angulo.setAttribute('y', CY - (r + 34) * Math.sin(m) + 6);
    angulo.textContent = `${alt}°`;
    // Puños: uno por cada 10°, apilados a lo largo del arco
    punos.innerHTML = '';
    const n = Math.round(alt / 10);
    for (let i = 0; i < n; i++) {
      const b = rad(180 - (i * 10 + 5));
      el('circle', { cx: CX + (R - 22) * Math.cos(b), cy: CY - (R - 22) * Math.sin(b), r: 9, fill: '#d4ae5a', opacity: 0.55 }, punos);
    }
    const textoPunos = n === 0 ? 'ni un puño' : n === 1 ? 'un puño' : `unos ${n} puños`;
    dato.innerHTML = `Un astro a <strong>${alt}°</strong> de altura está ${alt === 0 ? 'en el horizonte' : alt === 90 ? 'en el cenit' : alt < 45 ? 'más cerca del horizonte que del cenit' : alt === 45 ? 'a medio camino entre el horizonte y el cenit' : 'más cerca del cenit que del horizonte'}. Con el brazo estirado y el puño cerrado, eso son <strong>${textoPunos}</strong> desde el horizonte.`;
    svg.setAttribute('aria-label', `Esquema del cielo local: horizonte, cenit, norte y sur. ${dato.textContent}`);
  }
  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(40);
  return { destruir() {} };
}
