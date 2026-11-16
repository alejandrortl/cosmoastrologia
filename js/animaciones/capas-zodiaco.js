// Interactivo: las cuatro cosas que se llaman «zodiaco», en anillos, y qué se mueve respecto a qué.
// Fuera, las estrellas reales de la franja del zodiaco con las constelaciones de la UAI (fijas entre sí).
// Después, los signos siderales de Lahiri (anclados a las estrellas). Dentro, los signos tropicales
// (anclados al punto vernal, que la precesión desplaza respecto a las estrellas).
// El botón «Girar como cada noche» hace girar todo junto: el giro diario no desfasa nada.
// Estrellas: d3-celestial de Olaf Frohn (catálogo Hipparcos), pasadas a coordenadas eclípticas J2000.
// Precesión: 50,29″ por año. Ayanamsa de Lahiri: 23,857° en 2000. Esquema, no a escala.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';
import { cielo } from '../datos/cielo.js';

const W = 600, H = 600, C = { x: W / 2, y: H / 2 };
const R_EST = 275, R_CON = 236, R_SID = 196, R_TRO = 150, ANCHO = 34;
const RITMO = 50.29 / 3600;
const AYAN_2000 = 23.857;
const OBL = 23.4393;
const MIN = -1500, MAX = 4500;
const rad = (g) => (g * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const norm = (g) => ((g % 360) + 360) % 360;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const SIGNOS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
const CONSTELACIONES = [
  ['Aries', 28.7], ['Tauro', 53.4], ['Géminis', 90.4], ['Cáncer', 118.3], ['Leo', 138.2],
  ['Virgo', 174.0], ['Libra', 218.0], ['Escorpio', 241.1], ['Ofiuco', 247.7],
  ['Sagitario', 266.3], ['Capricornio', 299.7], ['Acuario', 327.9], ['Piscis', 351.6],
];
const textoAnio = (a) => (a < 0 ? `${-a} a. C.` : `${a}`);

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
// Longitud eclíptica en pantalla: 0° a la derecha y creciendo en sentido antihorario (hacia el este)
const pt = (lon, r) => ({ x: C.x + r * Math.cos(-rad(lon)), y: C.y + r * Math.sin(-rad(lon)) });
function sector(l1, span, rExt, rInt) {
  const g = span > 180 ? 1 : 0;
  const a = pt(l1, rExt), b = pt(l1 + span, rExt), c = pt(l1 + span, rInt), d = pt(l1, rInt);
  return `M${a.x} ${a.y}A${rExt} ${rExt} 0 ${g} 0 ${b.x} ${b.y}L${c.x} ${c.y}A${rInt} ${rInt} 0 ${g} 1 ${d.x} ${d.y}Z`;
}
function eclipticas(ra, dec) {
  const x = Math.cos(rad(dec)) * Math.cos(rad(ra)), y = Math.cos(rad(dec)) * Math.sin(rad(ra)), z = Math.sin(rad(dec));
  const ye = y * Math.cos(rad(OBL)) + z * Math.sin(rad(OBL)), ze = -y * Math.sin(rad(OBL)) + z * Math.cos(rad(OBL));
  return { lon: norm(deg(Math.atan2(ye, x))), lat: deg(Math.asin(ze)) };
}

export function capasZodiaco(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.3' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
  // Todo lo que gira cada noche va en este grupo
  const cieloG = el('g', {}, svg);

  // 1. Estrellas reales de la franja (hasta 8° de la eclíptica)
  const estrellas = el('g', {}, cieloG);
  for (const s of cielo().estrellas) {
    const { lon, lat } = eclipticas(s.ra, s.dec);
    if (Math.abs(lat) > 8) continue;
    const p = pt(lon, R_EST + lat * 1.6);
    el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: Math.max(0.8, 3.4 - s.mag * 0.7).toFixed(2), fill: '#f3ecd8', opacity: Math.min(1, 1.1 - s.mag * 0.14).toFixed(2) }, estrellas);
  }
  // 2. Constelaciones de la UAI (fijas a las estrellas)
  const conG = el('g', {}, cieloG);
  const conSect = CONSTELACIONES.map(([nombre, desde], i) => {
    const span = norm(CONSTELACIONES[(i + 1) % 13][1] - desde);
    const p = el('path', { d: sector(desde, span, R_CON + 14, R_CON - 14), fill: i % 2 ? '#1d3054' : '#24395f', stroke: '#0b1326', 'stroke-width': 1.5 }, conG);
    const m = pt(desde + span / 2, R_CON);
    if (span > 10) {
      const t = el('text', { x: m.x, y: m.y + 4, 'text-anchor': 'middle', 'font-size': span > 25 ? 11.5 : 9, fill: '#ebe5d5', ...fuente }, conG);
      t.textContent = nombre;
    }
    return p;
  });
  // 3. Signos siderales (fijos a las estrellas: van en el mismo grupo)
  const sidG = el('g', {}, cieloG);
  SIGNOS.forEach((n, i) => {
    // En coordenadas de las estrellas (J2000), el Aries sideral de Lahiri empieza a 23,857° del punto vernal de 2000
    const l = norm(AYAN_2000 + i * 30);
    el('path', { d: sector(l, 30, R_SID + ANCHO / 2 - 2, R_SID - ANCHO / 2 + 2), fill: i % 2 ? '#2d2a44' : '#3b3758', stroke: '#0b1326', 'stroke-width': 1.5 }, sidG);
    const m = pt(l + 15, R_SID);
    const t = el('text', { x: m.x, y: m.y + 4, 'text-anchor': 'middle', 'font-size': 11, fill: '#e2d9ff', ...fuente }, sidG);
    t.textContent = n;
  });
  // 4. Signos tropicales (anclados al punto vernal: giran respecto a las estrellas)
  const troG = el('g', {}, cieloG);
  const troSect = SIGNOS.map((n, i) => {
    const p = el('path', { fill: i % 2 ? '#3a3320' : '#4a4128', stroke: '#0b1326', 'stroke-width': 1.5 }, troG);
    const t = el('text', { 'text-anchor': 'middle', 'font-size': 11, fill: '#f5dea0', ...fuente }, troG);
    t.textContent = n;
    return { p, t, i };
  });
  const vernal = el('g', {}, troG);
  const flecha = el('line', { stroke: '#f2cf72', 'stroke-width': 2.5 }, vernal);
  const punta = el('circle', { r: 5, fill: '#f2cf72' }, vernal);

  // Centro: leyenda fija (no gira)
  el('circle', { cx: C.x, cy: C.y, r: R_TRO - ANCHO / 2 - 6, fill: '#0f1930' }, svg);
  const leyenda = [
    ['#8fb0e0', 'Estrellas y constelaciones'], ['#c9b8ff', 'Signos siderales (Lahiri)'], ['#f2cf72', 'Signos tropicales'],
  ];
  leyenda.forEach(([c, t], i) => {
    el('rect', { x: C.x - 82, y: C.y - 36 + i * 24, width: 12, height: 12, rx: 2, fill: c }, svg);
    const e = el('text', { x: C.x - 64, y: C.y - 26 + i * 24, 'font-size': 11.5, fill: '#ebe5d5', ...fuente }, svg);
    e.textContent = t;
  });
  const tAnio = el('text', { x: C.x, y: C.y + 56, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 600, fill: '#f5dea0', ...fuente }, svg);

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Año</span><input type="range" min="${MIN}" max="${MAX}" step="10" value="2026" aria-label="Año">`;
  const entrada = rango.querySelector('input');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  let animSiglos = null, animNoche = null, giro = 0;
  const bSiglos = boton('Ver pasar los siglos', () => (animSiglos ? pararSiglos() : siglos()));
  const bNoche = boton('Girar como cada noche', () => (animNoche ? pararNoche() : noche()));
  const atajos = [[290, 'Cuando coincidían'], [2026, 'Hoy'], [2600, 'Año 2600']].map(([a, t]) => boton(t, () => { pararSiglos(); anio = a; entrada.value = a; fijar(a); }));
  fila.append(bSiglos, bNoche, ...atajos);
  barra.append(dato, rango, fila);

  let anio = 2026;
  function fijar(a) {
    // El punto vernal de la fecha, medido en las coordenadas de las estrellas (J2000)
    const v = norm(-(a - 2000) * RITMO);
    troSect.forEach(({ p, t, i }) => {
      p.setAttribute('d', sector(v + i * 30, 30, R_TRO + ANCHO / 2 - 2, R_TRO - ANCHO / 2 + 2));
      const m = pt(v + i * 30 + 15, R_TRO);
      t.setAttribute('x', m.x); t.setAttribute('y', m.y + 4);
    });
    const a1 = pt(v, R_TRO - ANCHO / 2), a2 = pt(v, R_EST + 16);
    flecha.setAttribute('x1', a1.x); flecha.setAttribute('y1', a1.y); flecha.setAttribute('x2', a2.x); flecha.setAttribute('y2', a2.y);
    punta.setAttribute('cx', a2.x); punta.setAttribute('cy', a2.y);
    const dentro = CONSTELACIONES.findIndex(([, d], i) => norm(v - d) < norm(CONSTELACIONES[(i + 1) % 13][1] - d));
    conSect.forEach((p, i) => p.setAttribute('fill', i === dentro ? '#3d5a8a' : i % 2 ? '#1d3054' : '#24395f'));
    const sep = norm(AYAN_2000 + (a - 2000) * RITMO + 180) - 180;
    tAnio.textContent = `Año ${textoAnio(Math.round(a))}`;
    const difTxt = Math.abs(sep) < 1 ? 'casi coinciden' : `están separados ${Math.abs(sep).toFixed(0)}°, ${(Math.abs(sep) / 30).toFixed(1).replace('.', ',')} signos`;
    dato.innerHTML = `<strong>Año ${textoAnio(Math.round(a))}.</strong> La flecha dorada es el <strong>punto vernal</strong>, donde está el Sol el día del equinoccio de marzo: ahí empieza siempre el Aries tropical. Está delante de las estrellas de <strong>${CONSTELACIONES[dentro][0]}</strong>. ` +
      `Los signos tropicales y los siderales ${difTxt}. Los anillos de fuera (estrellas, constelaciones y signos siderales) no se mueven entre sí; el de dentro sí se desliza, hacia el oeste, una vuelta cada unos 25.800 años.`;
    svg.setAttribute('aria-label', `Anillos del zodiaco. ${dato.textContent}`);
  }
  function siglos() {
    bSiglos.textContent = 'Detener';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      anio += dt * (sinMovimiento() ? 150 : 400);
      if (anio > MAX) anio = MIN;
      entrada.value = Math.round(anio); fijar(anio);
      animSiglos = requestAnimationFrame(paso);
    };
    animSiglos = requestAnimationFrame(paso);
  }
  function pararSiglos() { cancelAnimationFrame(animSiglos); animSiglos = null; bSiglos.textContent = 'Ver pasar los siglos'; }
  function noche() {
    bNoche.textContent = 'Parar el giro';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      giro = (giro + dt * (sinMovimiento() ? 10 : 30)) % 360;
      cieloG.setAttribute('transform', `rotate(${giro} ${C.x} ${C.y})`);
      animNoche = requestAnimationFrame(paso);
    };
    animNoche = requestAnimationFrame(paso);
    dato.innerHTML = '<strong>El giro de cada noche.</strong> Todo el cielo da una vuelta en 23 horas y 56 minutos: las estrellas, las constelaciones y los dos juegos de signos giran juntos, y ninguno se separa de otro. Según la astronomía moderna, es la Tierra la que gira; según el modelo plano, la bóveda; según Ptolomeo, la esfera de las estrellas. Lo que separa los signos tropicales de las estrellas es otro movimiento, mucho más lento: la precesión.';
  }
  function pararNoche() { cancelAnimationFrame(animNoche); animNoche = null; bNoche.textContent = 'Girar como cada noche'; giro = 0; cieloG.removeAttribute('transform'); fijar(anio); }
  entrada.addEventListener('input', () => { pararSiglos(); anio = +entrada.value; fijar(anio); });
  fijar(anio);
  return { destruir() { pararSiglos(); cancelAnimationFrame(animNoche); } };
}
