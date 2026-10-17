// Interactivo: practicar la regla de la mano. Se muestra una pareja de estrellas conocidas y hay
// que adivinar con qué parte de la mano se taparía la distancia entre ellas, con el brazo estirado.
// Es observación: los ángulos son lo que se ve, sea cual sea el modelo del mundo.
// Posiciones: d3-celestial (Hipparcos). Mapa con el norte arriba y el este a la izquierda.

import { svgNS, boton, barraControles } from './comun.js';
import { cielo } from '../datos/cielo.js';

const W = 640, H = 420;
const rad = (g) => (g * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

const PAREJAS = [
  ['Merak', 'Dubhe', 'Los punteros del Carro', ['UMa']],
  ['Alnitak', 'Mintaka', 'El cinturón de Orión, de punta a punta', ['Ori']],
  ['Ácrux', 'Gácrux', 'El palo largo de la Cruz del Sur', ['Cru', 'Cen']],
  ['Cástor', 'Pólux', 'Los gemelos', ['Gem']],
  ['Betelgeuse', 'Rigel', 'El hombro y el pie de Orión', ['Ori']],
  ['Alfa Centauri', 'Beta Centauri', 'Los punteros del sur', ['Cen', 'Cru']],
  ['Dubhe', 'Alkaid', 'El Carro, de punta a punta', ['UMa']],
  ['Dubhe', 'Polaris', 'Del Carro a Polaris', ['UMa', 'UMi']],
  ['Vega', 'Altair', 'Dos vértices del triángulo de verano', ['Lyr', 'Aql', 'Cyg']],
  ['Arturo', 'Espiga', 'De Arturo a Espiga', ['Boo', 'Vir']],
  ['Aldebarán', 'Pléyades', 'Del ojo del Toro a las Pléyades', ['Tau']],
  ['Sirio', 'Proción', 'Los dos perros de Orión', ['CMa', 'CMi', 'Ori']],
];

const OPCIONES = [
  [1, 'Un meñique', '1°'],
  [3, 'Dos dedos', '3°'],
  [5, 'Tres dedos', '5°'],
  [10, 'Un puño', '10°'],
  [20, 'Un palmo', '20°'],
  [30, 'Tres puños', '30°'],
];

function separacion(a, b) {
  const c = Math.sin(rad(a.dec)) * Math.sin(rad(b.dec)) + Math.cos(rad(a.dec)) * Math.cos(rad(b.dec)) * Math.cos(rad(a.ra - b.ra));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
}

// Cómo se mide un ángulo con la mano, en palabras
export function enManos(g) {
  if (g < 1.6) return 'un meñique';
  if (g < 3.8) return 'dos dedos';
  if (g < 7.5) return 'tres dedos';
  if (g >= 16 && g < 24) return 'un palmo, o dos puños';
  const p = Math.round(g / 5) / 2; // puños, de medio en medio
  const ent = Math.floor(p), medio = p - ent >= 0.5;
  const nombres = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  if (ent === 1) return medio ? 'un puño y medio' : 'un puño';
  return `${nombres[ent] || ent} puños${medio ? ' y medio' : ''}`;
}

export function medirMano(contenedor) {
  const datos = cielo();
  const porNombre = Object.fromEntries(datos.conNombre.map((s) => [s.nombre, s]));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);

  let i = 0, respuesta = null, aciertos = 0, intentos = 0;

  function dibujar() {
    const [na, nb, titulo, figuras] = PAREJAS[i];
    const a = porNombre[na], b = porNombre[nb];
    const sep = separacion(a, b);
    // Proyección estereográfica centrada entre las dos estrellas
    let x = 0, y = 0, z = 0;
    [a, b].forEach((s) => { x += Math.cos(rad(s.dec)) * Math.cos(rad(s.ra)); y += Math.cos(rad(s.dec)) * Math.sin(rad(s.ra)); z += Math.sin(rad(s.dec)); });
    const ra0 = deg(Math.atan2(y, x)), dec0 = deg(Math.atan2(z, Math.hypot(x, y)));
    const est = (ra, dec) => {
      const c = Math.sin(rad(dec0)) * Math.sin(rad(dec)) + Math.cos(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0));
      const k = 2 / (1 + c);
      return [k * Math.cos(rad(dec)) * Math.sin(rad(ra - ra0)), k * (Math.cos(rad(dec0)) * Math.sin(rad(dec)) - Math.sin(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0))), c];
    };
    // La pareja ocupa algo más de la mitad del ancho; la escala depende de la distancia
    const pa0 = est(a.ra, a.dec), pb0 = est(b.ra, b.dec);
    const dist = Math.hypot(pa0[0] - pb0[0], pa0[1] - pb0[1]) || 0.01;
    const s = Math.min(W * 0.56, H * 0.62) / dist;
    const proy = (ra, dec) => { const [px, py, c] = est(ra, dec); return { x: W / 2 - px * s, y: H / 2 - 10 - py * s, visible: c > -0.2 }; };

    svg.innerHTML = '';
    el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
    const lin = el('g', { stroke: '#8fb0e0', 'stroke-opacity': 0.3, 'stroke-width': 1.1, fill: 'none' }, svg);
    for (const k of datos.constelaciones) {
      if (!figuras.includes(k.id)) continue;
      for (const poli of k.lineas) {
        const pts = poli.map(([ra, dec]) => proy(ra, dec));
        if (pts.some((p) => !p.visible)) continue;
        el('polyline', { points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') }, lin);
      }
    }
    const g = el('g', {}, svg);
    for (const st of datos.estrellas) {
      const p = proy(st.ra, st.dec);
      if (!p.visible || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
      el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: Math.max(0.8, 4.2 - st.mag * 0.8).toFixed(2), fill: '#f3ecd8', opacity: Math.min(1, 1.1 - st.mag * 0.13).toFixed(2) }, g);
    }
    const pa = proy(a.ra, a.dec), pb = proy(b.ra, b.dec);
    el('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: '#d4ae5a', 'stroke-width': 1.5, 'stroke-dasharray': '4 5', opacity: 0.8 }, svg);

    // Tras responder: la regla de la mano superpuesta, en tramos de 10° (puños) o de 1°
    if (respuesta !== null) {
      const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const pxGrado = L / sep;
      const tramo = sep >= 12 ? 10 : sep >= 4 ? 1 : 0.5;
      const regla = el('g', {}, svg);
      const off = 22;
      for (let d = 0, k = 0; d < sep - 1e-6; d += tramo, k++) {
        const l = Math.min(tramo, sep - d) * pxGrado;
        const x0 = pa.x + ux * d * pxGrado + nx * off, y0 = pa.y + uy * d * pxGrado + ny * off;
        el('line', { x1: x0, y1: y0, x2: x0 + ux * l, y2: y0 + uy * l, stroke: k % 2 ? '#7cc4a4' : '#d4ae5a', 'stroke-width': 9, 'stroke-linecap': 'butt', opacity: 0.85 }, regla);
      }
      const mx = (pa.x + pb.x) / 2 + nx * (off + 26), my = (pa.y + pb.y) / 2 + ny * (off + 26);
      const ancla = nx > 0.3 ? 'start' : nx < -0.3 ? 'end' : 'middle';
      const t = el('text', { x: mx, y: my + 5, 'font-size': 15, 'font-weight': 600, fill: '#f3e6bf', 'text-anchor': ancla, ...fuente }, svg);
      t.textContent = `${sep.toFixed(1).replace('.', ',')}° · ${enManos(sep)}`;
      const leyenda = el('text', { x: 16, y: H - 14, 'font-size': 12, fill: '#a9b2c4', ...fuente }, svg);
      leyenda.textContent = tramo === 10 ? 'Cada tramo de color: un puño (10°)' : tramo === 1 ? 'Cada tramo de color: un meñique (1°)' : 'Cada tramo de color: medio grado, el tamaño de la Luna llena';
    }
    for (const [s0, p, n] of [[a, pa, na], [b, pb, nb]]) {
      el('circle', { cx: p.x, cy: p.y, r: 10, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 1.6 }, svg);
      const izq = p === pa ? pa.x < pb.x : pb.x < pa.x; // el nombre, hacia fuera
      const t = el('text', { x: p.x + (izq ? -14 : 14), y: p.y - 10, 'font-size': 15, 'font-weight': 600, fill: '#f5dea0', 'text-anchor': izq ? 'end' : 'start', ...fuente }, svg);
      t.textContent = n;
    }
    const tt = el('text', { x: 16, y: 26, 'font-size': 15, fill: '#c9d3e6', ...fuente }, svg);
    tt.textContent = titulo;
    return sep;
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Tu respuesta');
  const botones = OPCIONES.map(([g, n, t]) => {
    const b = boton(`${n} (${t})`, () => responder(g));
    b.dataset.g = g;
    return b;
  });
  fila.append(...botones);
  const bOtra = boton('Otra pareja', () => { i = (i + 1) % PAREJAS.length; respuesta = null; actualizar(); });
  const marcador = document.createElement('p');
  marcador.className = 'lectura-dato';
  barra.append(dato, fila, bOtra, marcador);

  function responder(g) {
    if (respuesta !== null) return;
    respuesta = g;
    intentos++;
    const sep = dibujar();
    const mejor = OPCIONES.reduce((m, o) => (Math.abs(Math.log(o[0] / sep)) < Math.abs(Math.log(m[0] / sep)) ? o : m));
    const bien = mejor[0] === g;
    if (bien) aciertos++;
    botones.forEach((b) => {
      b.setAttribute('aria-pressed', String(+b.dataset.g === g));
      b.disabled = true;
    });
    const [na, nb] = PAREJAS[i];
    dato.innerHTML = `${bien ? '<strong>¡Bien!</strong>' : '<strong>Casi.</strong>'} Entre ${na} y ${nb} hay <strong>${sep.toFixed(1).replace('.', ',')}°</strong>: con el brazo estirado, unos <strong>${enManos(sep)}</strong>.${bien ? '' : ` La opción más cercana era «${mejor[1].toLowerCase()} (${mejor[2]})».`} Cuando salgas, compruébalo en el cielo con tu propia mano.`;
    marcador.textContent = `Llevas ${aciertos} de ${intentos}.`;
    svg.setAttribute('aria-label', `Práctica de la regla de la mano. ${dato.textContent}`);
  }

  function actualizar() {
    dibujar();
    botones.forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.disabled = false; });
    const [na, nb] = PAREJAS[i];
    dato.innerHTML = `¿Qué distancia hay entre <strong>${na}</strong> y <strong>${nb}</strong>? Imagina el brazo estirado y elige con qué parte de la mano la taparías.`;
    svg.setAttribute('aria-label', `Práctica de la regla de la mano: ${PAREJAS[i][2]}. ${dato.textContent}`);
  }
  actualizar();
  return { destruir() {} };
}
