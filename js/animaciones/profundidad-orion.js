// Esquema: ¿están juntas las estrellas de una figura? Orión como se ve desde aquí y, debajo,
// cómo coloca cada modelo sus estrellas. Modelo moderno: cada estrella a su distancia (valores
// aproximados en años luz, con incertidumbres grandes en las más lejanas). Modelo plano y esferas
// antiguas: todas en la misma bóveda. Los ángulos de la vista lateral están exagerados para que se
// vean; las distancias del modelo moderno sí están a escala entre sí.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 640;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 14, fill: '#a9b2c4', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Nombre, ascensión recta y declinación (grados, J2000), magnitud, color y distancia aproximada (años luz)
const ESTRELLAS = [
  ['Betelgeuse', 88.79, 7.41, 0.45, '#ffb38a', 550],
  ['Bellatrix', 81.28, 6.35, 1.64, '#d8e4ff', 250],
  ['Mintaka', 83.00, -0.30, 2.25, '#d8e4ff', 1200],
  ['Alnilam', 84.05, -1.20, 1.69, '#d8e4ff', 2000],
  ['Alnitak', 85.19, -1.94, 1.74, '#d8e4ff', 1260],
  ['Saiph', 86.94, -9.67, 2.07, '#d8e4ff', 650],
  ['Rigel', 78.63, -8.20, 0.18, '#cfe0ff', 860],
];
const LINEAS = [['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Betelgeuse', 'Alnitak'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Saiph', 'Rigel']];
const RA0 = 83.9, DEC0 = -1.0;

export function profundidadOrion(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
  const por = Object.fromEntries(ESTRELLAS.map((s) => [s[0], s]));
  const radio = (mag) => Math.max(2.5, 7 - mag * 1.6);

  // ---- Arriba: lo que se ve ----
  texto(svg, 20, 30, 'Lo que se ve desde la Tierra', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
  const frente = (s) => ({ x: W / 2 - (s[1] - RA0) * 15, y: 150 - (s[2] - DEC0) * 12 });
  const gF = el('g', {}, svg);
  LINEAS.forEach(([a, b]) => { const p = frente(por[a]), q = frente(por[b]); el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: '#8fb0e0', 'stroke-opacity': 0.4, 'stroke-width': 1.3 }, gF); });
  ESTRELLAS.forEach((s) => {
    const p = frente(s);
    el('circle', { cx: p.x, cy: p.y, r: radio(s[3]), fill: s[4] }, gF);
    // Posición de cada rótulo: [dx, dy, alineación]
    const [dx, dy, al] = { Alnilam: [-4, -12, 'end'], Alnitak: [-12, 14, 'end'], Mintaka: [12, 3, 'start'] }[s[0]] || (p.x > W / 2 + 10 ? [12, 5, 'start'] : [-12, 5, 'end']);
    texto(gF, p.x + dx, p.y + dy, s[0], { 'text-anchor': al, 'font-size': 13, fill: '#ebe5d5' });
  });
  texto(svg, W / 2, 285, 'Todas parecen igual de lejos: solo se ven direcciones y brillos', { 'text-anchor': 'middle', 'font-size': 13 });
  el('line', { x1: 20, x2: W - 20, y1: 305, y2: 305, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  // ---- Abajo: vista de lado según el modelo elegido ----
  const titulo = texto(svg, 20, 338, '', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
  const lado = el('g', {}, svg);
  const O = { x: 46, y: 480 };
  const EXAG = 2.4; // exageración de los ángulos verticales
  const angulo = (s) => (((s[2] - DEC0) * EXAG) * Math.PI) / 180;

  function moderno() {
    lado.innerHTML = '';
    titulo.textContent = 'Según la astronomía moderna: vista de lado';
    const escala = (W - 110) / 2000;
    // Regla de distancias
    for (let d = 0; d <= 2000; d += 500) {
      const x = O.x + d * escala;
      el('line', { x1: x, x2: x, y1: 600, y2: 606, stroke: '#a9b2c4' }, lado);
      texto(lado, x, 624, d ? `${d.toLocaleString('es-ES')}` : '0', { 'text-anchor': 'middle', 'font-size': 12 });
    }
    el('line', { x1: O.x, x2: O.x + 2000 * escala, y1: 600, y2: 600, stroke: '#a9b2c4', 'stroke-opacity': 0.6 }, lado);
    texto(lado, W - 20, 590, 'años luz', { 'text-anchor': 'end', 'font-size': 12 });
    ESTRELLAS.forEach((s) => {
      const a = angulo(s), d = s[5] * escala;
      const p = { x: O.x + d * Math.cos(a), y: O.y - d * Math.sin(a) };
      const largo = Math.min(W - 80, 115 / Math.max(0.01, Math.abs(Math.sin(a))));
      const fin = { x: O.x + largo * Math.cos(a), y: O.y - largo * Math.sin(a) };
      el('line', { x1: O.x, y1: O.y, x2: fin.x, y2: fin.y, stroke: '#8fb0e0', 'stroke-opacity': 0.18, 'stroke-dasharray': '3 5' }, lado);
      el('circle', { cx: p.x, cy: p.y, r: radio(s[3]), fill: s[4] }, lado);
      const fin2 = p.x > W - 170, abajo = s[0] === 'Rigel';
      texto(lado, p.x + (fin2 ? -9 : 9), p.y + (abajo ? 20 : -8), `${s[0]} · ~${s[5].toLocaleString('es-ES')}`, { 'font-size': 12, fill: '#ebe5d5', 'text-anchor': fin2 ? 'end' : 'start' });
    });
    dato.innerHTML = 'Según la astronomía moderna, las estrellas de Orión están a distancias muy distintas, medidas con la paralaje y con la luminosidad de cada tipo de estrella. Bellatrix estaría a unos 250 años luz y Alnilam a unos 2.000: ocho veces más lejos. Solo coinciden en la dirección en que las vemos.';
    tierra();
  }

  function boveda() {
    lado.innerHTML = '';
    titulo.textContent = 'Según el modelo plano y las esferas antiguas';
    const R = 300;
    const a1 = -0.45, a2 = 0.5;
    const arco = `M${O.x + R * Math.cos(a1)} ${O.y - R * Math.sin(a1)} A${R} ${R} 0 0 0 ${O.x + R * Math.cos(a2)} ${O.y - R * Math.sin(a2)}`;
    el('path', { d: arco, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.55, 'stroke-width': 2 }, lado);
    texto(lado, O.x + R * Math.cos(a1) + 10, O.y - R * Math.sin(a1) + 4, 'bóveda o esfera de las estrellas', { 'font-size': 12 });
    ESTRELLAS.forEach((s) => {
      const a = angulo(s);
      const p = { x: O.x + R * Math.cos(a), y: O.y - R * Math.sin(a) };
      el('line', { x1: O.x, y1: O.y, x2: p.x, y2: p.y, stroke: '#8fb0e0', 'stroke-opacity': 0.18, 'stroke-dasharray': '3 5' }, lado);
      el('circle', { cx: p.x, cy: p.y, r: radio(s[3]), fill: s[4] }, lado);
      if (s[0] === 'Alnilam') texto(lado, p.x + 10, p.y + 4, 'cinturón (las Tres Marías)', { 'font-size': 12, fill: '#ebe5d5' });
      else if (!['Mintaka', 'Alnitak'].includes(s[0])) texto(lado, p.x + 10, p.y + (s[0] === 'Bellatrix' ? 10 : s[0] === 'Saiph' ? 12 : s[0] === 'Rigel' ? -2 : 0), s[0], { 'font-size': 12, fill: '#ebe5d5' });
    });
    dato.innerHTML = 'Para el modelo plano, las estrellas son luces de la bóveda que gira sobre el plano, relativamente cerca. Para Aristóteles y Ptolomeo, todas estaban engastadas en la esfera de las estrellas fijas. En los dos casos, las estrellas de una figura están a la misma distancia, y sus diferencias de brillo y color son propias de cada estrella.';
    tierra();
  }

  function tierra() {
    el('circle', { cx: O.x, cy: O.y, r: 7, fill: '#6f9fe0' }, lado);
    texto(lado, O.x, O.y + 24, 'Tierra', { 'text-anchor': 'middle', 'font-size': 12 });
    texto(lado, W - 20, 362, 'Esquema: ángulos exagerados', { 'text-anchor': 'end', 'font-size': 11 });
    svg.setAttribute('aria-label', `Orión visto de frente y de lado. ${dato.textContent}`);
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Modelo');
  const opciones = [['moderno', 'Astronomía moderna', moderno], ['boveda', 'Modelo plano y esferas antiguas', boveda]];
  const botones = opciones.map(([id, t, f]) => {
    const b = boton(t, () => { botones.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); f(); }, { 'aria-pressed': String(id === 'moderno') });
    return b;
  });
  fila.append(...botones);
  barra.append(dato, fila);
  moderno();
  return { destruir() {} };
}
