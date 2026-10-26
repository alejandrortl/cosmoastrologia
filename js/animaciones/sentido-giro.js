// Interactivo: el giro diario visto de cara al polo norte celeste (hemisferio norte) y de cara
// al polo sur celeste (hemisferio sur). Es una observación: no presupone ningún modelo.
// En los dos casos todo sube por el este y baja por el oeste; como el este queda a la derecha
// en un caso y a la izquierda en el otro, el giro se ve antihorario en el norte y horario en el sur.

import { svgNS, boton, barraControles, sinMovimiento, azar, bucle } from './comun.js';

const W = 640, H = 700, ALTO_PANEL = 350;
const K = 3.2;                // píxeles por grado de cielo
const GRADOS_POR_SEGUNDO = 14; // 1 segundo de animación ≈ 56 minutos de cielo

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 15, fill: '#a9b2c4', 'font-family': 'IBM Plex Sans, system-ui, sans-serif', ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Flecha curva alrededor de (cx, cy); sentido +1 horario, -1 antihorario (en pantalla). Ángulos en grados.
function flecha(padre, cx, cy, r, sentido, color, desde, arco) {
  const a0 = (desde * Math.PI) / 180, a1 = ((desde + sentido * arco) * Math.PI) / 180;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  el('path', { d: `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 ${sentido > 0 ? 1 : 0} ${p1[0]} ${p1[1]}`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, padre);
  const tang = a1 + (sentido * Math.PI) / 2;
  const punta = [[0, 0], [-11, -6], [-11, 6]].map(([u, v]) => [
    p1[0] + u * Math.cos(tang) - v * Math.sin(tang), p1[1] + u * Math.sin(tang) + v * Math.cos(tang)]);
  el('path', { d: `M${punta.map((p) => p.join(' ')).join('L')}Z`, fill: color }, padre);
}

// Estrellas guía del cielo austral: distancia al polo (grados) y ángulo en pantalla (grados)
const AUSTRALES = [
  { n: 'Cruz del Sur', d: 30, a: 200, cruz: true },
  { n: 'Punteros', d: 30, a: 160 },
  { n: null, d: 30.5, a: 150 },
];

function panel(svg, y0, hemi, idClip) {
  const norte = hemi === 'norte';
  const lat = norte ? 40 : 35;
  const P = { x: W / 2, y: y0 + 150 };
  const horizonte = P.y + lat * K;
  const sentido = norte ? -1 : 1;     // en pantalla: antihorario en el norte, horario en el sur
  const g = el('g', {}, svg);

  el('rect', { x: 0, y: y0, width: W, height: ALTO_PANEL, fill: '#0f1930' }, g);
  const defs = el('defs', {}, g);
  const clip = el('clipPath', { id: idClip }, defs);
  el('rect', { x: 0, y: y0, width: W, height: horizonte - y0 }, clip);
  const cielo = el('g', { 'clip-path': `url(#${idClip})` }, g);

  // Círculos de guía: cuanto más lejos del polo, mayor el círculo
  for (const d of [10, 25, lat, 60]) {
    el('circle', { cx: P.x, cy: P.y, r: d * K, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': d === lat ? 0.45 : 0.22, 'stroke-dasharray': '3 6' }, cielo);
  }

  // Estrellas que giran
  const giro = el('g', {}, cielo);
  const rnd = azar(norte ? 5 : 17);
  for (let i = 0; i < 170; i++) {
    const r = Math.sqrt(rnd()) * 330, a = rnd() * Math.PI * 2, b = Math.pow(rnd(), 3);
    el('circle', { cx: P.x + r * Math.cos(a), cy: P.y + r * Math.sin(a), r: 0.7 + b * 1.6, fill: '#f3ecd8', opacity: 0.35 + b * 0.6 }, giro);
  }
  if (norte) {
    el('circle', { cx: P.x + 2, cy: P.y - 1, r: 3.2, fill: '#f5dea0' }, giro);
  } else {
    el('circle', { cx: P.x + K, cy: P.y, r: 1.1, fill: '#f3ecd8', opacity: 0.5 }, giro); // Sigma Octantis
    for (const e of AUSTRALES) {
      const a = (e.a * Math.PI) / 180, r = e.d * K;
      const c = { x: P.x + r * Math.cos(a), y: P.y + r * Math.sin(a) };
      if (e.cruz) {
        for (const [dx, dy] of [[0, -9], [0, 8], [-6, 0], [6, -1]]) el('circle', { cx: c.x + dx, cy: c.y + dy, r: 2.3, fill: '#cfdcff' }, giro);
      } else el('circle', { cx: c.x, cy: c.y, r: 2.6, fill: '#cfdcff' }, giro);
      if (e.n) texto(giro, c.x, c.y + 24, e.n, { 'text-anchor': 'middle', 'font-size': 13, fill: '#cfdcff' });
    }
  }

  // Flechas del giro: suben por el este, pasan sobre el polo y bajan por el oeste
  const R = 60 * K, color = norte ? '#8fb0e0' : '#d4ae5a';
  const ladoEste = norte ? 0 : 180;  // ángulo en pantalla del lado este
  flecha(cielo, P.x, P.y, R, sentido, color, ladoEste + (norte ? 30 : -30), 45);
  flecha(cielo, P.x, P.y, 30 * K, sentido, color, norte ? -65 : -115, 50);
  flecha(cielo, P.x, P.y, R, sentido, color, norte ? 200 : -20, 40);

  // Suelo y puntos cardinales
  el('rect', { x: 0, y: horizonte, width: W, height: y0 + ALTO_PANEL - horizonte, fill: '#0a1122' }, g);
  el('line', { x1: 0, x2: W, y1: horizonte, y2: horizonte, stroke: '#a9c4ea', 'stroke-opacity': 0.4 }, g);
  const izq = norte ? 'Oeste' : 'Este', der = norte ? 'Este' : 'Oeste';
  texto(g, 16, horizonte + 22, izq, { fill: '#ebe5d5' });
  texto(g, W - 16, horizonte + 22, der, { fill: '#ebe5d5', 'text-anchor': 'end' });
  texto(g, W / 2, horizonte + 22, norte ? 'Norte' : 'Sur', { fill: '#ebe5d5', 'text-anchor': 'middle', 'font-weight': 600 });
  texto(g, W / 2, horizonte + 44, norte ? 'Sentido contrario a las agujas del reloj' : 'Sentido de las agujas del reloj',
    { fill: color, 'text-anchor': 'middle', 'font-size': 14 });

  // Rótulos fijos
  texto(g, 16, y0 + 28, norte ? 'Hemisferio norte (40° N), de cara al norte' : 'Hemisferio sur (35° S), de cara al sur',
    { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
  const xE = norte ? W - 16 : 16, ancla = norte ? 'end' : 'start';
  texto(g, xE, horizonte - 10, 'suben por el este', { fill: color, 'text-anchor': ancla, 'font-size': 14 });
  texto(g, norte ? 16 : W - 16, horizonte - 10, 'bajan por el oeste', { fill: color, 'text-anchor': norte ? 'start' : 'end', 'font-size': 14 });
  texto(g, P.x + 10, P.y - 10, norte ? 'Polaris' : 'Polo sur celeste', { fill: '#f5dea0', 'font-size': 13 });
  if (!norte) el('circle', { cx: P.x, cy: P.y, r: 6, fill: 'none', stroke: '#f5dea0', 'stroke-opacity': 0.8 }, g);

  return { giro, P, sentido };
}

export function sentidoGiro(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  svg.setAttribute('aria-label', 'Animación de dos cielos. Arriba, desde el hemisferio norte y de cara al norte, las estrellas giran alrededor de Polaris en sentido contrario a las agujas del reloj: suben por el este, a la derecha, y bajan por el oeste, a la izquierda. Abajo, desde el hemisferio sur y de cara al sur, giran alrededor del polo sur celeste en el sentido de las agujas del reloj: suben por el este, a la izquierda, y bajan por el oeste, a la derecha.');
  const paneles = [panel(svg, 0, 'norte', 'clip-giro-n'), panel(svg, ALTO_PANEL, 'sur', 'clip-giro-s')];
  el('line', { x1: 0, x2: W, y1: ALTO_PANEL, y2: ALTO_PANEL, stroke: '#8fb0e0', 'stroke-opacity': 0.3 }, svg);

  let angulo = sinMovimiento() ? 40 : 0;
  const fijar = () => paneles.forEach(({ giro, P, sentido }) =>
    giro.setAttribute('transform', `rotate(${sentido * angulo} ${P.x} ${P.y})`));
  fijar();

  const anim = bucle(svg, (dt) => { angulo = (angulo + dt * GRADOS_POR_SEGUNDO) % 360; fijar(); });

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.innerHTML = '<strong>Es el mismo giro.</strong> En los dos cielos las estrellas suben por el este y bajan por el oeste. De cara al norte el este queda a la derecha, y de cara al sur, a la izquierda: por eso un giro se ve antihorario y el otro horario. En los dos, cuanto más lejos del polo, mayor es el círculo.';
  const bPausa = boton('Pausar', () => {
    if (anim.activo) anim.pausar(); else anim.reanudar();
    bPausa.textContent = anim.activo ? 'Pausar' : 'Reproducir';
  });
  barra.append(dato, bPausa);
  if (sinMovimiento()) { anim.pausar(); bPausa.textContent = 'Reproducir'; }
  return { destruir: anim.destruir };
}
