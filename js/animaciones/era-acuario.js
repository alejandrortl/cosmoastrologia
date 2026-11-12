// Esquema: ¿cuándo empieza la Era de Acuario? Las fechas que ha dado cada criterio y cada autor,
// en una línea del tiempo. Las barras son el recuento por siglos que hizo Nicholas Campion en
// «The Book of World Horoscopes» (1999). Las fechas siderales con signos iguales son cálculos
// aproximados de este curso (cuando el ayanamsa llega a 30°); la de la UAI es la de Jean Meeus.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 460;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const DESDE = 1400, HASTA = 3700;
const X0 = 30, X1 = W - 20;
const x = (a) => X0 + ((a - DESDE) / (HASTA - DESDE)) * (X1 - X0);
const BASE = 330;

// Siglo (el XVIII es el 18) → número de propuestas recogidas por Campion
const CAMPION = { 18: 4, 19: 5, 20: 29, 21: 7, 22: 6, 23: 6, 24: 12, 25: 8, 26: 7, 27: 7 };
// Año, rótulo, tipo (autor, sideral, uai) y explicación
const FECHAS = [
  [1447, 'MacKinnell', 'autor', 'Terry MacKinnell propuso el año 1447: la fecha más temprana que recoge Campion.'],
  [1962, 'Samael Aun Weor', 'autor', 'Samael Aun Weor, fundador del movimiento gnóstico, la hizo comenzar el 4 de febrero de 1962.'],
  [2375, 'Fagan-Bradley', 'sideral', 'Con el ayanamsa de Fagan y Bradley y signos iguales de 30°, el punto vernal sale de Piscis hacia el año 2375 (cálculo aproximado de este curso).'],
  [2440, 'Lahiri', 'sideral', 'Con el ayanamsa de Lahiri y signos iguales de 30°, el punto vernal sale de Piscis hacia el año 2440 (cálculo aproximado de este curso).'],
  [2597, 'UAI (Meeus)', 'uai', 'Con las fronteras de la UAI de 1930, Jean Meeus calculó que el punto vernal entra en la constelación de Acuario en 2597.'],
  [3573, 'Steiner', 'autor', 'Rudolf Steiner, fundador de la antroposofía, la situó en el año 3573.'],
  [3597, 'Addey', 'autor', 'John Addey propuso el año 3597: la fecha más tardía que recoge Campion.'],
];
const COLOR = { autor: '#c9b8ff', sideral: '#f2cf72', uai: '#8fb0e0' };

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, xx, y, t, attrs = {}) {
  const e = el('text', { x: xx, y, 'font-size': 13, fill: '#a9b2c4', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}

export function eraAcuario(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
  texto(svg, 20, 28, '¿Cuándo empieza la Era de Acuario?', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });

  // Barras de Campion
  const maxN = 29, altoMax = 120;
  for (const [siglo, n] of Object.entries(CAMPION)) {
    const a = (siglo - 1) * 100;
    const h = (n / maxN) * altoMax;
    const r = el('rect', { x: x(a) + 1.5, y: BASE - h, width: x(a + 100) - x(a) - 3, height: h, fill: '#3b4a6b' }, svg);
    el('title', {}, r).textContent = `Siglo ${siglo}: ${n} propuestas`;
    texto(svg, (x(a) + x(a + 100)) / 2, BASE - h - 5, String(n), { 'font-size': 11, 'text-anchor': 'middle' });
  }
  texto(svg, x(1700), BASE - altoMax - 28, 'Propuestas por siglo según Campion (1999)', { 'font-size': 12 });

  // Eje
  el('line', { x1: X0, x2: X1, y1: BASE, y2: BASE, stroke: '#a9b2c4', 'stroke-opacity': 0.7 }, svg);
  for (let a = 1500; a <= 3500; a += 500) {
    el('line', { x1: x(a), x2: x(a), y1: BASE, y2: BASE + 6, stroke: '#a9b2c4' }, svg);
    texto(svg, x(a), BASE + 19, String(a), { 'font-size': 12, 'text-anchor': 'middle' });
  }
  const hoy = new Date().getUTCFullYear();
  el('line', { x1: x(hoy), x2: x(hoy), y1: 60, y2: BASE, stroke: '#ebe5d5', 'stroke-opacity': 0.5, 'stroke-dasharray': '2 3' }, svg);
  texto(svg, x(hoy) + 4, 66, 'hoy', { 'font-size': 11, fill: '#ebe5d5' });

  // Fechas concretas, en cuatro alturas para que no se monten
  // Altura del rótulo de cada fecha, en el mismo orden que FECHAS
  const NIVELES = [370, 394, 370, 418, 442, 418, 370];
  const marcas = FECHAS.map(([a, rot, tipo, expl], i) => {
    const y = NIVELES[i];
    const g = el('g', { tabindex: 0, role: 'button', 'aria-label': `${a}: ${rot}`, style: 'cursor:pointer' }, svg);
    el('line', { x1: x(a), x2: x(a), y1: BASE + 24, y2: y - 12, stroke: COLOR[tipo], 'stroke-opacity': 0.6 }, g);
    el('circle', { cx: x(a), cy: BASE, r: 4.5, fill: COLOR[tipo] }, g);
    const derecha = x(a) < W - 120;
    texto(g, x(a) + (derecha ? 4 : -4), y, `${a} ${rot}`, { 'font-size': 12, fill: COLOR[tipo], 'text-anchor': derecha ? 'start' : 'end' });
    const elegir = () => mostrar(i);
    g.addEventListener('click', elegir);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(); } });
    return g;
  });

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Criterio');
  const leyenda = [['autor', 'Autores y escuelas'], ['sideral', 'Signos siderales iguales'], ['uai', 'Fronteras de la UAI']];
  fila.append(...leyenda.map(([tipo, t]) => {
    const b = boton(t, () => resaltar(tipo));
    b.style.borderColor = COLOR[tipo];
    return b;
  }));
  barra.append(dato, fila);

  function resaltar(tipo) {
    marcas.forEach((g, i) => g.setAttribute('opacity', FECHAS[i][2] === tipo ? 1 : 0.25));
    const n = FECHAS.filter((f) => f[2] === tipo).map((f) => f[3]).join(' ');
    dato.innerHTML = n;
  }
  function mostrar(i) {
    marcas.forEach((g, k) => g.setAttribute('opacity', k === i ? 1 : 0.35));
    dato.innerHTML = `<strong>${FECHAS[i][0]}.</strong> ${FECHAS[i][3]}`;
  }
  dato.innerHTML = 'Las fechas propuestas van de 1447 a 3597. Las barras muestran cuántas propuestas recogió Nicholas Campion en cada siglo: la mayoría, en el siglo XX. Toca una fecha o un criterio para ver de dónde sale.';
  svg.setAttribute('aria-label', `Línea del tiempo de la Era de Acuario. ${dato.textContent}`);
  return { destruir() {} };
}
