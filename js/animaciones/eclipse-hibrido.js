// Interactivo: el eclipse híbrido en dos modelos.
// Arriba, el modelo del globo: el cono de sombra de la Luna llega al suelo en el centro del
// recorrido (total) y se queda corto en los extremos (anular) por la curvatura de la Tierra.
// Abajo, la disposición plana con la Luna delante del Sol, sin una explicación publicada del
// cambio de total a anular. Esquemas exagerados, no a escala.

import { svgNS, barraControles } from './comun.js';

const W = 640, H = 720;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 15, fill: '#a9b2c4', ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Vista desde el suelo: disco del Sol con la Luna delante, de radio relativo «proporcion».
function vistaLocal(padre, cx, cy, id) {
  const g = el('g', { transform: `translate(${cx} ${cy})` }, padre);
  el('circle', { r: 46, fill: '#0b1326', stroke: '#8fb0e0', 'stroke-opacity': 0.35 }, g);
  const corona = el('circle', { r: 44, fill: `url(#${id}-corona)` }, g);
  const sol = el('circle', { r: 26, fill: '#f2cf72' }, g);
  const luna = el('circle', { r: 26, fill: '#05070d' }, g);
  return {
    fijar(proporcion) {
      luna.setAttribute('r', (26 * proporcion).toFixed(2));
      const total = proporcion >= 1;
      corona.setAttribute('opacity', total ? 1 : 0);
      sol.setAttribute('opacity', 1);
    },
    g,
    corona,
  };
}

let contador = 0;

export function eclipseHibrido(contenedor) {
  const id = `hib${++contador}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  svg.innerHTML = `<defs>
    <radialGradient id="${id}-corona"><stop offset=".55" stop-color="#fff8e6" stop-opacity=".9"/><stop offset="1" stop-color="#e9e3d4" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-sol"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2cf72"/><stop offset="1" stop-color="#f2cf72" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}-arriba"><rect width="${W}" height="340"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="#0f1930"/>`;

  // ---------- Modelo del globo ----------
  const arriba = el('g', { 'clip-path': `url(#${id}-arriba)` }, svg);
  texto(arriba, 20, 32, 'Modelo del globo (astronomía moderna)', { fill: '#ebe5d5', 'font-size': 19, 'font-weight': 600 });
  const T = { x: 600, y: 190 }, R = 140;          // Tierra (solo se ve su lado izquierdo)
  const LUNA_X = 250, LUNA_R = 10, PUNTA_X = 470; // la punta del cono queda justo dentro de la Tierra
  el('circle', { cx: 40, cy: T.y, r: 60, fill: `url(#${id}-sol)` }, arriba);
  texto(arriba, 40, T.y + 80, 'Sol', { 'text-anchor': 'middle' });
  el('circle', { cx: T.x, cy: T.y, r: R, fill: '#1d3a5f', stroke: '#6f9fe0', 'stroke-opacity': 0.6 }, arriba);
  texto(arriba, 560, 332, 'Tierra', { 'text-anchor': 'middle' });
  const sombra = el('g', {}, arriba);
  const umbra = el('path', { fill: '#05070d', opacity: 0.85 }, sombra);
  const antumbra = el('path', { fill: 'none', stroke: '#d4ae5a', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, sombra);
  const luna = el('circle', { cx: LUNA_X, r: LUNA_R, fill: '#c9c2ae' }, sombra);
  const rotLuna = texto(sombra, LUNA_X, 0, 'Luna', { 'text-anchor': 'middle' });
  const rotPunta = texto(sombra, PUNTA_X - 4, 0, 'punta', { 'text-anchor': 'end', 'font-size': 13, fill: '#f3e6bf' });
  const marca = el('circle', { r: 6, fill: '#d4ae5a', stroke: '#0f1930', 'stroke-width': 2 }, arriba);
  const notaGlobo = texto(arriba, 20, 60, '', { fill: '#f3e6bf' });
  const vistaG = vistaLocal(arriba, 110, 275, id);
  texto(arriba, 110, 336, 'lo que se ve', { 'text-anchor': 'middle', 'font-size': 13 });

  // ---------- Modelo plano ----------
  const abajo = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 362, y2: 362, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, abajo);
  texto(abajo, 20, 396, 'Modelo plano (disposición de la wiki de la Flat Earth Society)', { fill: '#ebe5d5', 'font-size': 19, 'font-weight': 600 });
  const SUELO = 640;
  el('rect', { x: 20, y: SUELO, width: W - 40, height: 14, fill: '#1d3a5f' }, abajo);
  texto(abajo, W / 2, SUELO + 34, 'el plano, visto de lado', { 'text-anchor': 'middle', 'font-size': 13 });
  const SOL_Y = 450, LUNA_Y = 520, SEP = 30;
  const rayo = el('line', { stroke: '#d4ae5a', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, abajo);
  const solP = el('circle', { r: 11, fill: '#f2cf72' }, abajo);
  const lunaP = el('circle', { r: 10, fill: '#05070d', stroke: '#c9c2ae', 'stroke-width': 1.5 }, abajo);
  const obsP = el('circle', { cy: SUELO - 6, r: 6, fill: '#d4ae5a', stroke: '#0f1930', 'stroke-width': 2 }, abajo);
  texto(abajo, 20, 600, 'Sol y Luna, pequeños', { 'font-size': 13 });
  texto(abajo, 20, 617, 'y cercanos, sobre el plano', { 'font-size': 13 });
  const vistaP = vistaLocal(abajo, 110, 470, id);
  vistaP.fijar(1);
  vistaP.corona.setAttribute('opacity', 0);
  texto(vistaP.g, 0, 12, '?', { 'text-anchor': 'middle', 'font-size': 34, fill: '#f3e6bf', 'font-weight': 600 });
  texto(abajo, 110, 538, '¿total o anular?', { 'text-anchor': 'middle', 'font-size': 13 });
  texto(abajo, 20, 708, 'Las fuentes planas consultadas no explican qué cambia por el camino.', { fill: '#f3e6bf', 'font-size': 14 });

  // ---------- Controles ----------
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Recorrido</span><input type="range" min="-1" max="1" step="0.01" value="0" aria-label="Lugar del recorrido del eclipse, del amanecer al atardecer">';
  const entrada = rango.querySelector('input');
  barra.append(dato, rango);

  function fijar(s) {
    // Globo: la sombra barre la Tierra de arriba abajo
    const y = T.y + s * 110;
    luna.setAttribute('cy', y);
    rotLuna.setAttribute('y', y - 18);
    rotPunta.setAttribute('y', y - 10);
    umbra.setAttribute('d', `M${LUNA_X} ${y - LUNA_R} L${PUNTA_X} ${y} L${LUNA_X} ${y + LUNA_R} Z`);
    const pend = LUNA_R / (PUNTA_X - LUNA_X), xf = 640;
    antumbra.setAttribute('d', `M${PUNTA_X} ${y} L${xf} ${y - pend * (xf - PUNTA_X)} M${PUNTA_X} ${y} L${xf} ${y + pend * (xf - PUNTA_X)}`);
    const dy = y - T.y;
    const xs = T.x - Math.sqrt(R * R - dy * dy); // punto del suelo bajo el eje de la sombra
    marca.setAttribute('cx', xs); marca.setAttribute('cy', y);
    const proporcion = (PUNTA_X - LUNA_X) / (xs - LUNA_X); // tamaño de la Luna frente al Sol
    vistaG.fijar(proporcion);
    const total = xs <= PUNTA_X;
    const lugar = Math.abs(s) < 0.2 ? 'Centro del recorrido' : s < 0 ? 'Comienzo del recorrido, al amanecer' : 'Final del recorrido, al atardecer';
    notaGlobo.textContent = total ? 'La punta de la sombra llega al suelo: total' : 'La sombra se queda corta: anular';

    // Plano: el Sol y la Luna avanzan juntos sobre el plano
    const sx = 330 + s * 170;
    solP.setAttribute('cx', sx); solP.setAttribute('cy', SOL_Y);
    lunaP.setAttribute('cx', sx + SEP); lunaP.setAttribute('cy', LUNA_Y);
    const px = sx + SEP * ((SUELO - SOL_Y) / (LUNA_Y - SOL_Y));
    rayo.setAttribute('x1', sx); rayo.setAttribute('y1', SOL_Y); rayo.setAttribute('x2', px); rayo.setAttribute('y2', SUELO - 6);
    obsP.setAttribute('cx', px);

    dato.innerHTML = `<strong>${lugar}.</strong> Según el modelo del globo, ${total
      ? 'este lugar del suelo está lo bastante cerca de la Luna para que la punta de su sombra lo alcance: la Luna tapa el Sol entero y el eclipse es total.'
      : 'la curvatura aleja este lugar de la Luna y la punta de su sombra no llega: la Luna se ve algo más pequeña que el Sol y queda un anillo.'} ` +
      'En la disposición plana, la Luna tapa el Sol para quien queda en la línea entre los dos; el curso no ha encontrado una explicación publicada de por qué cambia de total a anular.';
    svg.setAttribute('aria-label', `Esquema de dos modelos del eclipse híbrido. ${dato.textContent}`);
  }

  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(0);
  return { destruir() {} };
}
