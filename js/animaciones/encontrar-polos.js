// Interactivo: qué estrellas buscar para encontrar el polo norte celeste, el polo sur celeste y el
// ecuador celeste. Es una observación: mapas con las posiciones del catálogo (J2000, redondeadas).
// Los mapas de los polos están dibujados como se ven de cara a cada polo, y se pueden girar con la
// hora de la noche, porque el dibujo gira pero las líneas guía siguen señalando al polo.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 560;
const C = { x: W / 2, y: 280 }, K = 5.6; // píxeles por grado

// [nombre, ascensión recta (h), declinación (°), magnitud]
const NORTE = {
  polaris: ['Polaris', 2.530, 89.26, 2.0],
  dubhe: ['Dubhe', 11.062, 61.75, 1.8], merak: ['Merak', 11.031, 56.38, 2.3], phecda: [null, 11.897, 53.69, 2.4],
  megrez: [null, 12.257, 57.03, 3.3], alioth: [null, 12.900, 55.96, 1.8], mizar: [null, 13.399, 54.93, 2.2], alkaid: [null, 13.792, 49.31, 1.9],
  kochab: ['Kochab', 14.845, 74.16, 2.1], pherkad: [null, 15.345, 71.83, 3.0], eta: [null, 16.292, 75.76, 5.0],
  zeta: [null, 15.734, 77.79, 4.3], eps: [null, 16.766, 82.04, 4.2], yildun: [null, 17.537, 86.59, 4.4],
  caph: [null, 0.153, 59.15, 2.3], schedar: [null, 0.675, 56.54, 2.2], gcas: [null, 0.945, 60.72, 2.2],
  ruchbah: [null, 1.430, 60.24, 2.7], segin: [null, 1.907, 63.67, 3.4],
};
const SUR = {
  acrux: ['Acrux', 12.443, -63.10, 0.8, 8, 16], mimosa: [null, 12.795, -59.69, 1.3], gacrux: ['Gacrux', 12.519, -57.11, 1.6, 8, -8], delta: [null, 12.252, -58.75, 2.8],
  rigil: ['Alfa Centauri', 14.660, -60.83, -0.3, -8, -10, 'end'], hadar: ['Beta Centauri', 14.064, -60.37, 0.6, -8, 18, 'end'],
  achernar: ['Achernar', 1.629, -57.24, 0.5, 0, 22, 'middle'], sigma: ['Sigma Octantis', 21.146, -88.96, 5.4, 10, 18],
};
const ECUADOR = {
  mintaka: ['Mintaka', 5.533, -0.30, 2.2], alnilam: [null, 5.604, -1.20, 1.7], alnitak: [null, 5.679, -1.94, 1.8],
  betel: ['Betelgeuse', 5.919, 7.41, 0.5], rigel: ['Rigel', 5.242, -8.20, 0.1], bella: [null, 5.419, 6.35, 1.6], saiph: [null, 5.796, -9.67, 2.1],
  procyon: ['Proción', 7.655, 5.22, 0.4], sirius: ['Sirio', 6.752, -16.72, -1.5], aldebaran: ['Aldebarán', 4.599, 16.51, 0.9],
};

const MAPAS = [
  {
    id: 'norte', nombre: 'Polo norte celeste', estrellas: NORTE, inicio: 9,
    lineas: [['merak', 'dubhe', 'megrez', 'phecda', 'merak'], ['megrez', 'alioth', 'mizar', 'alkaid'],
      ['polaris', 'yildun', 'eps', 'zeta', 'eta', 'pherkad', 'kochab', 'zeta'], ['caph', 'schedar', 'gcas', 'ruchbah', 'segin']],
    guias: [['merak', 'polaris', 1.0]],
    rotulos: [['dubhe', 'Osa Mayor (el Carro)', 0, 46], ['kochab', 'Osa Menor', 0, 30], ['gcas', 'Casiopea', 0, -26]],
    texto: '<strong>Polo norte celeste.</strong> Busca la Osa Mayor, el Carro. Prolonga la línea de sus dos estrellas del extremo, Merak y Dubhe, unas cinco veces su separación: llegas a Polaris, la última estrella de la cola de la Osa Menor. Al otro lado de Polaris, a una distancia parecida, está la W de Casiopea. El polo está a menos de un grado de Polaris.',
  },
  {
    id: 'sur', nombre: 'Polo sur celeste', estrellas: SUR, inicio: 19,
    lineas: [['gacrux', 'acrux'], ['delta', 'mimosa']],
    guias: [['gacrux', null, 4.5], ['pointers']],
    rotulos: [['acrux', 'Cruz del Sur', 0, 34], ['rigil', 'los Punteros', 30, -24]],
    nubes: true,
    texto: '<strong>Polo sur celeste.</strong> No tiene estrella brillante. Prolonga el palo largo de la Cruz del Sur, de Gacrux a Acrux, unas cuatro veces y media su longitud. Después traza la perpendicular por el punto medio de los dos Punteros, Alfa y Beta Centauri. Donde se cruzan las dos líneas está, más o menos, el polo. Las dos Nubes de Magallanes forman con él un triángulo, y Achernar queda al otro lado.',
  },
  {
    id: 'ecuador', nombre: 'Ecuador celeste', estrellas: ECUADOR,
    lineas: [['betel', 'bella', 'mintaka', 'rigel', 'saiph', 'alnitak', 'betel'], ['mintaka', 'alnilam', 'alnitak']],
    rotulos: [['saiph', 'Orión', 30, 30]],
    texto: '<strong>Ecuador celeste.</strong> Busca el cinturón de Orión, tres estrellas en fila. La primera que sale, Mintaka, está a menos de medio grado del ecuador celeste: por eso Orión sale justo por el este y se pone justo por el oeste, se mire desde donde se mire. Proción queda un poco al norte de la línea y Rigel y Sirio, al sur. En verano del hemisferio norte, Altair, en el Águila, está unos 9° al norte del ecuador.',
  },
];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 14, fill: '#a9b2c4', 'font-family': 'IBM Plex Sans, system-ui, sans-serif', ...attrs }, padre);
  e.textContent = t;
  return e;
}
const radio = (mag) => Math.max(1.6, 5.2 - mag * 0.9);

// Posición en pantalla. Polos: proyección azimutal equidistante, de cara al polo, con la estrella
// que culmina arriba. De cara al norte la ascensión recta crece en sentido horario; de cara al sur,
// en sentido antihorario. Ecuador: franja con el este a la izquierda, como mirando al sur desde el norte.
function posicion(id, [, ar, dec], hora) {
  if (id === 'ecuador') return { x: C.x + (6 - ar) * 15 * 6.2, y: C.y - 30 - dec * 6.2 };
  const a = ((ar - hora) * 15 * Math.PI) / 180, r = (90 - Math.abs(dec)) * K;
  const s = id === 'norte' ? 1 : -1;
  return { x: C.x + s * r * Math.sin(a), y: C.y - r * Math.cos(a) };
}

export function encontrarPolos(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);
  const g = el('g', {}, svg);

  let mapa = MAPAS[0], hora = MAPAS[0].inicio;

  function dibujar() {
    g.innerHTML = '';
    const id = mapa.id;
    const P = (k) => posicion(id, mapa.estrellas[k], hora);
    texto(g, 16, 30, mapa.nombre, { fill: '#ebe5d5', 'font-size': 18, 'font-weight': 600 });
    texto(g, 16, 52, id === 'ecuador' ? 'Mirando al sur desde el hemisferio norte; desde el sur se ve del revés' : `De cara al ${id}; el dibujo gira a lo largo de la noche`, { 'font-size': 12.5 });

    if (id === 'ecuador') {
      const y0 = C.y - 30;
      el('line', { x1: 0, x2: W, y1: y0, y2: y0, stroke: '#f2cf72', 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }, g);
      texto(g, W - 16, y0 - 8, 'ecuador celeste', { fill: '#f2cf72', 'text-anchor': 'end' });
      texto(g, 16, H - 16, 'Este', { fill: '#ebe5d5' });
      texto(g, W - 16, H - 16, 'Oeste', { fill: '#ebe5d5', 'text-anchor': 'end' });
      texto(g, W / 2, 86, 'norte ↑', { 'text-anchor': 'middle', 'font-size': 12.5 });
      texto(g, W / 2, H - 16, 'sur ↓', { 'text-anchor': 'middle', 'font-size': 12.5 });
    } else {
      for (const d of [10, 20, 30, 40]) el('circle', { cx: C.x, cy: C.y, r: d * K, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.15, 'stroke-dasharray': '3 6' }, g);
      el('circle', { cx: C.x, cy: C.y, r: 7, fill: 'none', stroke: '#f2cf72', 'stroke-width': 2 }, g);
      texto(g, C.x - 12, C.y + (id === 'norte' ? -12 : 26), id === 'norte' ? 'polo norte celeste' : 'polo sur celeste', { fill: '#f2cf72', 'font-size': 13, 'text-anchor': 'end' });
    }

    // Nubes de Magallanes (centro aproximado)
    if (mapa.nubes) {
      for (const [n, ar, dec, rx, ry] of [['Gran Nube de Magallanes', 5.39, -69.75, 30, 18], ['Pequeña Nube', 0.877, -72.83, 18, 11]]) {
        const p = posicion(id, [n, ar, dec], hora);
        el('ellipse', { cx: p.x, cy: p.y, rx, ry, fill: '#cfdcff', opacity: 0.14 }, g);
        texto(g, p.x, p.y - ry - 6, n, { 'text-anchor': 'middle', 'font-size': 12, fill: '#cfdcff' });
      }
    }

    // Figuras
    for (const linea of mapa.lineas) {
      el('path', { d: 'M' + linea.map((k) => { const p = P(k); return `${p.x} ${p.y}`; }).join('L'), fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.5, 'stroke-width': 1.4 }, g);
    }
    // Líneas guía hacia el polo
    for (const guia of mapa.guias || []) {
      if (guia[0] === 'pointers') {
        const a = P('rigil'), b = P('hadar');
        const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#d4ae5a', 'stroke-opacity': 0.6 }, g);
        // perpendicular por el punto medio, hacia el polo
        el('line', { x1: m.x, y1: m.y, x2: C.x, y2: C.y, stroke: '#d4ae5a', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, g);
        continue;
      }
      const a = P(guia[0]);
      const b = guia[1] ? P(guia[1]) : C;
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#d4ae5a', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, g);
    }
    // Estrellas
    for (const [k, e] of Object.entries(mapa.estrellas)) {
      const p = P(k);
      el('circle', { cx: p.x, cy: p.y, r: radio(e[3]), fill: k === 'polaris' || k === 'mintaka' ? '#f5dea0' : '#f3ecd8' }, g);
      if (e[0]) texto(g, p.x + (e[4] ?? 8), p.y + (e[5] ?? -7), e[0], { 'font-size': 13, fill: '#ebe5d5', 'text-anchor': e[6] || 'start' });
    }
    for (const [k, t, dx, dy] of mapa.rotulos) {
      const p = P(k);
      texto(g, p.x + dx, p.y + dy, t, { 'text-anchor': 'middle', fill: '#8fb0e0', 'font-size': 14, 'font-style': 'italic' });
    }
    dato.innerHTML = mapa.texto;
    svg.setAttribute('aria-label', `Mapa de estrellas. ${dato.textContent}`);
  }

  const barra = barraControles(contenedor);
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Qué buscar');
  const botones = MAPAS.map((m) => {
    const b = boton(m.nombre, () => { mapa = m; botones.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); rango.style.display = m.id === 'ecuador' ? 'none' : ''; hora = m.inicio || 0; entrada.value = hora; dibujar(); }, { 'aria-pressed': String(m === mapa) });
    return b;
  });
  fila.append(...botones);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Girar con la noche</span><input type="range" min="0" max="24" step="0.25" value="0" aria-label="Hora sidérea">';
  const entrada = rango.querySelector('input');
  entrada.value = hora;
  entrada.addEventListener('input', () => { hora = +entrada.value; dibujar(); });
  barra.append(fila, dato, rango);

  dibujar();
  return { destruir() {} };
}
