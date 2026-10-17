// Interactivo: hacia dónde apuntar la cámara para fotografiar el giro del cielo desde
// cualquier latitud, y cómo dibuja esa misma situación cada modelo del mundo.
// Arriba: lo que ve el observador (observación). Abajo: el globo y el plano, a la par.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 770;
const rad = (g) => (g * Math.PI) / 180;
const LUGARES = [['Polo Norte', 90], ['Oslo', 60], ['Madrid', 40], ['Quito', 0], ['Buenos Aires', -35], ['Polo Sur', -90]];

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-size': 14, fill: '#a9b2c4', 'text-anchor': 'middle', ...fuente, ...attrs }, padre);
  e.textContent = t;
  return e;
}
const arcoAngulo = (cx, cy, r, a0, a1) => {
  // ángulos en grados, sentido matemático (0 = derecha, positivo hacia arriba)
  const p = (a) => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const grande = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r} ${r} 0 ${grande} ${a1 > a0 ? 0 : 1} ${x1} ${y1}`;
};

export function dondeApuntar(contenedor) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img', 'data-crecimiento-max': '1.35' });
  contenedor.append(svg);
  el('rect', { width: W, height: H, fill: '#0f1930' }, svg);
  const cielo = el('g', {}, svg);
  const globo = el('g', {}, svg);
  const plano = el('g', {}, svg);
  el('line', { x1: 0, x2: W, y1: 330, y2: 330, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);
  el('line', { x1: W / 2, x2: W / 2, y1: 340, y2: H - 10, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, svg);

  function dibujarCielo(lat) {
    cielo.innerHTML = '';
    const sur = lat < 0, alt = Math.abs(lat);
    const OX = 120, OY = 270, R = 200;
    texto(cielo, 20, 30, 'Tu cielo', { 'text-anchor': 'start', fill: '#ebe5d5', 'font-size': 17, 'font-weight': 600 });
    texto(cielo, 20, 52, sur ? 'Mirando hacia el sur' : 'Mirando hacia el norte', { 'text-anchor': 'start' });
    // estelas alrededor del polo, recortadas por el horizonte
    const px = OX + R * Math.cos(rad(alt)), py = OY - R * Math.sin(rad(alt));
    const clip = el('clipPath', { id: 'da-clip' }, cielo);
    el('rect', { x: 0, y: 0, width: W, height: OY }, clip);
    const estelas = el('g', { 'clip-path': 'url(#da-clip)' }, cielo);
    for (const r of [28, 58, 92, 130, 175]) {
      el('circle', { cx: px, cy: py, r, fill: 'none', stroke: '#f3ecd8', 'stroke-opacity': 0.22, 'stroke-dasharray': '2 5' }, estelas);
    }
    el('rect', { x: 0, y: OY, width: W, height: 330 - OY, fill: '#0a1122' }, cielo);
    el('line', { x1: 0, y1: OY, x2: W, y2: OY, stroke: '#a9c4ea', 'stroke-opacity': 0.6, 'stroke-width': 2 }, cielo);
    texto(cielo, W - 20, OY + 22, 'Horizonte', { 'text-anchor': 'end' });
    texto(cielo, OX + R + 10, OY + 22, sur ? 'Sur' : 'Norte', { fill: '#ebe5d5' });
    // cenit
    el('line', { x1: OX, y1: OY, x2: OX, y2: OY - R, stroke: '#8fb0e0', 'stroke-opacity': 0.3, 'stroke-dasharray': '3 5' }, cielo);
    texto(cielo, OX + 8, OY - R + 16, 'Cenit', { 'text-anchor': 'start' });
    // línea de la cámara al polo y ángulo
    el('line', { x1: OX, y1: OY, x2: px, y2: py, stroke: '#d4ae5a', 'stroke-width': 2.5 }, cielo);
    if (alt > 0.5) el('path', { d: arcoAngulo(OX, OY, 60, 0, alt), fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2 }, cielo);
    texto(cielo, OX + 78 * Math.cos(rad(alt / 2)) + 4, OY - 78 * Math.sin(rad(alt / 2)) + 5, `${Math.round(alt)}°`, { 'text-anchor': 'start', fill: '#f3e6bf', 'font-size': 16, 'font-weight': 600 });
    el('circle', { cx: px, cy: py, r: sur ? 5 : 8, fill: sur ? 'none' : '#f5dea0', stroke: '#f5dea0', 'stroke-width': 2 }, cielo);
    texto(cielo, px + 12, py - 10, sur ? 'Polo sur celeste (sin estrella brillante)' : 'Polaris (polo norte celeste)', { 'text-anchor': alt > 60 ? 'start' : 'start', fill: '#f5dea0' });
    // cámara
    const cam = el('g', { transform: `translate(${OX} ${OY}) rotate(${-alt})` }, cielo);
    el('rect', { x: -10, y: -12, width: 26, height: 18, rx: 3, fill: '#d4ae5a' }, cam);
    el('rect', { x: 16, y: -8, width: 9, height: 10, fill: '#d4ae5a' }, cam);
    el('path', { d: `M${OX} ${OY} L${OX - 14} ${OY + 40} M${OX} ${OY} L${OX + 14} ${OY + 40}`, stroke: '#d4ae5a', 'stroke-width': 2 }, cielo);
  }

  function dibujarGlobo(lat) {
    globo.innerHTML = '';
    const CX = 175, CY = 545, R = 95;
    texto(globo, 20, 362, 'Modelo del globo', { 'text-anchor': 'start', fill: '#ebe5d5', 'font-size': 16, 'font-weight': 600 });
    // eje y polos celestes
    el('line', { x1: CX, y1: CY - R - 50, x2: CX, y2: CY + R + 40, stroke: '#8fb0e0', 'stroke-opacity': 0.5, 'stroke-dasharray': '4 4' }, globo);
    texto(globo, CX + 8, CY - R - 36, 'polo norte celeste', { 'font-size': 12, 'text-anchor': 'start' });
    texto(globo, CX + 8, CY + R + 46, 'polo sur celeste', { 'font-size': 12, 'text-anchor': 'start' });
    el('circle', { cx: CX, cy: CY, r: R, fill: '#244a77', stroke: '#a9c4ea', 'stroke-opacity': 0.5 }, globo);
    el('line', { x1: CX - R, y1: CY, x2: CX + R, y2: CY, stroke: '#ebe5d5', 'stroke-opacity': 0.6 }, globo);
    texto(globo, CX - R + 6, CY - 6, 'ecuador', { 'text-anchor': 'start', 'font-size': 12, fill: '#ebe5d5' });
    // observador en la latitud elegida (borde derecho)
    const ox = CX + R * Math.cos(rad(lat)), oy = CY - R * Math.sin(rad(lat));
    el('line', { x1: CX, y1: CY, x2: ox, y2: oy, stroke: '#a9c4ea', 'stroke-opacity': 0.4 }, globo);
    // horizonte: tangente a la esfera
    const tx = Math.sin(rad(lat)), ty = Math.cos(rad(lat));
    el('line', { x1: ox - 70 * tx, y1: oy - 70 * ty, x2: ox + 70 * tx, y2: oy + 70 * ty, stroke: '#a9c4ea', 'stroke-width': 2 }, globo);
    // dirección del polo visible: paralela al eje
    const arriba = lat >= 0;
    const largo = 80;
    el('line', { x1: ox, y1: oy, x2: ox, y2: oy + (arriba ? -largo : largo), stroke: '#d4ae5a', 'stroke-width': 2.5 }, globo);
    // ángulo entre horizonte y dirección del polo = latitud
    const aH = arriba ? 90 + lat : -90 + lat; // dirección del horizonte hacia el lado del polo
    const aP = arriba ? 90 : -90;
    if (Math.abs(lat) > 1 && Math.abs(lat) < 89) el('path', { d: arcoAngulo(ox, oy, 26, Math.min(aH, aP), Math.max(aH, aP)), fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2 }, globo);
    el('circle', { cx: ox, cy: oy, r: 6, fill: '#d4ae5a' }, globo);
    texto(globo, 20, H - 34, 'Ángulo del polo sobre el', { 'text-anchor': 'start', 'font-size': 12, fill: '#f3e6bf' });
    texto(globo, 20, H - 14, `horizonte = latitud (${Math.round(Math.abs(lat))}°)`, { 'text-anchor': 'start', 'font-size': 12, fill: '#f3e6bf' });
  }

  function dibujarPlano(lat) {
    plano.innerHTML = '';
    const X0 = 350, X1 = 620, Y = 610, Hpol = 180;
    texto(plano, 340, 362, 'Modelo plano', { 'text-anchor': 'start', fill: '#ebe5d5', 'font-size': 16, 'font-weight': 600 });
    el('rect', { x: X0, y: Y, width: X1 - X0, height: 14, fill: '#3e6f5a' }, plano);
    el('rect', { x: X1 - 10, y: Y - 10, width: 14, height: 24, fill: '#d9e3f0' }, plano);
    texto(plano, X0, Y + 34, 'centro', { 'text-anchor': 'start', 'font-size': 12 });
    texto(plano, X0 + (X1 - X0) / 2, Y + 34, 'ecuador', { 'font-size': 12 });
    texto(plano, X1, Y + 34, 'borde sur', { 'text-anchor': 'end', 'font-size': 12 });
    el('line', { x1: X0 + (X1 - X0) / 2, y1: Y - 4, x2: X0 + (X1 - X0) / 2, y2: Y + 18, stroke: '#ebe5d5', 'stroke-opacity': 0.6 }, plano);
    // Polaris sobre el centro
    const PX = X0, PY = Y - Hpol;
    el('line', { x1: PX, y1: PY, x2: PX, y2: Y, stroke: '#8fb0e0', 'stroke-opacity': 0.4, 'stroke-dasharray': '4 4' }, plano);
    el('circle', { cx: PX, cy: PY, r: 7, fill: '#f5dea0' }, plano);
    texto(plano, PX + 12, PY - 8, 'Polaris, sobre el centro', { 'text-anchor': 'start', 'font-size': 12, fill: '#f5dea0' });
    // observador según la latitud
    const ox = X0 + (X1 - X0 - 12) * (90 - lat) / 180;
    const sur = lat < 0;
    el('line', { x1: ox, y1: Y, x2: PX, y2: PY, stroke: '#d4ae5a', 'stroke-width': 2.5, 'stroke-dasharray': sur ? '5 5' : '', 'stroke-opacity': sur ? 0.5 : 1 }, plano);
    const ang = (Math.atan2(Y - PY, ox - PX) * 180) / Math.PI;
    if (!sur && lat < 89) el('path', { d: arcoAngulo(ox, Y, 26, 180 - ang, 180), fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2 }, plano);
    el('circle', { cx: ox, cy: Y - 6, r: 6, fill: '#d4ae5a' }, plano);
    const notas = sur
      ? ['Polaris deja de verse:', 'el modelo lo atribuye', 'a la perspectiva. Polo sur:', 'tres propuestas.']
      : ['El ángulo baja al alejarse', 'del centro, por perspectiva,', 'como una farola lejana.'];
    notas.forEach((t, i) => texto(plano, 340, H - 14 - (notas.length - 1 - i) * 20, t, { 'text-anchor': 'start', 'font-size': 12, fill: '#f3e6bf' }));
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Lugar');
  const botones = LUGARES.map(([n, la]) => {
    const b = boton(n, () => { entrada.value = la; fijar(la, n); }, { 'aria-pressed': 'false' });
    b.dataset.n = n;
    return b;
  });
  fila.append(...botones);
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Latitud</span><input type="range" min="-90" max="90" step="1" value="40" aria-label="Latitud del lugar">';
  const entrada = rango.querySelector('input');
  barra.append(dato, fila, rango);

  function fijar(lat, nombre = '') {
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === nombre)));
    dibujarCielo(lat); dibujarGlobo(lat); dibujarPlano(lat);
    const a = Math.round(Math.abs(lat)), punos = Math.round(a / 10);
    const lugar = nombre ? `${nombre} (latitud ${a}° ${lat >= 0 ? 'norte' : 'sur'})` : `Latitud ${a}° ${lat > 0 ? 'norte' : lat < 0 ? 'sur' : ''}`.trim();
    let consejo;
    if (a >= 89) consejo = `Apunta la cámara hacia arriba, al cenit: ahí está ${lat > 0 ? 'Polaris' : 'el polo sur celeste'}, y todas las estrellas giran en círculos completos a su alrededor.`;
    else if (a <= 1) consejo = 'Los dos polos celestes están a ras del horizonte, uno al norte y otro al sur. Mirando a cualquiera de ellos verás arcos pegados al horizonte.';
    else consejo = `Apunta hacia el <strong>${lat > 0 ? 'norte' : 'sur'}</strong>, inclinando la cámara unos <strong>${a}°</strong> sobre el horizonte (unos ${punos} ${punos === 1 ? 'puño' : 'puños'}). Ahí está ${lat > 0 ? 'Polaris' : 'el polo sur celeste, sin estrella brillante'}.`;
    dato.innerHTML = `<strong>${lugar}.</strong> ${consejo}`;
    svg.setAttribute('aria-label', `Esquema: hacia dónde apuntar la cámara y cómo lo dibuja cada modelo. ${dato.textContent}`);
  }
  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(40, 'Madrid');
  return { destruir() {} };
}
