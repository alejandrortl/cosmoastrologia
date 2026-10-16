// Interactivo: el lento giro del polo celeste (precesión).
// El círculo y su ritmo (unos 50,3" de arco al año, ~25.800 años por vuelta) son los que
// mide y usa la astronomía moderna; las posiciones de las estrellas son aproximadas
// (coordenadas eclípticas J2000 redondeadas), suficientes para un esquema.

import { svgNS, boton, barraControles, sinMovimiento, azar } from './comun.js';

const OBLICUIDAD = 23.44;            // grados
const RITMO = 50.29 / 3600;          // grados por año
const ESTRELLAS = [
  { n: 'Polaris', l: 88.6, b: 66.1, m: 2.0 },
  { n: 'Kochab', l: 132.8, b: 72.9, m: 2.1 },
  { n: 'Thuban', l: 157.3, b: 66.3, m: 3.7 },
  { n: 'Vega', l: 285.3, b: 61.7, m: 0.0 },
  { n: 'Deneb', l: 335.3, b: 59.9, m: 1.3 },
  { n: 'Alderamin', l: 12.8, b: 68.9, m: 2.5 },
  { n: 'Errai', l: 62.0, b: 64.6, m: 3.2 },
];
const MIN = -3000, MAX = 14000;
const ESCALA = 6;                    // píxeles por grado
const R = 36 * ESCALA;

const rad = (g) => (g * Math.PI) / 180;

function proyectar(l, b) {
  const rho = (90 - b) * ESCALA;
  return [rho * Math.cos(rad(l)), -rho * Math.sin(rad(l))];
}

function poloEn(anio) {
  return { l: 90 + RITMO * (2000 - anio), b: 90 - OBLICUIDAD };
}

function distancia(a, b) {
  const c = Math.sin(rad(a.b)) * Math.sin(rad(b.b)) + Math.cos(rad(a.b)) * Math.cos(rad(b.b)) * Math.cos(rad(a.l - b.l));
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

export const textoAnio = (a) => (a < 0 ? `${Math.round(-a)} a. C.` : `${Math.round(a)}`);

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

export function precesion(contenedor) {
  const svg = el('svg', { viewBox: `${-R} ${-R} ${2 * R} ${2 * R}`, class: 'escena', role: 'img' });
  contenedor.append(svg);

  // Fondo de estrellas tenues
  const fondo = el('g', { opacity: 0.3 }, svg);
  const rnd = azar(3);
  for (let i = 0; i < 120; i++) {
    el('circle', { cx: (rnd() * 2 - 1) * R, cy: (rnd() * 2 - 1) * R, r: 0.5 + rnd() * 0.9, fill: '#f3ecd8' }, fondo);
  }

  // Círculo de la precesión con marcas de años
  el('circle', { cx: 0, cy: 0, r: OBLICUIDAD * ESCALA, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.45, 'stroke-dasharray': '3 5' }, svg);
  const marcas = el('g', { 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 11, fill: '#a9b2c4' }, svg);
  for (const a of [-1000, 2000, 6000, 10000, 14000]) {
    const p = poloEn(a);
    const [x, y] = proyectar(p.l, p.b);
    el('circle', { cx: x, cy: y, r: 2, fill: '#8fb0e0' }, marcas);
    const t = el('text', { x: x * 1.16, y: y * 1.16 + 4, 'text-anchor': 'middle' }, marcas);
    t.textContent = textoAnio(a);
  }

  // Estrellas con nombre
  const grupo = el('g', { 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 13 }, svg);
  for (const s of ESTRELLAS) {
    const [x, y] = proyectar(s.l, s.b);
    el('circle', { cx: x, cy: y, r: Math.max(2.2, 6 - s.m * 1.1), fill: '#f3ecd8' }, grupo);
    const t = el('text', { x: x + 9, y: y + 4, fill: '#ebe5d5' }, grupo);
    t.textContent = s.n;
  }

  // El polo en el año elegido
  const rastro = el('path', { fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2, 'stroke-opacity': 0.7 }, svg);
  const polo = el('g', {}, svg);
  el('circle', { r: 9, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2 }, polo);
  el('path', { d: 'M-15 0h8M7 0h8M0-15v8M0 7v8', stroke: '#d4ae5a', 'stroke-width': 2 }, polo);
  const centro = el('g', { 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 11, fill: '#a9b2c4' }, svg);
  el('circle', { r: 2, fill: '#a9b2c4' }, centro);

  // Controles
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Año</span><input type="range" min="${MIN}" max="${MAX}" step="50" value="2000" aria-label="Año">`;
  const entrada = rango.querySelector('input');
  let animando = null;
  const botonAnimar = boton('Ver pasar los siglos', () => alternarAnimacion());
  const atajos = [[-2700, 'Pirámides'], [-400, 'Grecia clásica'], [2026, 'Hoy'], [14000, 'Año 14000']]
    .map(([a, t]) => boton(t, () => { pararAnimacion(); fijar(a); }));
  barra.append(dato, rango, ...atajos, botonAnimar);

  function fijar(anio) {
    anio = Math.max(MIN, Math.min(MAX, anio));
    entrada.value = anio;
    const p = poloEn(anio);
    const [x, y] = proyectar(p.l, p.b);
    polo.setAttribute('transform', `translate(${x} ${y})`);
    // rastro desde el inicio del rango
    let d = '';
    for (let a = MIN; a <= anio; a += 100) {
      const q = poloEn(a); const [px, py] = proyectar(q.l, q.b);
      d += `${d ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    rastro.setAttribute('d', d);

    const masCerca = ESTRELLAS.map((s) => ({ s, d: distancia(p, { l: s.l, b: s.b }) })).sort((a, b) => a.d - b.d)[0];
    const g = masCerca.d.toFixed(1).replace('.', ',');
    dato.innerHTML = masCerca.d < 5
      ? `En el año <strong>${textoAnio(anio)}</strong>, la estrella brillante más cercana al polo es <strong>${masCerca.s.n}</strong>, a ${g}°.`
      : `En el año <strong>${textoAnio(anio)}</strong> no hay ninguna estrella brillante junto al polo; la más próxima es ${masCerca.s.n}, a ${g}°.`;
    svg.setAttribute('aria-label', `Mapa del cielo polar. ${dato.textContent}`);
  }

  function pararAnimacion() {
    if (animando) { cancelAnimationFrame(animando); animando = null; botonAnimar.textContent = 'Ver pasar los siglos'; }
  }
  function alternarAnimacion() {
    if (animando) { pararAnimacion(); return; }
    let anio = +entrada.value >= MAX ? MIN : +entrada.value;
    let ultimo = 0;
    botonAnimar.textContent = 'Detener';
    const vel = sinMovimiento() ? 4000 : 1200; // años por segundo
    const paso = (t) => {
      const dt = ultimo ? (t - ultimo) / 1000 : 0; ultimo = t;
      anio += dt * vel;
      if (anio >= MAX) { fijar(MAX); pararAnimacion(); return; }
      fijar(Math.round(anio));
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }

  entrada.addEventListener('input', () => { pararAnimacion(); fijar(+entrada.value); });
  fijar(2026);

  return { destruir: pararAnimacion };
}
