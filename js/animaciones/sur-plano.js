// Interactivo: las tres propuestas del modelo plano para el giro del cielo del sur,
// tal como las recoge la wiki de la Flat Earth Society. Esquemas simplificados.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';

const W = 640, H = 420;

const PROPUESTAS = [
  {
    id: 'perspectiva',
    nombre: 'Un centro: perspectiva',
    texto: 'Todo el cielo gira en torno al norte. Quien está en el sur y mira hacia fuera ve las estrellas pasar en sentido contrario, como algo que gira sobre nuestra cabeza y parece girar al revés según hacia dónde miremos.',
  },
  {
    id: 'cupula',
    nombre: 'Un centro: efecto de cúpula',
    texto: 'Según la hipótesis de la aceleración electromagnética, la luz se curva hacia arriba al recorrer grandes distancias. El cielo se vería como a través de una cúpula de cristal, y eso invertiría el giro aparente en el sur.',
  },
  {
    id: 'bipolar',
    nombre: 'Dos centros',
    texto: 'El modelo bipolar propone dos polos, uno al norte y otro al sur, cada uno con su propio cielo girando encima: en el norte en un sentido y en el sur en el contrario.',
  },
];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 15, fill: '#a9b2c4', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Flecha curva alrededor de (cx, cy); sentido +1 horario, -1 antihorario (en pantalla)
function flechaGiro(padre, cx, cy, r, sentido, color, desde = -40, arco = 110) {
  const a0 = (desde * Math.PI) / 180, a1 = ((desde + sentido * arco) * Math.PI) / 180;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  const g = el('g', { class: 'giro', 'data-cx': cx, 'data-cy': cy, 'data-sentido': sentido }, padre);
  el('path', { d: `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 ${sentido > 0 ? 1 : 0} ${p1[0]} ${p1[1]}`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  const tang = a1 + (sentido * Math.PI) / 2;
  const punta = [[0, 0], [-11, -6], [-11, 6]].map(([u, v]) => [
    p1[0] + u * Math.cos(tang) - v * Math.sin(tang), p1[1] + u * Math.sin(tang) + v * Math.cos(tang)]);
  el('path', { d: `M${punta.map((p) => p.join(' ')).join('L')}Z`, fill: color }, g);
  return g;
}

function estrellas(padre, cx, cy, rMax, n, semilla) {
  let s = semilla;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * rMax;
    el('circle', { cx: cx + r * Math.cos(a), cy: cy + r * Math.sin(a), r: 0.8 + rnd() * 1.2, fill: '#f3ecd8', opacity: 0.55 }, padre);
  }
}

function dibujar(g, id) {
  g.innerHTML = '';
  if (id === 'perspectiva') {
    const C = { x: 250, y: 210 }, R = 170;
    el('circle', { cx: C.x, cy: C.y, r: R, fill: '#1d3a5f' }, g);
    estrellas(g, C.x, C.y, R, 60, 7);
    el('circle', { cx: C.x, cy: C.y, r: 4, fill: '#ebe5d5' }, g);
    texto(g, C.x, C.y + 22, 'Centro (norte)', { 'text-anchor': 'middle', fill: '#ebe5d5' });
    flechaGiro(g, C.x, C.y, 70, -1, '#8fb0e0', -60, 140);
    texto(g, C.x - 40, C.y - 84, 'giro real', { fill: '#8fb0e0', 'font-size': 14 });
    // Observador en el sur mirando hacia fuera
    const O = { x: C.x + R * 0.8, y: C.y + R * 0.35 };
    el('path', { d: `M${O.x} ${O.y} L${O.x + 120} ${O.y + 10} L${O.x + 100} ${O.y + 70} Z`, fill: '#d4ae5a', opacity: 0.22 }, g);
    el('circle', { cx: O.x, cy: O.y, r: 7, fill: '#d4ae5a' }, g);
    texto(g, O.x - 10, O.y + 30, 'Observador en el sur', { 'text-anchor': 'middle', fill: '#f3e6bf', 'font-size': 14 });
    flechaGiro(g, O.x + 115, O.y + 40, 30, 1, '#d4ae5a', -90, 220);
    texto(g, O.x + 115, O.y - 8, 'giro que ve', { 'text-anchor': 'middle', fill: '#f3e6bf', 'font-size': 14 });
  } else if (id === 'cupula') {
    const suelo = 330;
    el('rect', { x: 0, y: suelo, width: W, height: H - suelo, fill: '#0b1326' }, g);
    el('path', { d: `M40 ${suelo} Q ${W / 2} 10 ${W - 40} ${suelo}`, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.5, 'stroke-dasharray': '6 6', 'stroke-width': 2 }, g);
    texto(g, W / 2, 60, 'el cielo se vería como a través de una cúpula', { 'text-anchor': 'middle', 'font-size': 14 });
    const O = { x: 170, y: suelo - 8 };
    // rayos que se curvan hacia arriba al alejarse
    for (const [dx, h] of [[360, 70], [300, 120], [240, 170]]) {
      el('path', { d: `M${O.x} ${O.y} Q ${O.x + dx * 0.55} ${O.y - h * 0.15} ${O.x + dx} ${O.y - h}`, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2, opacity: 0.8 }, g);
      el('circle', { cx: O.x + dx, cy: O.y - h, r: 4, fill: '#f3ecd8' }, g);
    }
    el('circle', { cx: O.x, cy: O.y, r: 7, fill: '#d4ae5a' }, g);
    texto(g, O.x, suelo + 30, 'Observador', { 'text-anchor': 'middle', fill: '#f3e6bf', 'font-size': 14 });
    texto(g, O.x + 300, suelo - 20, 'la luz se curva hacia arriba', { 'text-anchor': 'middle', fill: '#f3e6bf', 'font-size': 14 });
  } else {
    const N = { x: 200, y: 200 }, S = { x: 450, y: 220 };
    el('ellipse', { cx: 325, cy: 210, rx: 300, ry: 190, fill: '#1d3a5f' }, g);
    estrellas(g, N.x, N.y, 120, 35, 3);
    estrellas(g, S.x, S.y, 120, 35, 11);
    for (const [P, nombre, sentido, color] of [[N, 'Polo norte', -1, '#8fb0e0'], [S, 'Polo sur', 1, '#d4ae5a']]) {
      el('circle', { cx: P.x, cy: P.y, r: 5, fill: '#ebe5d5' }, g);
      texto(g, P.x, P.y + 24, nombre, { 'text-anchor': 'middle', fill: '#ebe5d5' });
      flechaGiro(g, P.x, P.y, 70, sentido, color, -60, 140);
    }
    texto(g, 325, 30, 'dos cielos que giran en sentidos contrarios', { 'text-anchor': 'middle', 'font-size': 14 });
  }
}

export function surPlano(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);
  const g = el('g', {}, svg);

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Propuesta');
  const botones = PROPUESTAS.map((p) => {
    const b = boton(p.nombre, () => fijar(p), { 'aria-pressed': 'false' });
    b.dataset.id = p.id;
    return b;
  });
  fila.append(...botones);
  barra.append(dato, fila);

  // Las flechas de giro rotan lentamente para sugerir el movimiento
  let id = 0, t0 = 0;
  const animar = (t) => {
    if (!t0) t0 = t;
    g.querySelectorAll('.giro').forEach((f) => {
      const ang = (((t - t0) / 1000) * 25 * +f.dataset.sentido) % 360;
      f.setAttribute('transform', `rotate(${ang} ${f.dataset.cx} ${f.dataset.cy})`);
    });
    id = requestAnimationFrame(animar);
  };
  if (!sinMovimiento()) id = requestAnimationFrame(animar);

  function fijar(p) {
    dibujar(g, p.id);
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === p.id)));
    dato.innerHTML = `<strong>${p.nombre}.</strong> ${p.texto}`;
    svg.setAttribute('aria-label', `Esquema del modelo plano. ${dato.textContent}`);
  }
  fijar(PROPUESTAS[0]);
  return { destruir() { cancelAnimationFrame(id); } };
}
