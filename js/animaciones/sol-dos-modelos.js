// Interactivo: el recorrido del Sol a lo largo del año en dos modelos, lado a lado.
// Arriba, el modelo moderno (la Tierra inclinada gira alrededor del Sol).
// Abajo, el modelo plano (el Sol gira sobre un mapa centrado en el polo norte y su
// círculo se estrecha y se ensancha entre los trópicos). Ambos son esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const INCLINACION = 23.44;
const W = 640, H = 770;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 17, fill: '#a9b2c4', ...attrs }, padre);
  e.textContent = t;
  return e;
}

function estacionNorte(m) { // m: 0..12 (fracción de año desde el 1 de enero)
  const i = Math.floor(m) % 12;
  if (i === 11 || i <= 1) return ['invierno', 'verano'];
  if (i <= 4) return ['primavera', 'otoño'];
  if (i <= 7) return ['verano', 'invierno'];
  return ['otoño', 'primavera'];
}

export function solDosModelos(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);

  // ---------- Modelo moderno ----------
  const arriba = el('g', {}, svg);
  texto(arriba, 20, 34, 'Modelo moderno', { fill: '#ebe5d5', 'font-size': 20, 'font-weight': 600 });
  const S = { x: W / 2, y: 175 }, RX = 230, RY = 78;
  el('ellipse', { cx: S.x, cy: S.y, rx: RX, ry: RY, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.4, 'stroke-dasharray': '4 6' }, arriba);
  el('circle', { cx: S.x, cy: S.y, r: 30, fill: '#d4ae5a', opacity: 0.25 }, arriba);
  el('circle', { cx: S.x, cy: S.y, r: 20, fill: '#f2cf72' }, arriba);
  texto(arriba, S.x, S.y + 48, 'Sol', { 'text-anchor': 'middle' });
  const tierra = el('g', {}, arriba);
  el('circle', { r: 22, fill: '#1c2c4c' }, tierra);
  const luzTierra = el('path', { d: 'M0 -22 A22 22 0 0 1 0 22 Z', fill: '#6f9fe0' }, tierra);
  const eje = el('g', { transform: `rotate(${INCLINACION})` }, tierra);
  el('line', { x1: 0, y1: -34, x2: 0, y2: 34, stroke: '#ebe5d5', 'stroke-width': 2 }, eje);
  texto(eje, 0, -40, 'N', { 'text-anchor': 'middle', fill: '#ebe5d5', 'font-size': 14 });
  const notaModerna = texto(arriba, 20, 300, '', { fill: '#ebe5d5' });

  // ---------- Modelo plano ----------
  const abajo = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 330, y2: 330, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, abajo);
  texto(abajo, 20, 368, 'Modelo plano', { fill: '#ebe5d5', 'font-size': 20, 'font-weight': 600 });
  const C = { x: W / 2, y: 520 }, R = 160;
  const radio = (lat) => ((90 - lat) / 180) * R; // proyección centrada en el polo norte
  el('circle', { cx: C.x, cy: C.y, r: R + 10, fill: '#d9e3f0', opacity: 0.25 }, abajo);
  el('circle', { cx: C.x, cy: C.y, r: R, fill: '#1d3a5f' }, abajo);
  const sombra = el('g', {}, abajo);
  const foco = el('circle', { r: R * 0.55, fill: 'url(#foco-sol)' }, sombra);
  const defs = el('defs', {}, svg);
  const grad = el('radialGradient', { id: 'foco-sol' }, defs);
  el('stop', { offset: 0, 'stop-color': '#f2cf72', 'stop-opacity': 0.55 }, grad);
  el('stop', { offset: 1, 'stop-color': '#f2cf72', 'stop-opacity': 0 }, grad);
  // Rótulos a la izquierda (trópicos de Cáncer y Capricornio, y ecuador), con una línea hasta su círculo
  for (const [lat, nombre, dy] of [[INCLINACION, 'Cáncer', -42], [0, 'Ecuador', 0], [-INCLINACION, 'Capricornio', 42]]) {
    const r = radio(lat);
    el('circle', { cx: C.x, cy: C.y, r, fill: 'none', stroke: '#a9c4ea', 'stroke-opacity': 0.5, 'stroke-dasharray': lat ? '3 5' : '' }, abajo);
    const xc = C.x - Math.sqrt(r * r - dy * dy);
    el('line', { x1: C.x - 182, y1: C.y + dy, x2: xc, y2: C.y + dy, stroke: '#a9c4ea', 'stroke-opacity': 0.45 }, abajo);
    el('circle', { cx: xc, cy: C.y + dy, r: 2.5, fill: '#a9c4ea' }, abajo);
    texto(abajo, C.x - 188, C.y + dy + 5, nombre, { 'font-size': 13, 'text-anchor': 'end' });
  }
  el('circle', { cx: C.x, cy: C.y, r: 3, fill: '#ebe5d5' }, abajo);
  texto(abajo, C.x, C.y + 20, 'Polo norte', { 'text-anchor': 'middle', 'font-size': 13, fill: '#ebe5d5' });
  texto(abajo, C.x, C.y + R + 30, 'Borde de hielo (Antártida)', { 'text-anchor': 'middle', 'font-size': 13 });
  const solPlano = el('g', {}, abajo);
  el('circle', { r: 11, fill: '#f2cf72' }, solPlano);
  const circuloSol = el('circle', { cx: C.x, cy: C.y, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2, 'stroke-opacity': 0.7 }, abajo);
  const notaPlana = texto(abajo, 20, H - 12, '', { fill: '#ebe5d5' });

  // ---------- Controles ----------
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Mes</span><input type="range" min="0" max="11.9" step="0.1" value="5.6" aria-label="Momento del año">';
  const entrada = rango.querySelector('input');
  let animando = null;
  const bAnimar = boton('Ver pasar el año', () => (animando ? parar() : animar()));
  barra.append(dato, rango, bAnimar);

  let hora = 0; // ángulo del giro diario del Sol en el modelo plano
  function fijar(m) {
    const ang = Math.PI + ((m - 5.6) / 12) * 2 * Math.PI; // junio a la izquierda del Sol
    const E = { x: S.x + RX * Math.cos(ang), y: S.y + RY * Math.sin(ang) };
    const haciaSol = (Math.atan2(S.y - E.y, S.x - E.x) * 180) / Math.PI;
    tierra.setAttribute('transform', `translate(${E.x} ${E.y})`);
    luzTierra.setAttribute('transform', `rotate(${haciaSol})`);

    const latSol = INCLINACION * Math.cos(((m - 5.6) / 12) * 2 * Math.PI);
    const r = radio(latSol);
    circuloSol.setAttribute('r', r);
    const P = { x: C.x + r * Math.cos(hora), y: C.y + r * Math.sin(hora) };
    solPlano.setAttribute('transform', `translate(${P.x} ${P.y})`);
    foco.setAttribute('cx', P.x); foco.setAttribute('cy', P.y);

    const mes = MESES[Math.floor(m) % 12];
    const [norte, sur] = estacionNorte(m);
    notaModerna.textContent = `En ${mes}: ${norte} en el norte, ${sur} en el sur`;
    const donde = latSol > 15 ? 'su círculo interior, cerca del trópico de Cáncer'
      : latSol < -15 ? 'su círculo exterior, cerca del trópico de Capricornio'
        : 'un círculo intermedio, cerca del ecuador';
    notaPlana.textContent = `En ${mes}: el Sol recorre ${latSol > 15 ? 'su círculo interior' : latSol < -15 ? 'su círculo exterior' : 'un círculo intermedio'}`;
    dato.innerHTML = `<strong>${mes[0].toUpperCase() + mes.slice(1)}</strong>. Según el modelo moderno, es ${norte} en el hemisferio norte porque ` +
      `${norte === 'verano' ? 'este se inclina hacia el Sol' : norte === 'invierno' ? 'este se inclina en sentido contrario al Sol' : 'ningún hemisferio se inclina hacia el Sol'}. ` +
      `Según el modelo plano, el Sol recorre ${donde}, y su luz alcanza más o menos zonas del plano.`;
    svg.setAttribute('aria-label', `Esquema de dos modelos. ${dato.textContent}`);
  }

  let mes = 5.6;
  function parar() { cancelAnimationFrame(animando); animando = null; bAnimar.textContent = 'Ver pasar el año'; }
  function animar() {
    bAnimar.textContent = 'Detener';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      mes = (mes + dt * (sinMovimiento() ? 0.6 : 0.9)) % 12;
      hora += dt * (sinMovimiento() ? 1.5 : 5);
      entrada.value = mes.toFixed(1);
      fijar(mes);
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }

  entrada.addEventListener('input', () => { parar(); mes = +entrada.value; fijar(mes); });
  fijar(mes);
  return { destruir: parar };
}
