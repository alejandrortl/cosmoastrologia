// Interactivo: el zodiaco construido paso a paso, siguiendo el texto del apartado.
// 1, el camino del Sol es un círculo; 2, se corta en doce trozos de 30°; 3, el punto de partida
// (tropical: el punto vernal; sideral de Lahiri: Espiga al comienzo de Libra); 4, los nombres en el
// orden en que los recorre el Sol; 5, las divisiones quedan quietas y el Sol las atraviesa;
// 6, en qué signo está el Sol en cada fecha.
// La rueda se mira como en las cartas astrológicas: el punto vernal a la izquierda y los signos
// en sentido antihorario, que es el sentido en que avanza el Sol (hacia el este).
// Posición del Sol: método de Paul Schlyter. Ayanamsa de Lahiri: 23,857° en 2000 + 50,29″/año.

import { svgNS, boton, barraControles, sinMovimiento } from './comun.js';
import { sol, diaJ } from '../astro.js';

const W = 720, H = 600, C = { x: W / 2, y: 312 }, R = 220, RI = 150;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
const rad = (g) => (g * Math.PI) / 180;
const norm = (g) => ((g % 360) + 360) % 360;
const SIGNOS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
const ayanamsa = (anio) => 23.857 + (anio - 2000) * (50.29 / 3600);

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 14, fill: '#a9b2c4', 'text-anchor': 'middle', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}
// Longitud (tropical) a pantalla: 0° a la izquierda, creciendo en sentido antihorario
const pt = (lon, r) => ({ x: C.x - r * Math.cos(rad(lon)), y: C.y + r * Math.sin(rad(lon)) });
function sector(l1, span, rExt, rInt) {
  const a = pt(l1, rExt), b = pt(l1 + span, rExt), c = pt(l1 + span, rInt), d = pt(l1, rInt);
  return `M${a.x} ${a.y}A${rExt} ${rExt} 0 0 0 ${b.x} ${b.y}L${c.x} ${c.y}A${rInt} ${rInt} 0 0 1 ${d.x} ${d.y}Z`;
}

const PASOS = [
  'Paso 1. A lo largo de un año, el Sol da una vuelta completa al cielo respecto a las estrellas, siempre por el mismo camino y siempre hacia el este. Una vuelta son 360°.',
  'Paso 2. El círculo se corta en 12 trozos iguales de 30°: los signos. El Sol tarda más o menos un mes en recorrer cada uno, y en un año hay unas doce lunas.',
  'Paso 3. Hace falta un punto de partida. Tropical (astrología occidental): donde está el Sol el día del equinoccio de marzo, el punto vernal. Sideral (astrología védica, Lahiri): un punto fijo entre las estrellas, con Espiga al comienzo de Libra. Hoy los separan unos 24°.',
  'Paso 4. Desde el punto de partida, y en el sentido en que avanza el Sol, los trozos se llaman Aries, Tauro, Géminis… hasta Piscis, y vuelta a empezar. Es el orden de las constelaciones de las que tomaron el nombre.',
  'Paso 5. Las divisiones no se mueven: están ahí todo el año. Es el Sol el que las atraviesa, unos 30 días cada una. «Estar en Tauro» significa que el Sol está pasando por el trozo de Tauro.',
  'Paso 6. Elige una fecha y mira en qué signo está el Sol y cuándo entra en el siguiente.',
];

export function zodiacoPasoAPaso(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.3' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
  const capa = el('g', {}, svg);
  const solG = el('g', {}, svg);
  el('circle', { r: 16, fill: '#d4ae5a', opacity: 0.3 }, solG);
  el('circle', { r: 10, fill: '#f2cf72' }, solG);

  let paso = 0, sistema = 'tropical', lonSol = 0, anim = null, dia = 0;
  const anio = new Date().getUTCFullYear();
  const ay = ayanamsa(anio);
  const inicio = () => (sistema === 'tropical' ? 0 : ay);

  function dibujar() {
    capa.innerHTML = '';
    el('circle', { cx: C.x, cy: C.y, r: R, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.6, 'stroke-width': 2 }, capa);
    // Flecha del sentido del Sol
    const f1 = pt(200, R + 30), f2 = pt(240, R + 30);
    el('path', { d: `M${f1.x} ${f1.y}A${R + 30} ${R + 30} 0 0 0 ${f2.x} ${f2.y}`, fill: 'none', stroke: '#a9b2c4', 'stroke-width': 1.5, 'marker-end': 'url(#flecha-paso)' }, capa);
    const defs = el('defs', {}, capa);
    const m = el('marker', { id: 'flecha-paso', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#a9b2c4' }, m);
    texto(capa, C.x, 26, 'El Sol avanza en sentido antihorario (hacia el este)', { 'font-size': 13 });

    if (paso === 0) {
      texto(capa, C.x, C.y - 6, '360°', { 'font-size': 34, 'font-weight': 600, fill: '#ebe5d5' });
      texto(capa, C.x, C.y + 22, 'una vuelta al año', { 'font-size': 14 });
    }
    if (paso >= 1) {
      const base = paso >= 2 ? inicio() : 0;
      for (let i = 0; i < 12; i++) {
        const l = base + i * 30;
        const dentro = paso >= 4 && norm(lonSol - l) < 30;
        el('path', { d: sector(l, 30, R, RI), fill: dentro ? 'rgba(242,207,114,.45)' : i % 2 ? '#1d3054' : '#24395f', stroke: '#0b1326', 'stroke-width': 2 }, capa);
      }
      if (paso === 1) {
        const p = pt(base + 15, (R + RI) / 2);
        texto(capa, p.x, p.y + 5, '30°', { 'font-size': 15, fill: '#f5dea0', 'font-weight': 600 });
        texto(capa, C.x, C.y + 6, '12 trozos × 30°', { 'font-size': 18, fill: '#ebe5d5' });
      }
    }
    if (paso >= 2) {
      // Punto de partida: los dos, y el elegido resaltado
      const flecha = (l, color, rot, grosor) => {
        const a = pt(l, RI - 16), b = pt(l, R + 16);
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, 'stroke-width': grosor }, capa);
        const c = pt(l, R + 26);
        texto(capa, c.x, c.y, rot, { 'font-size': 12, fill: color, 'text-anchor': 'end' });
      };
      if (paso === 2 || sistema === 'tropical') flecha(0, '#f2cf72', 'punto vernal', sistema === 'tropical' ? 3 : 1.5);
      if (paso === 2 || sistema === 'sideral') flecha(ay, '#c9b8ff', 'inicio sideral', sistema === 'sideral' ? 3 : 1.5);
      // Espiga, al comienzo de la Libra sideral
      const e = pt(ay + 180, R - 8);
      el('circle', { cx: e.x, cy: e.y, r: 4, fill: '#d8e4ff' }, capa);
      texto(capa, e.x + 8, e.y + 4, 'Espiga', { 'font-size': 12, fill: '#d8e4ff', 'text-anchor': 'start' });
    }
    if (paso >= 3) {
      for (let i = 0; i < 12; i++) {
        const p = pt(inicio() + i * 30 + 15, (R + RI) / 2);
        texto(capa, p.x, p.y + 4, SIGNOS[i], { 'font-size': 12.5, fill: '#ebe5d5' });
        const q = pt(inicio() + i * 30 + 15, RI - 16);
        texto(capa, q.x, q.y + 4, String(i + 1), { 'font-size': 11, fill: '#a9b2c4' });
      }
    }
    if (paso === 2) {
      texto(capa, C.x, C.y - 8, '¿Dónde empieza', { 'font-size': 17, fill: '#ebe5d5' });
      texto(capa, C.x, C.y + 16, 'el primer trozo?', { 'font-size': 17, fill: '#ebe5d5' });
    }
    if (paso >= 4) {
      const n = Math.floor(norm(lonSol - inicio()) / 30);
      texto(capa, C.x, C.y - 10, 'El Sol está en', { 'font-size': 15 });
      texto(capa, C.x, C.y + 20, SIGNOS[n], { 'font-size': 26, 'font-weight': 700, fill: '#f5dea0' });
      texto(capa, C.x, C.y + 46, fechaTexto(), { 'font-size': 13 });
    }
    const s = pt(lonSol, R);
    solG.setAttribute('transform', `translate(${s.x} ${s.y})`);
    solG.style.display = paso === 1 || paso === 2 || paso === 3 ? 'none' : '';
    svg.setAttribute('aria-label', `Rueda del zodiaco, ${PASOS[paso]}`);
  }

  const fecha = () => new Date(Date.UTC(anio, 0, 1 + Math.round(dia), 12));
  const fechaTexto = () => fecha().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const lonDe = (f) => norm(sol(diaJ(f)).lon);

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const filaPasos = document.createElement('div');
  filaPasos.className = 'grupo-botones';
  const bAnt = boton('Paso anterior', () => ir(paso - 1));
  const bSig = boton('Paso siguiente', () => ir(paso < 5 ? paso + 1 : 0));
  filaPasos.append(bAnt, bSig);
  const filaSis = document.createElement('div');
  filaSis.className = 'grupo-botones';
  filaSis.setAttribute('role', 'group');
  filaSis.setAttribute('aria-label', 'Zodiaco');
  const bSis = [['tropical', 'Tropical'], ['sideral', 'Sideral (Lahiri)']].map(([id, t]) => {
    const b = boton(t, () => { sistema = id; bSis.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); actualizar(); }, { 'aria-pressed': String(id === 'tropical') });
    return b;
  });
  filaSis.append(...bSis);
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Fecha</span><input type="range" min="0" max="364" step="1" aria-label="Día del año">';
  const entrada = rango.querySelector('input');
  barra.append(dato, filaPasos, filaSis, rango);

  function proximaEntrada() {
    // Busca el día en que el Sol entra en el signo siguiente
    const n = Math.floor(norm(lonDe(fecha()) - inicio()) / 30);
    for (let k = 1; k < 40; k++) {
      const f = new Date(fecha().getTime() + k * 86400000);
      const m = Math.floor(norm(lonDe(f) - inicio()) / 30);
      if (m !== n) return [SIGNOS[m], f.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })];
    }
    return null;
  }

  function actualizar() {
    if (paso === 5) {
      lonSol = lonDe(fecha());
      const n = Math.floor(norm(lonSol - inicio()) / 30);
      const sig = proximaEntrada();
      dato.innerHTML = `<strong>${PASOS[5]}</strong> El <strong>${fechaTexto()}</strong>, el Sol está en <strong>${SIGNOS[n]}</strong> según el zodiaco ${sistema === 'tropical' ? 'tropical' : 'sideral de Lahiri'}${sig ? `, y entrará en <strong>${sig[0]}</strong> el ${sig[1]}` : ''}.`;
    } else {
      dato.innerHTML = `<strong>${PASOS[paso].split('.')[0]}.</strong>${PASOS[paso].slice(PASOS[paso].indexOf('.') + 1)}`;
    }
    dibujar();
  }

  function ir(p) {
    paso = Math.max(0, Math.min(5, p));
    bAnt.disabled = paso === 0;
    bSig.textContent = paso === 5 ? 'Empezar de nuevo' : 'Paso siguiente';
    filaSis.style.display = paso >= 2 ? '' : 'none';
    rango.style.display = paso === 5 ? '' : 'none';
    if (paso === 0 || paso === 4) animar(); else parar();
    if (paso === 5) { dia = Math.floor((Date.now() - Date.UTC(anio, 0, 1)) / 86400000); entrada.value = dia; }
    actualizar();
  }

  function animar() {
    if (anim) return;
    let ultimo = 0;
    const paso1 = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      dia = (dia + dt * (sinMovimiento() ? 12 : 30)) % 365;
      lonSol = lonDe(fecha());
      dibujar();
      anim = requestAnimationFrame(paso1);
    };
    anim = requestAnimationFrame(paso1);
  }
  function parar() { cancelAnimationFrame(anim); anim = null; }

  entrada.addEventListener('input', () => { dia = +entrada.value; actualizar(); });
  ir(0);
  return { destruir: parar };
}
