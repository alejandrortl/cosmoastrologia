// Interactivo: lo que avanzan el Sol, la Luna y los planetas frente a las estrellas, día a día.
// Es una observación: velocidades medias a lo largo de la eclíptica, sin los bucles retrógrados
// (que se ven en la sección de los planetas). El giro diario hacia el oeste lo arrastra todo a la vez.

import { svgNS, boton, barraControles, sinMovimiento, azar } from './comun.js';

const W = 640, H = 350;
const X0 = 24, X1 = W - 24, K = (X1 - X0) / 360;   // píxeles por grado de eclíptica
const CARRIL = 38, Y_CARRILES = 112;

// Velocidad media hacia el este frente a las estrellas, en grados por día, y posición de partida
const CUERPOS = [
  { n: 'Luna', v: 13.176, ini: 40, color: '#dfe6f2', r: 7 },
  { n: 'Sol', v: 0.9856, ini: 0, color: '#f2cf72', r: 8 },
  { n: 'Marte', v: 0.524, ini: 150, color: '#e08a6a', r: 4.5 },
  { n: 'Júpiter', v: 0.0831, ini: 250, color: '#e9d9b6', r: 5.5 },
  { n: 'Saturno', v: 0.0335, ini: 320, color: '#d8c79a', r: 5 },
];

// Constelaciones por las que pasa la eclíptica (longitud de entrada aproximada, límites de la IAU)
const CONSTELACIONES = [
  ['Aries', 29], ['Tauro', 53], ['Géminis', 90], ['Cáncer', 118], ['Leo', 138], ['Virgo', 174],
  ['Libra', 218], ['Escorpio', 241], ['Ofiuco', 248], ['Sagitario', 266], ['Capricornio', 300],
  ['Acuario', 328], ['Piscis', 351],
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
// Este a la izquierda, como el cielo mirando al sur desde el hemisferio norte
const xDe = (lon) => X1 - (((lon % 360) + 360) % 360) * K;
const fmt = (n, d = 0) => n.toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });

export function movimientosPropios(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);

  // Fondo de estrellas fijas y nombres de las constelaciones
  const rnd = azar(23);
  const yFin = Y_CARRILES + CARRIL * CUERPOS.length;
  for (let i = 0; i < 160; i++) {
    el('circle', { cx: X0 + rnd() * (X1 - X0), cy: 66 + rnd() * (yFin - 66), r: 0.6 + Math.pow(rnd(), 3) * 1.4, fill: '#f3ecd8', opacity: 0.4 }, svg);
  }
  CONSTELACIONES.forEach(([n, lon], i) => {
    const fin = CONSTELACIONES[(i + 1) % CONSTELACIONES.length][1];
    const ancho = ((fin - lon + 360) % 360);
    el('line', { x1: xDe(lon), x2: xDe(lon), y1: 66, y2: yFin, stroke: '#8fb0e0', 'stroke-opacity': 0.18 }, svg);
    if (ancho >= 15) {
      texto(svg, xDe(lon + ancho / 2), 94, n, { 'text-anchor': 'middle', 'font-size': 12, fill: '#8fb0e0', transform: `rotate(-30 ${xDe(lon + ancho / 2)} 94)` });
    }
  });
  texto(svg, 16, 26, 'Este', { fill: '#ebe5d5', 'font-weight': 600 });
  texto(svg, W - 16, 26, 'Oeste', { fill: '#ebe5d5', 'font-weight': 600, 'text-anchor': 'end' });
  texto(svg, 16, 48, '← movimiento propio, lento', { fill: '#d4ae5a' });
  texto(svg, W - 16, 48, 'giro diario, rápido →', { fill: '#d4ae5a', 'text-anchor': 'end' });

  const capas = CUERPOS.map((c, i) => {
    const y = Y_CARRILES + CARRIL * i + CARRIL / 2;
    el('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: '#8fb0e0', 'stroke-opacity': 0.12 }, svg);
    texto(svg, X0 + 2, y - 10, c.n, { 'font-size': 12, fill: c.color });
    const rastro = el('path', { fill: 'none', stroke: c.color, 'stroke-opacity': 0.55, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    const marca = el('circle', { r: c.r, fill: c.color, cy: y }, svg);
    return { c, y, rastro, marca };
  });
  const pie = texto(svg, W / 2, H - 14, '', { 'text-anchor': 'middle', fill: '#ebe5d5', 'font-size': 15 });

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Días</span><input type="range" min="0" max="365" step="1" value="0" aria-label="Días transcurridos">';
  const entrada = rango.querySelector('input');
  let dias = 0, animando = 0;
  const bAnimar = boton('Ver pasar los días', () => (animando ? parar() : animar()));
  barra.append(dato, rango, bAnimar);

  function fijar(d) {
    dias = d;
    for (const { c, y, rastro, marca } of capas) {
      const recorrido = c.v * d;
      const lon = c.ini + recorrido;
      marca.setAttribute('cx', xDe(lon));
      // Rastro desde la posición inicial, partido donde da la vuelta al borde de la tira
      let segs = '', desde = c.ini, falta = Math.min(recorrido, 359.9);
      while (falta > 0.01) {
        const aBorde = 360 - (((desde % 360) + 360) % 360);
        const tramo = Math.min(falta, aBorde - 0.01);
        segs += `M${xDe(desde)} ${y}L${xDe(desde + tramo)} ${y}`;
        desde += tramo + 0.01; falta -= tramo + 0.01;
      }
      rastro.setAttribute('d', segs);
    }
    pie.textContent = `Día ${d}: el cielo ha dado ${fmt(d)} ${d === 1 ? 'vuelta' : 'vueltas'} hacia el oeste`;
    const [luna, sol, marte, jup, sat] = CUERPOS.map((c) => c.v * d);
    dato.innerHTML = d === 0
      ? '<strong>Mueve los días.</strong> Cada astro parte de un punto del zodiaco. Las estrellas de fondo no se mueven entre sí; el Sol, la Luna y los planetas se van desplazando hacia el este, cada uno a su ritmo.'
      : `<strong>En ${d} ${d === 1 ? 'día' : 'días'}</strong>, frente a las estrellas: la Luna ha avanzado ${fmt(luna)}°${luna >= 360 ? ` (${fmt(luna / 360, 1)} vueltas)` : ''}, el Sol ${fmt(sol)}°, Marte ${fmt(marte)}°, Júpiter ${fmt(jup, 1)}° y Saturno ${fmt(sat, 1)}°. Son velocidades medias: los bucles hacia atrás de los planetas se ven en su sección.`;
    svg.setAttribute('aria-label', `Esquema de la franja del zodiaco. ${pie.textContent}. ${dato.textContent}`);
  }

  function parar() { cancelAnimationFrame(animando); animando = 0; bAnimar.textContent = 'Ver pasar los días'; }
  function animar() {
    if (dias >= 365) dias = 0;
    bAnimar.textContent = 'Detener';
    let ultimo = 0, t = dias;
    const paso = (ms) => {
      const dt = ultimo ? Math.min((ms - ultimo) / 1000, 0.1) : 0; ultimo = ms;
      t = Math.min(365, t + dt * (sinMovimiento() ? 15 : 8));
      entrada.value = Math.floor(t);
      fijar(Math.floor(t));
      if (t >= 365) { parar(); return; }
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }
  entrada.addEventListener('input', () => { parar(); fijar(+entrada.value); });
  fijar(0);
  return { destruir: parar };
}
