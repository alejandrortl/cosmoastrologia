// Interactivo: las fases de la Luna a lo largo de un mes lunar.
// Primero, lo que se observa (el aspecto de la Luna cada día). Opcionalmente,
// el esquema con el que lo explica el modelo moderno.

import { svgNS, boton, barraControles } from './comun.js';

const MES = 29.53;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

// Silueta de la parte iluminada vista desde el hemisferio norte.
export function caminoLuz(fase, r) {
  const a = (fase / MES) * 360;
  const rx = Math.abs(Math.cos((a * Math.PI) / 180)) * r;
  if (a < 0.5 || a > 359.5) return '';
  if (a < 180) {
    const barrido = a < 90 ? 0 : 1;
    return `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${barrido} 0 ${-r}Z`;
  }
  const barrido = a < 270 ? 0 : 1;
  return `M0 ${-r} A${r} ${r} 0 0 0 0 ${r} A${rx} ${r} 0 0 ${barrido} 0 ${-r}Z`;
}

function nombreFase(d) {
  if (d < 1 || d > MES - 1) return 'Luna nueva';
  if (d < 6.4) return 'Luna creciente';
  if (d < 8.4) return 'Cuarto creciente';
  if (d < 13.8) return 'Gibosa creciente';
  if (d < 15.8) return 'Luna llena';
  if (d < 21.1) return 'Gibosa menguante';
  if (d < 23.1) return 'Cuarto menguante';
  return 'Luna menguante';
}

export function fasesLuna(contenedor) {
  const W = 640, H = 300;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

  // Vista 1: la Luna tal como se ve
  const vista = el('g', { transform: `translate(${W / 2} ${H / 2 - 8})` }, svg);
  el('circle', { r: 100, fill: '#26365a' }, vista);
  const luz = el('path', { fill: '#efe6c8' }, vista);
  el('circle', { r: 100, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, vista);
  const nombre = el('text', { x: 0, y: 135, 'text-anchor': 'middle', 'font-size': 17, fill: '#ebe5d5', ...fuente }, vista);

  // Vista 2: el esquema del modelo moderno (Sol a la derecha, Tierra en el centro)
  const esquema = el('g', { transform: `translate(${W / 2} ${H / 2})`, style: 'display:none' }, svg);
  for (let i = 0; i < 6; i++) {
    el('path', { d: `M${W / 2 - 12} ${-90 + i * 36} h-46`, stroke: '#d4ae5a', 'stroke-opacity': 0.5, 'stroke-width': 2, 'marker-end': '' }, esquema);
  }
  const rotSol = el('text', { x: W / 2 - 16, y: -112, 'text-anchor': 'end', 'font-size': 13, fill: '#d4ae5a', ...fuente }, esquema);
  rotSol.textContent = 'Luz del Sol';
  el('circle', { r: 105, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.35, 'stroke-dasharray': '3 5' }, esquema);
  el('circle', { r: 22, fill: '#3e6fb0' }, esquema);
  el('path', { d: 'M0 -22 A22 22 0 0 1 0 22Z', fill: '#7fa8e0' }, esquema);
  const rotTierra = el('text', { x: 0, y: 42, 'text-anchor': 'middle', 'font-size': 13, fill: '#a9b2c4', ...fuente }, esquema);
  rotTierra.textContent = 'Tierra';
  const lunaOrb = el('g', {}, esquema);
  el('circle', { r: 14, fill: '#26365a' }, lunaOrb);
  el('path', { d: 'M0 -14 A14 14 0 0 1 0 14Z', fill: '#efe6c8' }, lunaOrb);
  const miniVista = el('g', { transform: `translate(${-W / 2 + 70} ${-H / 2 + 70})` }, esquema);
  el('circle', { r: 34, fill: '#26365a' }, miniVista);
  const miniLuz = el('path', { fill: '#efe6c8' }, miniVista);
  const rotMini = el('text', { x: 0, y: 54, 'text-anchor': 'middle', 'font-size': 12, fill: '#a9b2c4', ...fuente }, miniVista);
  rotMini.textContent = 'Vista desde la Tierra';

  // Controles
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Día</span><input type="range" min="0" max="${MES}" step="0.1" value="7.4" aria-label="Día del mes lunar">`;
  const entrada = rango.querySelector('input');
  let modoEsquema = false;
  const botonEsquema = boton('Ver cómo lo explica el modelo moderno', () => {
    modoEsquema = !modoEsquema;
    vista.style.display = modoEsquema ? 'none' : '';
    esquema.style.display = modoEsquema ? '' : 'none';
    botonEsquema.textContent = modoEsquema ? 'Volver a la Luna tal como se ve' : 'Ver cómo lo explica el modelo moderno';
    botonEsquema.setAttribute('aria-pressed', String(modoEsquema));
  }, { 'aria-pressed': 'false' });
  barra.append(dato, rango, botonEsquema);

  function fijar(d) {
    const camino = caminoLuz(d, 100);
    luz.setAttribute('d', camino);
    miniLuz.setAttribute('d', caminoLuz(d, 34));
    const a = (d / MES) * 2 * Math.PI;
    // En luna nueva la Luna está entre la Tierra y el Sol (a la derecha); avanza en sentido antihorario.
    lunaOrb.setAttribute('transform', `translate(${105 * Math.cos(a)} ${-105 * Math.sin(a)})`);
    const iluminado = Math.round(((1 - Math.cos(a)) / 2) * 100);
    nombre.textContent = nombreFase(d);
    dato.innerHTML = `Día <strong>${d.toFixed(1).replace('.', ',')}</strong> de ${String(MES).replace('.', ',')}: ` +
      `<strong>${nombreFase(d).toLowerCase()}</strong>, con un ${iluminado} % del disco iluminado.`;
    svg.setAttribute('aria-label', dato.textContent);
  }

  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(7.4);
  return { destruir() {} };
}
