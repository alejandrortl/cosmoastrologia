// Interactivo: por qué el Sol pasa por delante de una constelación distinta cada mes, según tres
// modelos, con el mismo día del año. Heliocéntrico (Copérnico y la astronomía moderna), geocéntrico
// (Ptolomeo) y plano (la disposición de la wiki de la Flat Earth Society, con la bóveda girando
// sobre el polo norte, dibujada aquí quieta para que se vea cómo se retrasa el Sol respecto a ella).
// Posición del Sol: método de Paul Schlyter. Constelaciones: fronteras de la UAI a lo largo de la
// eclíptica. Esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';
import { sol, diaJ } from '../astro.js';

const W = 640, PANEL = 300, H = PANEL * 3;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const rad = (g) => (g * Math.PI) / 180;
const norm = (g) => ((g % 360) + 360) % 360;
const OBLICUIDAD = 23.44;
// Longitud eclíptica (J2000) donde el Sol entra en cada constelación
const CONSTELACIONES = [
  ['Aries', 28.7], ['Tauro', 53.4], ['Géminis', 90.4], ['Cáncer', 118.3], ['Leo', 138.2],
  ['Virgo', 174.0], ['Libra', 218.0], ['Escorpio', 241.1], ['Ofiuco', 247.7],
  ['Sagitario', 266.3], ['Capricornio', 299.7], ['Acuario', 327.9], ['Piscis', 351.6],
];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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
const enConstelacion = (lon) => {
  const l = norm(lon);
  let i = CONSTELACIONES.length - 1;
  CONSTELACIONES.forEach(([, desde], k) => { if (l >= desde) i = k; });
  return l < CONSTELACIONES[0][1] ? CONSTELACIONES.length - 1 : i;
};
const medio = (i) => { const a = CONSTELACIONES[i][1], b = CONSTELACIONES[(i + 1) % CONSTELACIONES.length][1]; return a + norm(b - a) / 2; };
// Ascensión recta y declinación de un punto de la eclíptica
function ecuatorial(lon) {
  const x = Math.cos(rad(lon)), y = Math.sin(rad(lon)) * Math.cos(rad(OBLICUIDAD)), z = Math.sin(rad(lon)) * Math.sin(rad(OBLICUIDAD));
  return { ra: norm((Math.atan2(y, x) * 180) / Math.PI), dec: (Math.asin(z) * 180) / Math.PI };
}
// Ángulo en pantalla: la longitud (o la ascensión recta) crece en sentido antihorario
const pt = (c, ang, r) => ({ x: c.x + r * Math.cos(-rad(ang)), y: c.y + r * Math.sin(-rad(ang)) });

function anillo(padre, C, R, angulo) {
  // Sectores de las constelaciones a lo largo de su ángulo (longitud o ascensión recta)
  const sectores = CONSTELACIONES.map((c, i) => {
    const a = angulo(c[1]), b = angulo(CONSTELACIONES[(i + 1) % CONSTELACIONES.length][1]);
    const span = norm(b - a);
    const p1 = pt(C, a, R), p2 = pt(C, a + span, R), p3 = pt(C, a + span, R - 14), p4 = pt(C, a, R - 14);
    const g = span > 180 ? 1 : 0;
    const d = `M${p1.x} ${p1.y}A${R} ${R} 0 ${g} 0 ${p2.x} ${p2.y}L${p3.x} ${p3.y}A${R - 14} ${R - 14} 0 ${g} 1 ${p4.x} ${p4.y}Z`;
    return el('path', { d, fill: i % 2 ? '#1d3054' : '#24395f', stroke: '#0f1930' }, padre);
  });
  const rotulos = CONSTELACIONES.map(([nombre], i) => {
    const p = pt(C, angulo(medio(i)), R + (nombre === 'Escorpio' ? 27 : 13)); // Escorpio y Ofiuco son estrechas
    return texto(padre, p.x, p.y + 4, nombre, { 'text-anchor': p.x < C.x - 20 ? 'end' : p.x > C.x + 20 ? 'start' : 'middle', 'font-size': 11 });
  });
  return (i) => {
    sectores.forEach((s, k) => s.setAttribute('fill', k === i ? '#d4ae5a' : k % 2 ? '#1d3054' : '#24395f'));
    rotulos.forEach((t, k) => { t.setAttribute('fill', k === i ? '#f5dea0' : '#a9b2c4'); t.setAttribute('font-weight', k === i ? 700 : 400); });
  };
}

export function solEntreEstrellas(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.3' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
  const R = 112, X = 175;
  const paneles = [];

  // Notas de la derecha de cada panel, en varias líneas
  // En el dibujo solo van el nombre del modelo y el resultado; la explicación va debajo, en texto
  function notas(padre, y0, titulo) {
    texto(padre, 360, y0 + 120, titulo, { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
    texto(padre, 360, y0 + 150, 'El Sol se ve delante de', { 'font-size': 14 });
    const res = texto(padre, 360, y0 + 176, '', { 'font-size': 17, fill: '#f5dea0', 'font-weight': 700 });
    return { res };
  }

  // ---- 1. Heliocéntrico ----
  {
    const y0 = 0, C = { x: X, y: y0 + PANEL / 2 }, g = el('g', {}, svg);
    const resaltar = anillo(g, C, R, (l) => l);
    el('circle', { cx: C.x, cy: C.y, r: 58, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.4, 'stroke-dasharray': '3 5' }, g);
    const rayo = el('line', { stroke: '#f2cf72', 'stroke-width': 2 }, g);
    const noche = el('line', { stroke: '#8fb0e0', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, g);
    el('circle', { cx: C.x, cy: C.y, r: 13, fill: '#f2cf72' }, g);
    const tierra = el('circle', { r: 7, fill: '#6f9fe0' }, g);
    const n = notas(g, y0, 'Heliocéntrico');
    paneles.push((lon, d) => {
      const E = pt(C, lon + 180, 58), fin = pt(C, lon, R - 14), atras = pt(E, lon + 180, R - 14 - 58);
      rayo.setAttribute('x1', E.x); rayo.setAttribute('y1', E.y); rayo.setAttribute('x2', fin.x); rayo.setAttribute('y2', fin.y);
      noche.setAttribute('x1', E.x); noche.setAttribute('y1', E.y); noche.setAttribute('x2', atras.x); noche.setAttribute('y2', atras.y);
      tierra.setAttribute('cx', E.x); tierra.setAttribute('cy', E.y);
      resaltar(enConstelacion(lon));
      n.res.textContent = CONSTELACIONES[enConstelacion(lon)][0];
    });
  }
  el('line', { x1: 20, x2: W - 20, y1: PANEL, y2: PANEL, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  // ---- 2. Geocéntrico ----
  {
    const y0 = PANEL, C = { x: X, y: y0 + PANEL / 2 }, g = el('g', {}, svg);
    const resaltar = anillo(g, C, R, (l) => l);
    el('circle', { cx: C.x, cy: C.y, r: 58, fill: 'none', stroke: '#d4ae5a', 'stroke-opacity': 0.45, 'stroke-dasharray': '3 5' }, g);
    const rayo = el('line', { stroke: '#f2cf72', 'stroke-width': 2 }, g);
    el('circle', { cx: C.x, cy: C.y, r: 9, fill: '#6f9fe0' }, g);
    const astro = el('circle', { r: 10, fill: '#f2cf72' }, g);
    const n = notas(g, y0, 'Geocéntrico (Ptolomeo)');
    paneles.push((lon) => {
      const S = pt(C, lon, 58), fin = pt(C, lon, R - 14);
      rayo.setAttribute('x1', C.x); rayo.setAttribute('y1', C.y); rayo.setAttribute('x2', fin.x); rayo.setAttribute('y2', fin.y);
      astro.setAttribute('cx', S.x); astro.setAttribute('cy', S.y);
      resaltar(enConstelacion(lon));
      n.res.textContent = CONSTELACIONES[enConstelacion(lon)][0];
    });
  }
  el('line', { x1: 20, x2: W - 20, y1: PANEL * 2, y2: PANEL * 2, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  // ---- 3. Plano ----
  {
    const y0 = PANEL * 2, C = { x: X, y: y0 + PANEL / 2 }, g = el('g', {}, svg);
    const angRA = (lon) => ecuatorial(lon).ra;
    const resaltar = anillo(g, C, R, angRA);
    const Rd = R - 18; // radio del plano
    const radio = (dec) => ((90 - dec) / 180) * Rd;
    el('circle', { cx: C.x, cy: C.y, r: Rd, fill: '#1d3a5f' }, g);
    for (const lat of [OBLICUIDAD, 0, -OBLICUIDAD]) el('circle', { cx: C.x, cy: C.y, r: radio(lat), fill: 'none', stroke: '#a9c4ea', 'stroke-opacity': 0.4, 'stroke-dasharray': lat ? '3 5' : '' }, g);
    // Camino del Sol sobre la bóveda: la eclíptica proyectada
    const camino = [];
    for (let l = 0; l <= 360; l += 5) { const q = ecuatorial(l); camino.push(pt(C, q.ra, radio(q.dec))); }
    el('polyline', { points: camino.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), fill: 'none', stroke: '#d4ae5a', 'stroke-opacity': 0.6, 'stroke-dasharray': '5 4' }, g);
    el('circle', { cx: C.x, cy: C.y, r: 2.5, fill: '#ebe5d5' }, g);
    const rayo = el('line', { stroke: '#f2cf72', 'stroke-width': 1.5, 'stroke-opacity': 0.8 }, g);
    const astro = el('circle', { r: 8, fill: '#f2cf72' }, g);
    const n = notas(g, y0, 'Plano');
    paneles.push((lon) => {
      const q = ecuatorial(lon), S = pt(C, q.ra, radio(q.dec)), fin = pt(C, q.ra, R - 14);
      rayo.setAttribute('x1', C.x); rayo.setAttribute('y1', C.y); rayo.setAttribute('x2', fin.x); rayo.setAttribute('y2', fin.y);
      astro.setAttribute('cx', S.x); astro.setAttribute('cy', S.y);
      resaltar(enConstelacion(lon));
      n.res.textContent = CONSTELACIONES[enConstelacion(lon)][0];
    });
  }

  // ---- Controles ----
  const anio = new Date().getUTCFullYear();
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Día del año</span><input type="range" min="0" max="364" step="1" aria-label="Día del año">';
  const entrada = rango.querySelector('input');
  let animando = null;
  const bAnimar = boton('Ver pasar el año', () => (animando ? parar() : animar()));
  const lista = document.createElement('ul');
  lista.className = 'lectura-dato';
  lista.innerHTML = '<li><strong>Heliocéntrico</strong>: el Sol está quieto en el centro y la Tierra gira a su alrededor en un año. Desde la Tierra, el Sol se proyecta sobre las estrellas de detrás. La línea azul señala lo que se ve de noche.</li>' +
    '<li><strong>Geocéntrico</strong>: la Tierra está quieta. Cada día todo el cielo gira hacia el oeste; el Sol, además, avanza casi 1° al día hacia el este sobre su esfera, por delante de la de las estrellas.</li>' +
    '<li><strong>Plano</strong>: la bóveda gira sobre el polo norte en 23 h 56 min y el Sol en 24 h, así que se queda casi 1° atrás cada día. Aquí la bóveda se dibuja quieta; el círculo del Sol va del trópico de Cáncer al de Capricornio.</li>';
  barra.append(dato, rango, bAnimar, lista);

  function fijar(dia) {
    const fecha = new Date(Date.UTC(anio, 0, 1 + Math.round(dia), 12));
    const d = diaJ(fecha);
    const lon = norm(sol(d).lon - 3.82394e-5 * d); // al equinoccio de 2000, como las fronteras
    paneles.forEach((f) => f(lon, d));
    const nombre = CONSTELACIONES[enConstelacion(lon)][0];
    const opuesta = CONSTELACIONES[enConstelacion(lon + 180)][0];
    dato.innerHTML = `<strong>${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]}</strong>. Los tres modelos coinciden en lo que se ve: el Sol está delante de las estrellas de <strong>${nombre}</strong>, que por eso no se ven, y a medianoche se ve en lo alto la constelación opuesta, ${opuesta}. Cambia la explicación: en el primero se mueve la Tierra; en los otros dos, el Sol.`;
    svg.setAttribute('aria-label', `Tres modelos del paso del Sol por las constelaciones. ${dato.textContent}`);
  }

  let dia = Math.floor((Date.now() - Date.UTC(anio, 0, 1)) / 86400000);
  entrada.value = dia;
  function parar() { cancelAnimationFrame(animando); animando = null; bAnimar.textContent = 'Ver pasar el año'; }
  function animar() {
    bAnimar.textContent = 'Detener';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      dia = (dia + dt * (sinMovimiento() ? 15 : 30)) % 365;
      entrada.value = Math.round(dia);
      fijar(dia);
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }
  entrada.addEventListener('input', () => { parar(); dia = +entrada.value; fijar(dia); });
  fijar(dia);
  return { destruir: parar };
}
