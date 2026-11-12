// Animación: la precesión de los equinoccios explicada por dos modelos, con el mismo año.
// Arriba, la astronomía moderna: el eje de la Tierra describe un cono en unos 25.800 años y cambia
// la estrella a la que apunta. Abajo, Ptolomeo: la esfera de las estrellas fijas se desliza muy
// despacio hacia el este respecto al equinoccio, que se dibuja fijo arriba.
// Ritmo: 50,29″ por año. Fronteras de las constelaciones de la UAI a lo largo de la eclíptica,
// aproximadas. Esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';

const W = 640, H = 640;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const RITMO = 50.29 / 3600, CICLO = 360 / RITMO;
const norm = (g) => ((g % 360) + 360) % 360;
const rad = (g) => (g * Math.PI) / 180;
const MIN = -3000, MAX = 14000;
const CONSTELACIONES = [
  ['Aries', 28.7], ['Tauro', 53.4], ['Géminis', 90.4], ['Cáncer', 118.3], ['Leo', 138.2],
  ['Virgo', 174.0], ['Libra', 218.0], ['Escorpio', 241.1], ['Ofiuco', 247.7],
  ['Sagitario', 266.3], ['Capricornio', 299.7], ['Acuario', 327.9], ['Piscis', 351.6],
];
// Estrella que señala el polo norte celeste, aproximadamente, según la época
const POLARES = [
  [-3800, -1700, 'Thuban, en el Dragón'], [1500, 3200, 'Polaris, en la Osa Menor'], [3500, 4800, 'Errai, en Cefeo'],
  [6500, 8300, 'Alderamin, en Cefeo'], [9300, 10800, 'un punto a unos 7° de Deneb, en el Cisne'], [12500, 15000, 'un punto a unos 5° de Vega, en la Lira'],
];
const MARCAS = [[-2830, 'Thuban'], [2100, 'Polaris'], [13700, 'Vega']];
const textoAnio = (a) => (a < 0 ? `${-a} a. C.` : `${a}`);

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

export function precesionModelos(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.3' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);

  // ---- Arriba: el eje de la Tierra ----
  texto(svg, 20, 30, 'Astronomía moderna: el eje de la Tierra bambolea', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
  const T = { x: 190, y: 205 }, L = 130, INC = 23.44, ACH = 0.32;
  const radioCono = L * Math.sin(rad(INC)), altoCono = L * Math.cos(rad(INC));
  const fase = (anio) => rad(-90 - ((anio - 2100) / CICLO) * 360); // Polaris de frente, hacia el observador
  const punta = (anio) => { const f = fase(anio); return { x: T.x + radioCono * Math.cos(f), y: T.y - altoCono - radioCono * ACH * Math.sin(f), delante: Math.sin(f) < 0 }; };
  el('ellipse', { cx: T.x, cy: T.y - altoCono, rx: radioCono, ry: radioCono * ACH, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.5, 'stroke-dasharray': '4 4' }, svg);
  el('line', { x1: T.x, y1: T.y + 70, x2: T.x, y2: T.y - altoCono - 36, stroke: '#a9b2c4', 'stroke-opacity': 0.4, 'stroke-dasharray': '2 4' }, svg);
  texto(svg, T.x + 6, T.y - altoCono - 40, 'polo de la eclíptica', { 'font-size': 11 });
  for (const [a, n] of MARCAS) {
    const p = punta(a);
    el('circle', { cx: p.x, cy: p.y, r: 3, fill: '#f5dea0' }, svg);
    texto(svg, p.x + (p.x >= T.x ? 8 : -8), p.y + (n === 'Polaris' ? 16 : -6), n, { 'font-size': 12, fill: '#f5dea0', 'text-anchor': p.x >= T.x ? 'start' : 'end' });
  }
  el('ellipse', { cx: T.x, cy: T.y, rx: 120, ry: 22, fill: 'none', stroke: '#d4ae5a', 'stroke-opacity': 0.35 }, svg);
  texto(svg, T.x + 70, T.y + 38, 'plano de la órbita', { 'font-size': 11 });
  el('circle', { cx: T.x, cy: T.y, r: 46, fill: '#1c2c4c', stroke: '#6f9fe0', 'stroke-width': 2 }, svg);
  const eje = el('line', { stroke: '#ebe5d5', 'stroke-width': 2.5 }, svg);
  const tip = el('circle', { r: 5, fill: '#ebe5d5' }, svg);
  const resArriba = texto(svg, 380, 170, '', { 'font-size': 14, fill: '#f5dea0', 'font-weight': 600 });
  const resArriba2 = texto(svg, 380, 196, '', { 'font-size': 14, fill: '#f5dea0', 'font-weight': 600 });
  el('line', { x1: 20, x2: W - 20, y1: 320, y2: 320, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  // ---- Abajo: la esfera de las estrellas de Ptolomeo ----
  texto(svg, 20, 350, 'Ptolomeo: la esfera de las estrellas se desliza', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
  const C = { x: 170, y: 505 }, R = 100;
  const esfera = el('g', {}, svg);
  el('circle', { cx: C.x, cy: C.y, r: 9, fill: '#6f9fe0' }, svg);
  texto(svg, C.x, C.y + 24, 'Tierra', { 'text-anchor': 'middle', 'font-size': 11 });
  el('line', { x1: C.x, y1: C.y - 14, x2: C.x, y2: C.y - R - 22, stroke: '#f2cf72', 'stroke-width': 2 }, svg);
  el('path', { d: `M${C.x - 7} ${C.y - R - 30} L${C.x + 7} ${C.y - R - 30} L${C.x} ${C.y - R - 19} Z`, fill: '#f2cf72' }, svg);
  texto(svg, C.x + 12, C.y - R - 22, 'punto vernal (fijo)', { 'font-size': 12, fill: '#f5dea0' });
  const resAbajo = texto(svg, 380, 510, '', { 'font-size': 14, fill: '#f5dea0', 'font-weight': 600 });

  const pt = (ang, r) => ({ x: C.x + r * Math.cos(-rad(ang)), y: C.y + r * Math.sin(-rad(ang)) });
  function dibujarEsfera(desplaz) {
    esfera.innerHTML = '';
    // Ángulo en pantalla: 90° (arriba) es el punto vernal; la longitud respecto a él crece en sentido antihorario
    let actual = 0;
    CONSTELACIONES.forEach(([nombre, desde], i) => {
      const hasta = CONSTELACIONES[(i + 1) % 13][1];
      const a = 90 + norm(desde + desplaz), span = norm(hasta - desde);
      const dentro = norm(-(desde + desplaz)) < span;
      if (dentro) actual = i;
      const p1 = pt(a, R), p2 = pt(a + span, R), p3 = pt(a + span, R - 16), p4 = pt(a, R - 16), g = span > 180 ? 1 : 0;
      el('path', { d: `M${p1.x} ${p1.y}A${R} ${R} 0 ${g} 0 ${p2.x} ${p2.y}L${p3.x} ${p3.y}A${R - 16} ${R - 16} 0 ${g} 1 ${p4.x} ${p4.y}Z`, fill: dentro ? '#d4ae5a' : i % 2 ? '#1d3054' : '#24395f', stroke: '#0f1930' }, esfera);
      const m = pt(a + span / 2, R + 14);
      texto(esfera, m.x, m.y + 4, nombre, { 'font-size': 11, 'text-anchor': m.x < C.x - 15 ? 'end' : m.x > C.x + 15 ? 'start' : 'middle', fill: dentro ? '#f5dea0' : '#a9b2c4', 'font-weight': dentro ? 700 : 400 });
    });
    return CONSTELACIONES[actual][0];
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Año</span><input type="range" min="${MIN}" max="${MAX}" step="10" value="2026" aria-label="Año">`;
  const entrada = rango.querySelector('input');
  let animando = null;
  const bAnimar = boton('Ver pasar los siglos', () => (animando ? parar() : animar()));
  const atajos = [[-2800, 'Pirámides'], [-130, 'Hiparco'], [2026, 'Hoy'], [2600, 'Año 2600']].map(([a, t]) => boton(t, () => { parar(); anio = a; entrada.value = a; fijar(a); }));
  const lista = document.createElement('ul');
  lista.className = 'lectura-dato';
  lista.innerHTML = '<li><strong>Astronomía moderna</strong>: la Tierra, algo más ancha por el ecuador, gira inclinada 23,4°. La gravedad del Sol y de la Luna sobre ese abultamiento hace que su eje describa un cono en unos 25.800 años, como una peonza.</li>' +
    '<li><strong>Ptolomeo</strong>: la Tierra está quieta. La esfera de las estrellas fijas, además de su giro diario, avanza muy despacio hacia el este respecto al equinoccio. Ptolomeo calculó un grado por siglo; hoy se mide un grado cada 72 años.</li>';
  barra.append(dato, rango, bAnimar, ...atajos, lista);

  function fijar(a) {
    const p = punta(a);
    eje.setAttribute('x1', T.x - 0.75 * (p.x - T.x)); eje.setAttribute('y1', T.y - 0.75 * (p.y - T.y));
    eje.setAttribute('x2', p.x); eje.setAttribute('y2', p.y);
    tip.setAttribute('cx', p.x); tip.setAttribute('cy', p.y);
    const polar = POLARES.find(([d, h]) => a >= d && a <= h);
    resArriba.textContent = `Año ${textoAnio(Math.round(a))}: el eje apunta a`;
    resArriba2.textContent = polar ? polar[2].split(',')[0] : 'una zona sin estrella brillante';
    const con = dibujarEsfera((a - 2000) * RITMO);
    resAbajo.textContent = `Punto vernal: ${con}`;
    dato.innerHTML = `Año <strong>${textoAnio(Math.round(a))}</strong>. El polo norte celeste está cerca de <strong>${polar ? polar[2] : 'ninguna estrella brillante'}</strong>, y el Sol del equinoccio de marzo está delante de <strong>${con}</strong>. ` +
      'Los dos modelos describen la misma observación: el primero mueve el eje de la Tierra; el segundo, la esfera de las estrellas.';
    svg.setAttribute('aria-label', `Precesión en dos modelos. ${dato.textContent}`);
  }

  let anio = 2026;
  function parar() { cancelAnimationFrame(animando); animando = null; bAnimar.textContent = 'Ver pasar los siglos'; }
  function animar() {
    bAnimar.textContent = 'Detener';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      anio += dt * (sinMovimiento() ? 400 : 900);
      if (anio > MAX) anio = MIN;
      entrada.value = Math.round(anio);
      fijar(anio);
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }
  entrada.addEventListener('input', () => { parar(); anio = +entrada.value; fijar(anio); });
  fijar(anio);
  return { destruir: parar };
}
