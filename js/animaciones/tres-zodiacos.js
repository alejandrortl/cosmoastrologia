// Interactivo: ¿en qué signo está el Sol? La misma fecha en tres sistemas, sobre una franja del
// camino del Sol centrada en él: los signos del zodiaco tropical (desde el equinoccio), los del
// zodiaco sideral de Lahiri (desde un punto fijo entre las estrellas) y las constelaciones con las
// fronteras de la UAI de 1930.
// Posición del Sol: método de Paul Schlyter. Ayanamsa de Lahiri: 23,857° en el año 2000 más
// 50,29″ por año (aproximación lineal). Fronteras de la UAI a lo largo de la eclíptica, aproximadas.

import { svgNS, boton, barraControles } from './comun.js';
import { sol, diaJ } from '../astro.js';

const W = 640, H = 330;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const norm = (g) => ((g % 360) + 360) % 360;
const RITMO = 50.29 / 3600;
const ayanamsa = (anio) => 23.857 + (anio - 2000) * RITMO;
const SIGNOS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
const CONSTELACIONES = [
  ['Aries', 28.7], ['Tauro', 53.4], ['Géminis', 90.4], ['Cáncer', 118.3], ['Leo', 138.2],
  ['Virgo', 174.0], ['Libra', 218.0], ['Escorpio', 241.1], ['Ofiuco', 247.7],
  ['Sagitario', 266.3], ['Capricornio', 299.7], ['Acuario', 327.9], ['Piscis', 351.6],
];
const MEDIA = 80;              // grados a cada lado del Sol
const ESC = (W - 40) / (2 * MEDIA);

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

export function tresZodiacos(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  const defs = el('defs', {}, svg);
  const recorte = el('clipPath', { id: 'franja-tres-zodiacos' }, defs);
  el('rect', { x: 20, y: 0, width: W - 40, height: H }, recorte);
  const capa = el('g', {}, svg);

  // tramos: [{nombre, desde, hasta}] en longitud tropical de la fecha
  function fila(y, alto, titulo, tramos, lonSol, colores) {
    texto(capa, 20, y - 8, titulo, { fill: '#ebe5d5', 'font-size': 14, 'font-weight': 600, stroke: '#0b1326', 'stroke-width': 5, 'paint-order': 'stroke' });
    const g = el('g', { 'clip-path': 'url(#franja-tres-zodiacos)' }, capa);
    let actual = '';
    for (const vuelta of [-360, 0, 360]) {
      tramos.forEach((t, i) => {
        const a = t.desde + vuelta - lonSol, b = a + norm(t.hasta - t.desde || 360);
        if (b < -MEDIA - 5 || a > MEDIA + 5) return;
        // El este (longitudes mayores) queda a la izquierda, como al mirar al cielo del sur desde el norte
        const x1 = W / 2 - b * ESC, x2 = W / 2 - a * ESC;
        const dentro = a <= 0 && b > 0;
        if (dentro) actual = t.nombre;
        el('rect', { x: x1, y, width: x2 - x1, height: alto, fill: dentro ? colores[2] : colores[i % 2], stroke: '#0b1326', 'stroke-width': 2 }, g);
        const v1 = Math.max(x1, 20), v2 = Math.min(x2, W - 20);
        const tam = v2 - v1 > t.nombre.length * 7.6 + 8 ? 13 : 10.5;
        if (v2 - v1 > t.nombre.length * tam * 0.6 + 6) texto(g, (v1 + v2) / 2, y + alto / 2 + 5, t.nombre, { 'text-anchor': 'middle', 'font-size': tam, fill: dentro ? '#0b1326' : '#ebe5d5', 'font-weight': dentro ? 700 : 400 });
      });
    }
    return actual;
  }

  function dibujar(fecha) {
    capa.innerHTML = '';
    el('rect', { width: W, height: H, fill: '#0b1326' }, capa);
    const d = diaJ(fecha), anio = fecha.getUTCFullYear() + fecha.getUTCMonth() / 12;
    const lon = norm(sol(d).lon); // tropical, equinoccio de la fecha
    const ay = ayanamsa(anio);
    const prec = (anio - 2000) * RITMO; // de J2000 a la fecha
    const tropical = SIGNOS.map((n, i) => ({ nombre: n, desde: i * 30, hasta: i * 30 + 30 }));
    const sideral = SIGNOS.map((n, i) => ({ nombre: n, desde: i * 30 + ay, hasta: i * 30 + 30 + ay }));
    const iau = CONSTELACIONES.map(([n, desde], i) => ({ nombre: n, desde: desde + prec, hasta: CONSTELACIONES[(i + 1) % 13][1] + prec }));
    el('line', { x1: W / 2, x2: W / 2, y1: 30, y2: 290, stroke: '#f2cf72', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, capa);
    const t = fila(50, 46, 'Signos del zodiaco tropical (astrología occidental)', tropical, lon, ['#3a3320', '#4a4128', '#f2cf72']);
    const s = fila(140, 46, 'Signos del zodiaco sideral de Lahiri (astrología védica)', sideral, lon, ['#2d2a44', '#3b3758', '#c9b8ff']);
    const c = fila(230, 46, 'Constelaciones con las fronteras de la UAI (astronomía)', iau, lon, ['#1d3054', '#24395f', '#8fb0e0']);
    // Sol: la línea atraviesa las tres franjas
    for (const y of [50, 140, 230]) el('line', { x1: W / 2, x2: W / 2, y1: y, y2: y + 46, stroke: '#0b1326', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, capa);
    el('circle', { cx: W / 2, cy: 306, r: 9, fill: '#f2cf72' }, capa);
    texto(capa, W / 2 + 16, 311, 'Sol', { 'font-size': 13, fill: '#f5dea0' });
    texto(capa, 24, 316, '← este', { 'font-size': 12 });
    texto(capa, W - 24, 316, 'oeste →', { 'font-size': 12, 'text-anchor': 'end' });
    const f = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    dato.innerHTML = `El <strong>${f}</strong>, el Sol está en el signo de <strong>${t}</strong> según el zodiaco tropical, en el de <strong>${s}</strong> según el sideral de Lahiri, y delante de las estrellas de <strong>${c}</strong> según las fronteras de la UAI. ` +
      `Separación entre los dos zodiacos: ${ay.toFixed(1).replace('.', ',')}°.`;
    svg.setAttribute('aria-label', `Tres zodiacos. ${dato.textContent}`);
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const etiqueta = document.createElement('label');
  etiqueta.className = 'control-rango';
  etiqueta.innerHTML = '<span>Fecha</span><input type="date" min="1900-01-01" max="2100-12-31" aria-label="Fecha">';
  const entrada = etiqueta.querySelector('input');
  const iso = (f) => f.toISOString().slice(0, 10);
  const hoy = () => { const a = new Date(); return new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), 12)); };
  const ir = (f) => { entrada.value = iso(f); dibujar(f); };
  const desplazar = (dias) => { const f = new Date(`${entrada.value}T12:00:00Z`); f.setUTCDate(f.getUTCDate() + dias); ir(f); };
  barra.append(dato, etiqueta, boton('Hoy', () => ir(hoy())), boton('− 1 semana', () => desplazar(-7)), boton('+ 1 semana', () => desplazar(7)));
  entrada.addEventListener('change', () => { if (entrada.value) dibujar(new Date(`${entrada.value}T12:00:00Z`)); });
  ir(hoy());
  return { destruir() {} };
}
