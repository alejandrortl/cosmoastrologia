// Interactivo: el recorrido del Sol por las seis puertas del este según el
// Libro de Enoc, cap. 72 (Libro de las Luminarias). Los datos de cada mes
// (puerta, días y reparto de las 18 partes) siguen el orden que da el texto;
// el dibujo es un esquema, no una ilustración de un manuscrito.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';

const MESES = [
  { puerta: 4, dias: 30, dia: 10, noche: 8 },
  { puerta: 5, dias: 30, dia: 11, noche: 7 },
  { puerta: 6, dias: 31, dia: 12, noche: 6 },
  { puerta: 6, dias: 30, dia: 11, noche: 7 },
  { puerta: 5, dias: 30, dia: 10, noche: 8 },
  { puerta: 4, dias: 31, dia: 9, noche: 9 },
  { puerta: 3, dias: 30, dia: 8, noche: 10 },
  { puerta: 2, dias: 30, dia: 7, noche: 11 },
  { puerta: 1, dias: 31, dia: 6, noche: 12 },
  { puerta: 1, dias: 30, dia: 7, noche: 11 },
  { puerta: 2, dias: 30, dia: 8, noche: 10 },
  { puerta: 3, dias: 31, dia: 9, noche: 9 },
];

const W = 640, H = 330, HORIZONTE = 230;
// Mirando al este: el norte queda a la izquierda y el sur a la derecha.
const xPuerta = (n) => 80 + (6 - n) * 96;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

export function puertasEnoc(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

  const degradado = el('linearGradient', { id: 'cielo-enoc', x1: 0, y1: 0, x2: 0, y2: 1 }, el('defs', {}, svg));
  el('stop', { offset: 0, 'stop-color': '#0f1a33' }, degradado);
  el('stop', { offset: 1, 'stop-color': '#2a3f68' }, degradado);
  el('rect', { width: W, height: HORIZONTE, fill: 'url(#cielo-enoc)' }, svg);

  // El Sol (detrás de las puertas)
  const sol = el('g', { style: 'transition: transform .9s cubic-bezier(.3,.7,.3,1)' }, svg);
  el('circle', { r: 30, fill: '#d4ae5a', opacity: 0.25 }, sol);
  el('circle', { r: 19, fill: '#f2cf72' }, sol);

  // Camino de regreso nocturno "por el norte"
  el('path', { d: `M${W - 20} ${HORIZONTE - 6} C ${W * 0.7} 30, ${W * 0.2} 30, 22 ${HORIZONTE - 70}`, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.35, 'stroke-dasharray': '4 6' }, svg);

  // Suelo y puertas
  el('rect', { y: HORIZONTE, width: W, height: H - HORIZONTE, fill: '#0b1326' }, svg);
  const puertas = [];
  for (let n = 1; n <= 6; n++) {
    const x = xPuerta(n);
    const g = el('g', {}, svg);
    el('path', {
      d: `M${x - 34} ${HORIZONTE} V${HORIZONTE - 70} A34 34 0 0 1 ${x + 34} ${HORIZONTE - 70} V${HORIZONTE}`,
      fill: 'none', stroke: '#8fb0e0', 'stroke-width': 3, 'stroke-opacity': 0.55,
    }, g);
    const t = el('text', { x, y: HORIZONTE + 26, 'text-anchor': 'middle', 'font-size': 15, fill: '#a9b2c4', ...fuente }, g);
    t.textContent = `Puerta ${n}`;
    puertas.push(g);
  }
  const rotulo = (x, texto, ancla) => {
    const t = el('text', { x, y: H - 14, 'text-anchor': ancla, 'font-size': 13, fill: '#a9b2c4', ...fuente }, svg);
    t.textContent = texto;
  };
  rotulo(16, 'Norte', 'start');
  rotulo(W - 16, 'Sur', 'end');
  const rEste = el('text', { x: W / 2, y: 26, 'text-anchor': 'middle', 'font-size': 13, fill: '#a9b2c4', ...fuente }, svg);
  rEste.textContent = 'Horizonte del este';

  // Barra de las 18 partes
  const partes = el('g', {}, svg);
  const ancho = (W - 40) / 18;
  const casillas = Array.from({ length: 18 }, (_, i) =>
    el('rect', { x: 20 + i * ancho + 1, y: HORIZONTE + 44, width: ancho - 2, height: 14, rx: 3 }, partes));

  // Controles
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const meses = document.createElement('div');
  meses.className = 'meses';
  meses.setAttribute('role', 'group');
  meses.setAttribute('aria-label', 'Mes');
  const botones = MESES.map((_, i) => boton(`Mes ${i + 1}`, () => { parar(); fijar(i); }, { 'aria-pressed': 'false' }));
  meses.append(...botones);
  let temporizador = null;
  const botonRecorrer = boton('Recorrer el año', () => (temporizador ? parar() : recorrer()));
  barra.append(dato, meses, botonRecorrer);

  let actual = 0;
  function fijar(i) {
    actual = i;
    const m = MESES[i];
    sol.setAttribute('transform', `translate(${xPuerta(m.puerta)} ${HORIZONTE - 92})`);
    puertas.forEach((g, n) => g.querySelector('path').setAttribute('stroke', n + 1 === m.puerta ? '#d4ae5a' : '#8fb0e0'));
    casillas.forEach((c, k) => c.setAttribute('fill', k < m.dia ? '#d4ae5a' : '#2f4a7a'));
    botones.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    dato.innerHTML = `<strong>Mes ${i + 1}</strong>: el Sol sale por la <strong>puerta ${m.puerta}</strong> durante ${m.dias} días. ` +
      `Al final del mes, de las 18 partes, <strong>${m.dia} son de día y ${m.noche} de noche</strong>.`;
    svg.setAttribute('aria-label', `Esquema del Libro de Enoc: ${dato.textContent}`);
  }
  function parar() {
    clearInterval(temporizador); temporizador = null; botonRecorrer.textContent = 'Recorrer el año';
  }
  function recorrer() {
    botonRecorrer.textContent = 'Detener';
    temporizador = setInterval(() => fijar((actual + 1) % 12), sinMovimiento() ? 2200 : 1400);
  }

  fijar(0);
  return { destruir: parar };
}
