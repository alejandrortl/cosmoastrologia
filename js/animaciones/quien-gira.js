// Animación: qué gira cada día según cuatro modelos, vistos desde encima del polo norte.
// Heliocéntrico (Copérnico, Kepler, astronomía moderna), geocéntrico (Ptolomeo), geoheliocéntrico
// (Tycho Brahe) y plano (wiki de la Flat Earth Society). Todos reproducen la misma observación:
// un giro diario de este a oeste y unos astros que se retrasan hacia el este. Esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento, azar, bucle } from './comun.js';

const W = 640, H = 690, PW = 320, PH = 345;
const SIDEREO = 366.2422 / 365.2422;  // vueltas de las estrellas por cada día solar
const ANIO = 365.25, MES = 27.32, MARTE = 687;

const MODELOS = [
  { id: 'helio', nombre: 'Heliocéntrico', quien: 'Copérnico y la astronomía moderna', gira: 'Gira la Tierra; estrellas quietas' },
  { id: 'ptolomeo', nombre: 'Geocéntrico', quien: 'Ptolomeo', gira: 'Gira el cielo y lo arrastra todo' },
  { id: 'tycho', nombre: 'Geoheliocéntrico', quien: 'Tycho Brahe', gira: 'Gira el cielo; Marte, con el Sol' },
  { id: 'plano', nombre: 'Plano', quien: 'Wiki de la Flat Earth Society', gira: 'Gira la bóveda sobre el plano' },
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
const dir = (grados, r) => [r * Math.cos((grados * Math.PI) / 180), r * Math.sin((grados * Math.PI) / 180)];

function anilloEstrellas(padre, cx, cy, r, semilla) {
  const g = el('g', {}, padre);
  const rnd = azar(semilla);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * 360, rr = r - 8 + rnd() * 16;
    const [x, y] = dir(a, rr);
    el('circle', { cx: cx + x, cy: cy + y, r: 0.8 + Math.pow(rnd(), 3) * 1.6, fill: '#f3ecd8', opacity: 0.7 }, g);
  }
  // una estrella señalada, para seguir el giro
  const [x, y] = dir(-90, r);
  el('circle', { cx: cx + x, cy: cy + y, r: 3.4, fill: '#7fd3c0' }, g);
  return g;
}

function cuerpo(padre, r, color) { return el('circle', { r, fill: color }, padre); }
function observador(padre) {
  const g = el('g', {}, padre);
  el('circle', { r: 3.5, fill: '#d4ae5a' }, g);
  return g;
}
const mover = (e, x, y, rot = null) => e.setAttribute('transform', `translate(${x} ${y})${rot === null ? '' : ` rotate(${rot})`}`);

export function quienGira(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.2' });
  contenedor.append(svg);
  svg.setAttribute('aria-label', 'Animación de cuatro esquemas vistos desde encima del polo norte. Heliocéntrico: la Tierra rota en sentido antihorario y da la vuelta al Sol; las estrellas están quietas. Geocéntrico de Ptolomeo: la Tierra está quieta y el cielo gira en sentido horario arrastrando al Sol, la Luna y los planetas, que se retrasan. Geoheliocéntrico de Tycho Brahe: igual, pero los planetas giran alrededor del Sol. Plano: la bóveda de estrellas, el Sol y la Luna giran en sentido horario sobre el disco.');
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);
  el('line', { x1: PW, x2: PW, y1: 10, y2: H - 10, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);
  el('line', { x1: 10, x2: W - 10, y1: PH, y2: PH, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  const escenas = MODELOS.map((m, i) => {
    const ox = (i % 2) * PW, oy = Math.floor(i / 2) * PH;
    const C = { x: ox + PW / 2, y: oy + 182 };
    const g = el('g', {}, svg);
    texto(g, ox + 14, oy + 26, m.nombre, { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
    texto(g, ox + 14, oy + 46, m.quien, { 'font-size': 12.5 });
    texto(g, ox + PW / 2, oy + PH - 12, m.gira, { 'text-anchor': 'middle', 'font-size': 13, fill: '#d4ae5a' });
    const e = { m, C, g };
    if (m.id === 'helio') {
      e.estrellas = anilloEstrellas(g, C.x, C.y, 136, 3);
      el('circle', { cx: C.x, cy: C.y, r: 72, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.3, 'stroke-dasharray': '3 5' }, g);
      el('circle', { cx: C.x, cy: C.y, r: 11, fill: '#f2cf72' }, g);
      e.tierra = el('g', {}, g);
      el('circle', { r: 13, fill: '#1d3a5f', stroke: '#6f9fe0' }, e.tierra);
      e.obs = observador(e.tierra); e.obs.setAttribute('transform', 'translate(0 -13)');
      e.luna = cuerpo(g, 3.5, '#dfe6f2');
    } else if (m.id === 'plano') {
      el('circle', { cx: C.x, cy: C.y, r: 124, fill: '#1d3a5f' }, g);
      el('circle', { cx: C.x, cy: C.y, r: 128, fill: 'none', stroke: '#d9e3f0', 'stroke-opacity': 0.3, 'stroke-width': 5 }, g);
      el('circle', { cx: C.x, cy: C.y, r: 62, fill: 'none', stroke: '#a9c4ea', 'stroke-opacity': 0.35, 'stroke-dasharray': '3 5' }, g);
      el('circle', { cx: C.x, cy: C.y, r: 3, fill: '#ebe5d5' }, g);
      e.estrellas = anilloEstrellas(g, C.x, C.y, 100, 9);
      e.obs = observador(g); mover(e.obs, C.x + 30, C.y + 30);
      e.sol = cuerpo(g, 8, '#f2cf72');
      e.luna = cuerpo(g, 5, '#dfe6f2');
    } else {
      e.estrellas = anilloEstrellas(g, C.x, C.y, 136, m.id === 'tycho' ? 13 : 7);
      el('circle', { cx: C.x, cy: C.y, r: 15, fill: '#1d3a5f', stroke: '#6f9fe0' }, g);
      e.obs = observador(g); mover(e.obs, C.x, C.y - 15);
      if (m.id === 'ptolomeo') {
        for (const r of [36, 74, 108]) el('circle', { cx: C.x, cy: C.y, r, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.25, 'stroke-dasharray': '3 5' }, g);
      } else {
        for (const r of [32, 58]) el('circle', { cx: C.x, cy: C.y, r, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.25, 'stroke-dasharray': '3 5' }, g);
        e.orbitaMarte = el('circle', { r: 72, fill: 'none', stroke: '#e08a6a', 'stroke-opacity': 0.3, 'stroke-dasharray': '3 5' }, g);
      }
      e.luna = cuerpo(g, 4, '#dfe6f2');
      e.sol = cuerpo(g, 8, '#f2cf72');
      e.marte = cuerpo(g, 4, '#e08a6a');
    }
    return e;
  });

  let dias = 0, ritmo = 0.125;

  function fijar() {
    const cielo = 360 * SIDEREO * dias;         // giro diario de las estrellas, horario visto desde el norte
    const sol = -360 * (dias / ANIO), luna = -360 * (dias / MES) + 50, marte = -360 * (dias / MARTE) + 140;
    for (const e of escenas) {
      const { C } = e;
      if (e.m.id === 'helio') {
        const [tx, ty] = dir(90 + sol, 72);       // la Tierra recorre su órbita en sentido antihorario
        mover(e.tierra, C.x + tx, C.y + ty, -cielo);
        const [lx, ly] = dir(luna, 22);
        mover(e.luna, C.x + tx + lx, C.y + ty + ly);
        continue;
      }
      e.estrellas.setAttribute('transform', `rotate(${cielo} ${C.x} ${C.y})`);
      if (e.m.id === 'plano') {
        const [sx, sy] = dir(cielo - 90 + sol, 62); mover(e.sol, C.x + sx, C.y + sy);
        const [lx, ly] = dir(cielo + luna - 90, 78); mover(e.luna, C.x + lx, C.y + ly);
      } else if (e.m.id === 'ptolomeo') {
        const [lx, ly] = dir(cielo + luna, 36); mover(e.luna, C.x + lx, C.y + ly);
        const [sx, sy] = dir(cielo - 90 + sol, 74); mover(e.sol, C.x + sx, C.y + sy);
        const [mx, my] = dir(cielo + marte, 108); mover(e.marte, C.x + mx, C.y + my);
      } else {
        const [lx, ly] = dir(cielo + luna, 32); mover(e.luna, C.x + lx, C.y + ly);
        const [sx, sy] = dir(cielo - 90 + sol, 58);
        mover(e.sol, C.x + sx, C.y + sy);
        e.orbitaMarte.setAttribute('cx', C.x + sx); e.orbitaMarte.setAttribute('cy', C.y + sy);
        // Marte gira alrededor del Sol (vuelta en 687 días frente a las estrellas)
        const [mx, my] = dir(cielo + marte, 72); mover(e.marte, C.x + sx + mx, C.y + sy + my);
      }
    }
    const d = Math.floor(dias);
    contador.textContent = `Día ${d + 1} · hora ${String(Math.floor((dias - d) * 24)).padStart(2, '0')}`;
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.innerHTML = 'Puntos: <strong style="color:#f2cf72">Sol</strong>, <strong style="color:#dfe6f2">Luna</strong>, <strong style="color:#e08a6a">Marte</strong>, una estrella señalada en verde y, en dorado, un observador. ' +
    'Vistos desde encima del polo norte, en el primero gira la Tierra en sentido antihorario y en los otros tres gira el cielo en sentido horario. En los cuatro, el observador ve lo mismo: todo pasa ante él de este a oeste una vez al día, y la Luna, el Sol y Marte se quedan atrás frente a las estrellas. Con el ritmo rápido se ve mejor el retraso.';
  const contador = document.createElement('span');
  contador.className = 'lectura-dato';
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  const bLento = boton('Despacio: un día en 8 s', () => elegir(0.125), { 'aria-pressed': 'true' });
  const bRapido = boton('Deprisa: un día por segundo', () => elegir(1), { 'aria-pressed': 'false' });
  const bPausa = boton('Pausar', () => {
    if (anim.activo) anim.pausar(); else anim.reanudar();
    bPausa.textContent = anim.activo ? 'Pausar' : 'Reproducir';
  });
  const elegir = (r) => {
    ritmo = r;
    bLento.setAttribute('aria-pressed', String(r < 1)); bRapido.setAttribute('aria-pressed', String(r >= 1));
  };
  fila.append(bLento, bRapido, bPausa, boton('Volver al día 1', () => { dias = 0; fijar(); }));
  barra.append(dato, contador, fila);

  const anim = bucle(svg, (dt) => { dias += dt * ritmo; fijar(); });
  if (sinMovimiento()) { dias = 0.3; anim.pausar(); bPausa.textContent = 'Reproducir'; }
  fijar();
  return { destruir: anim.destruir };
}
