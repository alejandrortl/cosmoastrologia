// Interactivo: constelaciones del zodiaco frente a signos del zodiaco tropical, y cómo
// la precesión los va separando. Las fronteras de las constelaciones a lo largo de la
// eclíptica son aproximadas (según las fronteras de la UAI de 1930); el ritmo de la
// precesión (unos 50,3" al año) es el que usa la astronomía moderna.

import { svgNS, boton, barraControles } from './comun.js';

// Longitud eclíptica (J2000, grados) donde el Sol entra en cada constelación.
const CONSTELACIONES = [
  ['Aries', 28.7], ['Tauro', 53.4], ['Géminis', 90.4], ['Cáncer', 118.3], ['Leo', 138.2],
  ['Virgo', 174.0], ['Libra', 218.0], ['Escorpio', 241.1], ['Ofiuco', 247.7],
  ['Sagitario', 266.3], ['Capricornio', 299.7], ['Acuario', 327.9], ['Piscis', 351.6],
];
const SIGNOS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio',
  'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
const RITMO = 50.29 / 3600;
const MIN = -2500, MAX = 3000;
const R1 = 250, R2 = 190, R3 = 130; // bordes de los anillos

const rad = (g) => (g * Math.PI) / 180;
const norm = (g) => ((g % 360) + 360) % 360;
// Ángulo en pantalla: 0° de longitud arriba, creciendo en sentido antihorario.
const punto = (lon, r) => [r * Math.sin(-rad(lon)), -r * Math.cos(rad(lon))];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

function sector(l1, l2, rExt, rInt) {
  const span = norm(l2 - l1);
  const grande = span > 180 ? 1 : 0;
  const [a, b] = punto(l1, rExt), [c, d] = punto(l1 + span, rExt);
  const [e, f] = punto(l1 + span, rInt), [g, h] = punto(l1, rInt);
  return `M${a} ${b}A${rExt} ${rExt} 0 ${grande} 0 ${c} ${d}L${e} ${f}A${rInt} ${rInt} 0 ${grande} 1 ${g} ${h}Z`;
}

const textoAnio = (a) => (a < 0 ? `${-a} a. C.` : `${a}`);

export function zodiaco(contenedor) {
  const svg = el('svg', { viewBox: '-280 -280 560 560', class: 'escena', role: 'img' });
  contenedor.append(svg);
  const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

  // Anillo exterior: constelaciones (fijas)
  const anilloC = el('g', {}, svg);
  CONSTELACIONES.forEach(([nombre, desde], i) => {
    const hasta = CONSTELACIONES[(i + 1) % CONSTELACIONES.length][1];
    el('path', { d: sector(desde, hasta, R1, R2), fill: i % 2 ? '#1d3054' : '#24395f', stroke: '#0f1930', 'stroke-width': 1.5 }, anilloC);
    const medio = desde + norm(hasta - desde) / 2;
    const [x, y] = punto(medio, (R1 + R2) / 2);
    const t = el('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': nombre === 'Ofiuco' || nombre === 'Escorpio' ? 10 : 13, fill: '#ebe5d5', ...fuente }, anilloC);
    t.textContent = nombre;
  });

  // Anillo interior: signos tropicales (giran con el equinoccio)
  const anilloS = el('g', {}, svg);
  const sectoresS = SIGNOS.map((nombre, i) => {
    const p = el('path', { fill: i % 2 ? 'rgba(212,174,90,.18)' : 'rgba(212,174,90,.3)', stroke: '#0f1930', 'stroke-width': 1.5 }, anilloS);
    const t = el('text', { 'text-anchor': 'middle', 'font-size': 12, fill: '#f3e6bf', ...fuente }, anilloS);
    t.textContent = nombre;
    return { p, t, i };
  });

  const rotC = el('text', { x: 0, y: -R1 - 10, 'text-anchor': 'middle', 'font-size': 12, fill: '#a9b2c4', ...fuente }, svg);
  rotC.textContent = 'Constelaciones';
  const centro = el('g', {}, svg);
  el('circle', { r: R3 - 6, fill: '#0f1930' }, centro);
  const tCentro = el('text', { y: -6, 'text-anchor': 'middle', 'font-size': 14, fill: '#a9b2c4', ...fuente }, centro);
  tCentro.textContent = 'Signos';
  const tCentro2 = el('text', { y: 14, 'text-anchor': 'middle', 'font-size': 12, fill: '#a9b2c4', ...fuente }, centro);
  tCentro2.textContent = '(zodiaco tropical)';

  const flecha = el('g', {}, svg);
  el('line', { x1: 0, y1: -R3 + 4, x2: 0, y2: -R1 - 2, stroke: '#d4ae5a', 'stroke-width': 2.5 }, flecha);
  el('circle', { cx: 0, cy: -R1 + 8, r: 6, fill: '#f2cf72' }, flecha);

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Año</span><input type="range" min="${MIN}" max="${MAX}" step="10" value="2026" aria-label="Año">`;
  const entrada = rango.querySelector('input');
  const atajos = [[-100, 'Hace unos 2.000 años'], [2026, 'Hoy'], [2600, 'Año 2600']]
    .map(([a, t]) => boton(t, () => { entrada.value = a; fijar(a); }));
  barra.append(dato, rango, ...atajos);

  function fijar(anio) {
    const equinoccio = norm(-(anio - 2000) * RITMO);
    sectoresS.forEach(({ p, t, i }) => {
      const desde = equinoccio + i * 30;
      p.setAttribute('d', sector(desde, desde + 30, R2 - 4, R3));
      const [x, y] = punto(desde + 15, (R2 - 4 + R3) / 2);
      t.setAttribute('x', x); t.setAttribute('y', y + 4);
    });
    const [fx, fy] = punto(equinoccio, 1);
    flecha.setAttribute('transform', `rotate(${(Math.atan2(fy, fx) * 180) / Math.PI + 90})`);

    let enC = CONSTELACIONES[CONSTELACIONES.length - 1][0];
    for (const [n, desde] of CONSTELACIONES) if (norm(equinoccio - desde) < norm(equinoccio - CONSTELACIONES.find((c) => c[0] === enC)[1])) enC = n;
    dato.innerHTML = `En el año <strong>${textoAnio(anio)}</strong>, el Sol del equinoccio de primavera está en la constelación de <strong>${enC}</strong>. ` +
      'Ahí empieza siempre el signo de Aries del zodiaco tropical, sea cual sea la constelación. ' +
      'Con las fronteras de la UAI, el equinoccio pasa a Acuario hacia el año 2600; los astrólogos dan fechas distintas para el comienzo de la llamada era de Acuario.';
    svg.setAttribute('aria-label', `Rueda del zodiaco. ${dato.textContent}`);
  }

  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(2026);
  return { destruir() {} };
}
