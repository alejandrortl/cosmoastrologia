// Interactivo: las cuatro combinaciones de forma de la Tierra (plana o esférica) y centro
// (geocéntrico o heliocéntrico), con un esquema de cada una y las culturas que la usaron.

import { svgNS, boton, barraControles } from './comun.js';
import { MODELOS, culturasDe } from './datos-modelos.js';

const W = 640, H = 600;
const CELDAS = [
  { id: 'plana-geo', col: 0, fila: 0 },
  { id: 'plana-helio', col: 1, fila: 0 },
  { id: 'esferica-geo', col: 0, fila: 1 },
  { id: 'esferica-helio', col: 1, fila: 1 },
];
const X0 = 120, Y0 = 70, CW = 255, CH = 255, GAP = 10;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 14, fill: '#a9b2c4', 'text-anchor': 'middle', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Pequeños esquemas de cada modelo, centrados en (0, 0)
function dibujo(g, id) {
  const sol = (x, y, r = 13) => { el('circle', { cx: x, cy: y, r: r + 6, fill: '#f2cf72', opacity: 0.25 }, g); el('circle', { cx: x, cy: y, r, fill: '#f2cf72' }, g); };
  if (id === 'plana-geo') {
    el('path', { d: 'M-95 40 A95 95 0 0 1 95 40', fill: 'none', stroke: '#8fb0e0', 'stroke-dasharray': '4 5', 'stroke-opacity': 0.7 }, g);
    el('ellipse', { cx: 0, cy: 40, rx: 95, ry: 20, fill: '#3e6f5a', stroke: '#a9c4ea', 'stroke-opacity': 0.5 }, g);
    el('ellipse', { cx: 0, cy: 22, rx: 60, ry: 10, fill: 'none', stroke: '#f2cf72', 'stroke-dasharray': '3 4', 'stroke-opacity': 0.8 }, g);
    sol(55, 22, 9);
    el('circle', { cx: -40, cy: -10, r: 6, fill: '#efe6c8' }, g);
  } else if (id === 'esferica-geo') {
    el('circle', { cx: 0, cy: 0, r: 75, fill: 'none', stroke: '#f2cf72', 'stroke-dasharray': '3 4', 'stroke-opacity': 0.8 }, g);
    el('circle', { cx: 0, cy: 0, r: 30, fill: '#3e6fb0' }, g);
    el('path', { d: 'M-30 0 A30 12 0 0 0 30 0', fill: 'none', stroke: '#a9c4ea', 'stroke-opacity': 0.6 }, g);
    sol(53, -53, 11);
  } else if (id === 'esferica-helio') {
    el('circle', { cx: 0, cy: 0, r: 75, fill: 'none', stroke: '#8fb0e0', 'stroke-dasharray': '3 4', 'stroke-opacity': 0.8 }, g);
    sol(0, 0, 22);
    el('circle', { cx: 53, cy: -53, r: 12, fill: '#3e6fb0' }, g);
  } else {
    el('path', { d: 'M-60 -40 L60 40 M60 -40 L-60 40', stroke: '#a9b2c4', 'stroke-opacity': 0.25, 'stroke-width': 2 }, g);
  }
}

export function cuatroModelos(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);

  texto(svg, X0 + CW / 2, 30, 'La Tierra, quieta', { fill: '#ebe5d5', 'font-size': 15, 'font-weight': 600 });
  texto(svg, X0 + CW / 2, 50, 'en el centro (geocéntrico)');
  texto(svg, X0 + CW + GAP + CW / 2, 30, 'El Sol en el centro', { fill: '#ebe5d5', 'font-size': 15, 'font-weight': 600 });
  texto(svg, X0 + CW + GAP + CW / 2, 50, '(heliocéntrico)');
  texto(svg, 58, Y0 + CH / 2, 'Tierra', { fill: '#ebe5d5', 'font-size': 15, 'font-weight': 600 });
  texto(svg, 58, Y0 + CH / 2 + 20, 'plana');
  texto(svg, 58, Y0 + CH + GAP + CH / 2, 'Tierra', { fill: '#ebe5d5', 'font-size': 15, 'font-weight': 600 });
  texto(svg, 58, Y0 + CH + GAP + CH / 2 + 20, 'esférica');

  const celdas = {};
  for (const c of CELDAS) {
    const x = X0 + c.col * (CW + GAP), y = Y0 + c.fila * (CH + GAP);
    const g = el('g', { class: 'celda-modelo', 'data-id': c.id, style: 'cursor:pointer' }, svg);
    const marco = el('rect', { x, y, width: CW, height: CH, rx: 14, fill: '#16264a', stroke: MODELOS[c.id].color, 'stroke-opacity': 0.35, 'stroke-width': 2 }, g);
    const dib = el('g', { transform: `translate(${x + CW / 2} ${y + CH / 2 - 14})` }, g);
    dibujo(dib, c.id);
    const n = culturasDe(c.id).length;
    texto(g, x + CW / 2, y + CH - 18, c.id === 'plana-helio' ? 'Sin tradición conocida' : `${n} ${n === 1 ? 'tradición' : 'tradiciones'}`, { fill: MODELOS[c.id].color, 'font-size': 14 });
    g.addEventListener('click', () => elegir(c.id));
    celdas[c.id] = marco;
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Modelo');
  const botones = CELDAS.map((c) => {
    const b = boton(MODELOS[c.id].corto, () => elegir(c.id), { 'aria-pressed': 'false' });
    b.dataset.id = c.id;
    return b;
  });
  fila.append(...botones);
  barra.append(dato, fila);

  function elegir(id) {
    Object.entries(celdas).forEach(([k, r]) => {
      r.setAttribute('stroke-opacity', k === id ? 1 : 0.35);
      r.setAttribute('fill', k === id ? '#1d3054' : '#16264a');
    });
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    const lista = culturasDe(id).map((c) => c.nombre + (c.nota ? ` (${c.nota})` : ''));
    dato.innerHTML = `<strong>${MODELOS[id].nombre}.</strong> ` + (lista.length
      ? `La usaron o la usan: ${lista.join(', ')}.`
      : 'No se conoce ninguna tradición que la haya defendido.');
    svg.setAttribute('aria-label', `Cuadro de los cuatro modelos del mundo. ${dato.textContent}`);
  }
  elegir('plana-geo');
  return { destruir() {} };
}
