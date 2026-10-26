// Interactivo: el ecuador celeste. Arriba, la cúpula del cielo vista desde fuera para la latitud
// elegida, con los círculos que trazan cada día las estrellas a distintas distancias del polo
// (observación). Abajo, cómo dibuja el ecuador celeste cada modelo: el globo y el plano de un
// solo centro. Esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento, bucle } from './comun.js';

const W = 640, H = 1080, ARRIBA = 460, ALTO_MODELO = 310;
const RAD = Math.PI / 180;
const DECLINACIONES = [60, 30, 0, -30, -60];
const LUGARES = [['Polo norte', 90], ['Madrid', 40], ['Ecuador', 0], ['Buenos Aires', -35], ['Polo sur', -90]];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 15, fill: '#a9b2c4', 'font-family': 'IBM Plex Sans, system-ui, sans-serif', ...attrs }, padre);
  e.textContent = t;
  return e;
}

// Punto de la cúpula para una estrella de declinación d y ángulo horario h, desde la latitud f.
// x: este, y: norte, z: cenit.
function local(d, h, f) {
  return {
    x: -Math.cos(d) * Math.sin(h),
    y: Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.cos(h) * Math.sin(f),
    z: Math.sin(d) * Math.sin(f) + Math.cos(d) * Math.cos(h) * Math.cos(f),
  };
}

// Vista desde fuera de la cúpula, desde el sur, algo girada y por encima del horizonte
const GIRO = -28 * RAD, ELEV = 22 * RAD, C = { x: W / 2, y: 236 }, R = 150;
function proyectar({ x, y, z }) {
  const xr = x * Math.cos(GIRO) - y * Math.sin(GIRO);
  const yr = x * Math.sin(GIRO) + y * Math.cos(GIRO);
  return { X: C.x + R * xr, Y: C.y - R * (yr * Math.sin(ELEV) + z * Math.cos(ELEV)), fondo: yr * Math.cos(ELEV) - z * Math.sin(ELEV) };
}

function horasVisibles(d, f) {
  const c = -Math.tan(f) * Math.tan(d);
  if (c <= -1) return 24;
  if (c >= 1) return 0;
  return (2 * Math.acos(c)) / RAD / 15;
}
const fmtHoras = (h) => (h >= 23.95 ? 'siempre' : h <= 0.05 ? 'nunca' : `${h.toFixed(1).replace('.', ',')} h`);

export function ecuadorCeleste(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);
  texto(svg, 16, 30, 'Lo que se observa: la cúpula del cielo', { fill: '#ebe5d5', 'font-size': 18, 'font-weight': 600 });
  const cupula = el('g', {}, svg);
  const moviles = el('g', {}, svg);
  el('line', { x1: 0, x2: W, y1: ARRIBA, y2: ARRIBA, stroke: '#8fb0e0', 'stroke-opacity': 0.3 }, svg);
  const globo = el('g', {}, svg);
  const plano = el('g', {}, svg);
  el('line', { x1: 0, x2: W, y1: ARRIBA + ALTO_MODELO, y2: ARRIBA + ALTO_MODELO, stroke: '#8fb0e0', 'stroke-opacity': 0.3 }, svg);

  let lat = 40, hora = 0;

  function trazo(padre, puntos, attrs) {
    // Une puntos consecutivos en tramos según estén por encima o por debajo del horizonte
    let tramo = [], arriba = null;
    const cerrar = () => {
      if (tramo.length > 1) {
        el('path', {
          d: 'M' + tramo.map((p) => `${p.X.toFixed(1)} ${p.Y.toFixed(1)}`).join('L'), fill: 'none',
          ...(arriba ? attrs.visible : attrs.oculto),
        }, padre);
      }
    };
    for (const p of puntos) {
      const a = p.z >= 0;
      if (arriba !== null && a !== arriba) { tramo.push(p); cerrar(); tramo = [p]; } else tramo.push(p);
      arriba = a;
    }
    cerrar();
  }

  function dibujarCupula() {
    cupula.innerHTML = '';
    const f = lat * RAD;
    // Horizonte
    const hor = [];
    for (let a = 0; a <= 360; a += 4) hor.push(proyectar({ x: Math.sin(a * RAD), y: Math.cos(a * RAD), z: 0 }));
    el('path', { d: 'M' + hor.map((p) => `${p.X} ${p.Y}`).join('L') + 'Z', fill: '#16264a', stroke: '#a9c4ea', 'stroke-opacity': 0.5 }, cupula);
    for (const [n, x, y] of [['N', 0, 1], ['S', 0, -1], ['E', 1, 0], ['O', -1, 0]]) {
      const p = proyectar({ x: x * 1.12, y: y * 1.12, z: 0 });
      texto(cupula, p.X, p.Y + 5, n, { 'text-anchor': 'middle', fill: '#ebe5d5', 'font-weight': 600 });
    }
    // Eje del mundo y polos
    const pn = local(90 * RAD, 0, f), ps = local(-90 * RAD, 0, f);
    const PN = proyectar(pn), PS = proyectar(ps);
    el('line', { x1: PS.X, y1: PS.Y, x2: PN.X, y2: PN.Y, stroke: '#ebe5d5', 'stroke-opacity': 0.35, 'stroke-dasharray': '4 5' }, cupula);
    for (const [P, z, nombre] of [[PN, pn.z, 'Polo norte celeste'], [PS, ps.z, 'Polo sur celeste']]) {
      el('circle', { cx: P.X, cy: P.Y, r: 4, fill: '#f5dea0', opacity: z >= -0.001 ? 1 : 0.35 }, cupula);
      texto(cupula, P.X + 9, P.Y - 8, nombre, { fill: '#f5dea0', 'font-size': 13, opacity: z >= -0.001 ? 1 : 0.5 });
    }
    // Círculos diarios
    for (const dg of DECLINACIONES) {
      const d = dg * RAD, pts = [];
      for (let h = 0; h <= 360; h += 3) pts.push({ ...proyectar(local(d, h * RAD, f)), z: local(d, h * RAD, f).z });
      const ecuador = dg === 0;
      trazo(cupula, pts, {
        visible: { stroke: ecuador ? '#f2cf72' : '#8fb0e0', 'stroke-width': ecuador ? 3 : 1.6, 'stroke-opacity': 0.95 },
        oculto: { stroke: ecuador ? '#f2cf72' : '#8fb0e0', 'stroke-width': 1, 'stroke-opacity': 0.3, 'stroke-dasharray': '3 5' },
      });
    }
    el('circle', { cx: C.x, cy: C.y, r: 4, fill: '#d4ae5a' }, cupula);
    texto(cupula, C.x + 8, C.y + 18, 'Tú', { fill: '#f3e6bf', 'font-size': 13 });
    texto(cupula, 16, 56, `Latitud ${Math.abs(lat)}° ${lat > 0 ? 'N' : lat < 0 ? 'S' : ''}`.trim(), { fill: '#a9b2c4' });
    texto(cupula, 16, ARRIBA - 52, '— ecuador celeste', { fill: '#f2cf72', 'font-size': 14 });
    texto(cupula, 16, ARRIBA - 32, '— círculos a 30° y a 60° del ecuador', { fill: '#8fb0e0', 'font-size': 14 });
    texto(cupula, 16, ARRIBA - 12, 'punteado: bajo el horizonte', { fill: '#8fb0e0', 'font-size': 14 });
  }

  function dibujarMoviles() {
    moviles.innerHTML = '';
    const f = lat * RAD;
    for (const dg of DECLINACIONES) {
      const p = local(dg * RAD, hora, f), P = proyectar(p);
      el('circle', { cx: P.X, cy: P.Y, r: dg === 0 ? 5 : 3.5, fill: dg === 0 ? '#f2cf72' : '#f3ecd8', opacity: p.z >= 0 ? 1 : 0.25 }, moviles);
    }
  }

  function dibujarGlobo() {
    globo.innerHTML = '';
    const y0 = ARRIBA;
    texto(globo, 16, y0 + 30, 'Modelo del globo', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
    const O = { x: W / 2, y: y0 + 165 }, r = 70;
    // ecuador celeste: prolongación del ecuador terrestre
    el('line', { x1: 40, x2: W - 40, y1: O.y,  y2: O.y, stroke: '#f2cf72', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, globo);
    el('line', { x1: O.x, x2: O.x, y1: y0 + 62, y2: y0 + 270, stroke: '#ebe5d5', 'stroke-opacity': 0.4, 'stroke-dasharray': '4 5' }, globo);
    el('circle', { cx: O.x, cy: O.y, r, fill: '#1d3a5f', stroke: '#6f9fe0' }, globo);
    el('line', { x1: O.x - r, x2: O.x + r, y1: O.y, y2: O.y, stroke: '#f2cf72', 'stroke-width': 2 }, globo);
    texto(globo, O.x, y0 + 56, 'Polo norte celeste', { 'text-anchor': 'middle', fill: '#f5dea0', 'font-size': 13 });
    texto(globo, O.x, y0 + 290, 'Polo sur celeste', { 'text-anchor': 'middle', fill: '#f5dea0', 'font-size': 13 });
    texto(globo, 40, O.y - 10, 'ecuador celeste', { fill: '#f2cf72', 'font-size': 13 });
    texto(globo, O.x - r - 8, O.y + 20, 'ecuador', { fill: '#f2cf72', 'font-size': 13, 'text-anchor': 'end' });
    // observador y su horizonte
    const f = lat * RAD;
    const P = { x: O.x + r * Math.cos(f), y: O.y - r * Math.sin(f) };
    const t = { x: -Math.sin(f), y: -Math.cos(f) }; // tangente
    el('line', { x1: P.x - 70 * t.x, y1: P.y - 70 * t.y, x2: P.x + 70 * t.x, y2: P.y + 70 * t.y, stroke: '#d4ae5a', 'stroke-opacity': 0.8 }, globo);
    el('circle', { cx: P.x, cy: P.y, r: 5, fill: '#d4ae5a' }, globo);
    texto(globo, P.x + 14, P.y + (lat >= 0 ? -6 : 22), 'Tú y tu horizonte', { fill: '#f3e6bf', 'font-size': 13 });
  }

  function dibujarPlano() {
    plano.innerHTML = '';
    const y0 = ARRIBA + ALTO_MODELO;
    texto(plano, 16, y0 + 30, 'Modelo plano de un solo centro', { fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
    const O = { x: W / 2, y: y0 + 215 }, RX = 200, RY = 46, ALT = 120;
    el('ellipse', { cx: O.x, cy: O.y, rx: RX + 6, ry: RY + 2, fill: '#d9e3f0', opacity: 0.22 }, plano);
    el('ellipse', { cx: O.x, cy: O.y, rx: RX, ry: RY, fill: '#1d3a5f' }, plano);
    el('ellipse', { cx: O.x, cy: O.y, rx: RX / 2, ry: RY / 2, fill: 'none', stroke: '#f2cf72', 'stroke-width': 2 }, plano);
    el('line', { x1: O.x, x2: O.x, y1: O.y, y2: O.y - ALT - 40, stroke: '#ebe5d5', 'stroke-opacity': 0.4, 'stroke-dasharray': '4 5' }, plano);
    el('ellipse', { cx: O.x, cy: O.y - ALT, rx: RX / 2, ry: RY / 2, fill: 'none', stroke: '#f2cf72', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, plano);
    texto(plano, O.x + 10, O.y - ALT - 32, 'centro de giro (polo norte)', { fill: '#f5dea0', 'font-size': 13 });
    texto(plano, O.x - RX / 2 - 8, O.y - ALT + 4, 'ecuador celeste', { fill: '#f2cf72', 'font-size': 13, 'text-anchor': 'end' });
    texto(plano, O.x - RX / 2 - 8, O.y + 4, 'ecuador', { fill: '#f2cf72', 'font-size': 13, 'text-anchor': 'end' });
    texto(plano, O.x, O.y - ALT + 46, 'por aquí pasa el Sol en los equinoccios', { fill: '#f2cf72', 'font-size': 12, 'text-anchor': 'middle' });
    texto(plano, O.x, O.y + RY + 26, 'Borde de hielo (Antártida)', { 'text-anchor': 'middle', 'font-size': 13 });
    // observador: a (90 − lat)/180 del radio, en la parte delantera del disco
    const rho = (90 - lat) / 180, th = 115 * RAD;
    const P = { x: O.x + RX * rho * Math.cos(th), y: O.y + RY * rho * Math.sin(th) };
    el('circle', { cx: P.x, cy: P.y, r: 5, fill: '#d4ae5a' }, plano);
    texto(plano, P.x - 8, P.y + 20, 'Tú', { fill: '#f3e6bf', 'font-size': 13, 'text-anchor': 'end' });
    plano.dataset.cx = O.x; plano.dataset.cy = O.y - ALT;
  }

  // Estrellas que recorren el ecuador celeste del modelo plano (vistas desde arriba, en sentido horario)
  const solesPlano = el('g', {}, svg);
  function dibujarSolesPlano() {
    solesPlano.innerHTML = '';
    const cx = +plano.dataset.cx, cy = +plano.dataset.cy;
    for (let i = 0; i < 6; i++) {
      const a = hora + (i * Math.PI) / 3;
      const delante = Math.sin(a) > 0;
      el('circle', { cx: cx + 100 * Math.cos(a), cy: cy + 23 * Math.sin(a), r: i ? 2.6 : 6, fill: i ? '#f3ecd8' : '#f2cf72', opacity: delante ? 1 : 0.5 }, solesPlano);
    }
  }

  // ---------- Controles ----------
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Latitud</span><input type="range" min="-90" max="90" step="1" value="40" aria-label="Latitud del observador">';
  const entrada = rango.querySelector('input');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.append(...LUGARES.map(([n, l]) => boton(n, () => { entrada.value = l; fijar(l); })));
  barra.append(dato, rango, fila);

  function fijar(l) {
    lat = l;
    dibujarCupula(); dibujarGlobo(); dibujarPlano(); dibujarMoviles(); dibujarSolesPlano();
    const f = lat * RAD;
    const altura = 90 - Math.abs(lat);
    const lado = lat > 0 ? 'hacia el sur' : lat < 0 ? 'hacia el norte' : 'en el cenit';
    const polo = lat >= 0 ? 'norte' : 'sur';
    const s = lat >= 0 ? 1 : -1;
    const h30 = fmtHoras(horasVisibles(s * 30 * RAD, f)), h30o = fmtHoras(horasVisibles(-s * 30 * RAD, f));
    dato.innerHTML = Math.abs(lat) === 90
      ? `<strong>En el polo ${polo}.</strong> El ecuador celeste coincide con el horizonte: las estrellas de un lado se ven siempre y las del otro, nunca. Todas giran en círculos paralelos al horizonte.`
      : `<strong>Ecuador celeste: 12 h sobre el horizonte.</strong> Sale justo por el este y se pone justo por el oeste, y su punto más alto está ${lado}${lat ? `, a ${altura}° de altura` : ''}. ` +
        `Una estrella a 30° del ecuador hacia el polo ${polo}: ${h30}${h30 === 'siempre' || h30 === 'nunca' ? ' sobre el horizonte' : ''}. Hacia el polo contrario: ${h30o}${h30o === 'siempre' || h30o === 'nunca' ? ' sobre el horizonte' : ''}.`;
    svg.setAttribute('aria-label', `Esquema de la cúpula del cielo y de los dos modelos para la latitud ${lat}. ${dato.textContent}`);
  }
  entrada.addEventListener('input', () => fijar(+entrada.value));

  const anim = bucle(svg, (dt) => { hora = (hora + dt * 0.35) % (2 * Math.PI); dibujarMoviles(); dibujarSolesPlano(); });
  if (sinMovimiento()) { hora = 0.6; anim.pausar(); }
  fijar(lat);
  return { destruir: anim.destruir };
}
