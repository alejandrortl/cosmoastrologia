// Interactivo: saltos de estrella. Rutas clásicas para ir de una estrella fácil de reconocer
// a otra, paso a paso. Es observación: sirven igual en cualquier modelo del mundo.
// Posiciones de las estrellas: d3-celestial (Hipparcos). Mapa con el norte arriba y el este a la
// izquierda, como se ve el cielo al mirar hacia arriba.

import { svgNS, boton, barraControles } from './comun.js';
import { cielo } from '../datos/cielo.js';

const W = 640, H = 500;
const rad = (g) => (g * Math.PI) / 180;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

// Cada paso: qué estrellas resaltar, qué trazo dibujar y qué decir.
// Un trazo es una lista de nombres de estrellas o de puntos especiales ('polo-sur').
// «prolongar: [a, b, veces]» dibuja la recta de a a b alargada «veces» su longitud más allá de b.
const RUTAS = [
  {
    id: 'polaris', nombre: 'Del Carro a Polaris', cuando: 'Hemisferio norte, todo el año',
    figuras: ['UMa', 'UMi'],
    pasos: [
      { estrellas: ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'], texto: 'Busca la Osa Mayor: siete estrellas brillantes que forman un carro, o un cazo con su mango. Según la hora y la estación lo verás de pie, tumbado o boca abajo.' },
      { estrellas: ['Merak', 'Dubhe'], trazo: ['Merak', 'Dubhe'], texto: 'Las dos estrellas del extremo del carro, Merak y Dubhe, se llaman los «punteros». Fíjate en la distancia que hay entre ellas.' },
      { estrellas: ['Dubhe', 'Polaris'], prolongar: ['Merak', 'Dubhe', 5.2], hasta: 'Polaris', texto: 'Prolonga la línea de los punteros unas cinco veces esa distancia, saliendo por Dubhe. Llegarás a Polaris: una estrella no muy brillante, bastante sola en su zona del cielo.' },
      { estrellas: ['Polaris', 'Kochab'], texto: 'Polaris es el extremo de la cola de la Osa Menor. Si la miras de frente, estás mirando al norte, y su altura sobre el horizonte es parecida a tu latitud.' },
    ],
  },
  {
    id: 'arturo', nombre: 'Del Carro a Arturo y Espiga', cuando: 'Hemisferio norte, primavera; se ve también desde latitudes tropicales',
    figuras: ['UMa', 'Boo', 'Vir'],
    pasos: [
      { estrellas: ['Alioth', 'Mizar', 'Alkaid'], trazo: ['Megrez', 'Alioth', 'Mizar', 'Alkaid'], curva: true, texto: 'Ahora fíjate en el mango del carro: Alioth, Mizar y Alkaid forman una curva suave.' },
      { estrellas: ['Alkaid', 'Arturo'], trazo: ['Alioth', 'Mizar', 'Alkaid', 'Arturo'], curva: true, texto: 'Sigue esa curva más allá de Alkaid, como un arco. Llegarás a Arturo, una estrella anaranjada muy brillante, la más brillante de esa zona.' },
      { estrellas: ['Arturo', 'Espiga'], trazo: ['Mizar', 'Alkaid', 'Arturo', 'Espiga'], curva: true, texto: 'Continúa el arco otra distancia parecida y llegarás a Espiga, blanca azulada, en la constelación de Virgo. La regla clásica dice: «sigue el arco hasta Arturo y luego clávate en Espiga».' },
    ],
  },
  {
    id: 'orion', nombre: 'Del cinturón de Orión a Sirio y Aldebarán', cuando: 'Los dos hemisferios, de noviembre a marzo',
    figuras: ['Ori', 'CMa', 'Tau'],
    pasos: [
      { estrellas: ['Betelgeuse', 'Rigel', 'Bellatrix', 'Alnitak', 'Alnilam', 'Mintaka'], texto: 'Busca Orión: un gran rectángulo con Betelgeuse, rojiza, y Rigel, azulada, en esquinas opuestas, y tres estrellas en fila en el centro: el cinturón, «las Tres Marías».' },
      { estrellas: ['Alnitak', 'Sirio'], prolongar: ['Mintaka', 'Alnitak', 2.6], hasta: 'Sirio', texto: 'Sigue la línea del cinturón hacia un lado unas ocho veces su longitud: llegarás a Sirio, la estrella más brillante de todo el cielo nocturno.' },
      { estrellas: ['Mintaka', 'Aldebarán'], prolongar: ['Alnitak', 'Mintaka', 2.6], hasta: 'Aldebarán', texto: 'Ahora síguela hacia el otro lado: llegarás a Aldebarán, anaranjada, el ojo del Toro.' },
      { estrellas: ['Aldebarán', 'Pléyades'], trazo: ['Aldebarán', 'Pléyades'], texto: 'Un poco más allá, en la misma dirección, verás un grupito apretado de estrellas: las Pléyades, también llamadas las Siete Cabrillas.' },
    ],
  },
  {
    id: 'verano', nombre: 'El triángulo de verano', cuando: 'Hemisferio norte, de junio a octubre',
    figuras: ['Lyr', 'Cyg', 'Aql'],
    pasos: [
      { estrellas: ['Vega'], texto: 'En las noches de verano, la estrella brillante más alta del cielo es Vega, blanca azulada, en la pequeña constelación de la Lira.' },
      { estrellas: ['Vega', 'Deneb'], trazo: ['Vega', 'Deneb'], texto: 'Al este de Vega, a algo más de un palmo con la mano abierta, está Deneb, la cola del Cisne, que vuela a lo largo de la Vía Láctea.' },
      { estrellas: ['Vega', 'Deneb', 'Altair'], trazo: ['Vega', 'Deneb', 'Altair', 'Vega'], texto: 'Más al sur está Altair, en el Águila. Las tres forman el gran triángulo de verano, que sirve de referencia para todo ese cielo.' },
    ],
  },
  {
    id: 'invierno', nombre: 'El triángulo de invierno', cuando: 'Los dos hemisferios, de diciembre a marzo',
    figuras: ['Ori', 'CMa', 'CMi'],
    pasos: [
      { estrellas: ['Betelgeuse'], texto: 'Empieza por Betelgeuse, la estrella rojiza del hombro de Orión.' },
      { estrellas: ['Betelgeuse', 'Sirio', 'Proción'], trazo: ['Betelgeuse', 'Sirio', 'Proción', 'Betelgeuse'], texto: 'Con Sirio, la más brillante del cielo, y Proción, en el Can Menor, forma un triángulo casi equilátero: el triángulo de invierno.' },
    ],
  },
  {
    id: 'cruz', nombre: 'De la Cruz del Sur al polo sur celeste', cuando: 'Hemisferio sur, todo el año (mejor de marzo a septiembre)',
    figuras: ['Cru', 'Cen'],
    pasos: [
      { estrellas: ['Ácrux', 'Gácrux', 'Mimosa', 'Delta Crucis'], texto: 'Busca la Cruz del Sur: cuatro estrellas brillantes en forma de cometa pequeña. Ojo: hay una «falsa cruz» más grande y más débil cerca; la verdadera tiene al lado dos estrellas muy brillantes.' },
      { estrellas: ['Alfa Centauri', 'Beta Centauri'], texto: 'Esas dos estrellas muy brillantes son Alfa y Beta Centauri, los «punteros» del sur. Señalan hacia la Cruz y confirman que es la verdadera.' },
      { estrellas: ['Gácrux', 'Ácrux'], prolongar: ['Gácrux', 'Ácrux', 4.5], hasta: 'polo-sur', texto: 'Prolonga el palo largo de la Cruz, de Gácrux a Ácrux, unas cuatro veces y media su longitud. Llegarás muy cerca del polo sur celeste, una zona sin estrellas brillantes.' },
      { estrellas: ['Alfa Centauri', 'Beta Centauri'], perpendicular: ['Alfa Centauri', 'Beta Centauri'], hasta: 'polo-sur', texto: 'Comprueba: traza la línea que pasa por el punto medio entre los dos punteros, en perpendicular a ellos. Cruza la anterior cerca del polo. Debajo de ese punto, en el horizonte, está el sur.' },
    ],
  },
];

export function saltosEstrella(contenedor) {
  const datos = cielo();
  const porNombre = Object.fromEntries(datos.conNombre.map((s) => [s.nombre, s]));
  const POLO_SUR = { nombre: 'polo-sur', ra: 0, dec: -90 };
  const punto = (n) => (n === 'polo-sur' ? POLO_SUR : porNombre[n]);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);

  let ruta = RUTAS[0], paso = 0, proy;

  function preparar() {
    // Centro y escala: todas las estrellas que aparecen en la ruta, más el polo si hace falta
    const nombres = new Set();
    ruta.pasos.forEach((p) => { (p.estrellas || []).forEach((n) => nombres.add(n)); if (p.hasta) nombres.add(p.hasta); });
    const pts = [...nombres].map(punto).filter(Boolean);
    // centro: media en coordenadas cartesianas
    let x = 0, y = 0, z = 0;
    pts.forEach((s) => { x += Math.cos(rad(s.dec)) * Math.cos(rad(s.ra)); y += Math.cos(rad(s.dec)) * Math.sin(rad(s.ra)); z += Math.sin(rad(s.dec)); });
    const ra0 = (Math.atan2(y, x) * 180) / Math.PI, dec0 = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
    const est = (ra, dec) => {
      const c = Math.sin(rad(dec0)) * Math.sin(rad(dec)) + Math.cos(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0));
      const k = 2 / (1 + c);
      return [k * Math.cos(rad(dec)) * Math.sin(rad(ra - ra0)), k * (Math.cos(rad(dec0)) * Math.sin(rad(dec)) - Math.sin(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0))), c];
    };
    const xy = pts.map((s) => est(s.ra, s.dec));
    const ancho = Math.max(...xy.map((p) => Math.abs(p[0]))) || 0.1, altoP = Math.max(...xy.map((p) => Math.abs(p[1]))) || 0.1;
    const s = Math.min((W / 2 - 70) / ancho, (H / 2 - 50) / altoP);
    proy = (ra, dec) => { const [px, py, c] = est(ra, dec); return { x: W / 2 - px * s, y: H / 2 - py * s, visible: c > -0.2 }; };
  }

  function dibujarFondo() {
    svg.innerHTML = '';
    el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
    // Líneas de las constelaciones de la ruta
    const figuras = el('g', { stroke: '#8fb0e0', 'stroke-opacity': 0.35, 'stroke-width': 1.2, fill: 'none' }, svg);
    for (const k of datos.constelaciones) {
      if (!ruta.figuras.includes(k.id)) continue;
      for (const poli of k.lineas) {
        const pts = poli.map(([ra, dec]) => proy(ra, dec));
        if (pts.some((p) => !p.visible)) continue;
        el('polyline', { points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') }, figuras);
      }
    }
    // Estrellas
    const g = el('g', {}, svg);
    for (const st of datos.estrellas) {
      const p = proy(st.ra, st.dec);
      if (!p.visible || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
      el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: Math.max(0.8, 4.2 - st.mag * 0.8).toFixed(2), fill: '#f3ecd8', opacity: Math.min(1, 1.1 - st.mag * 0.13).toFixed(2) }, g);
    }
    if (ruta.id === 'cruz') {
      const p = proy(0, -90);
      el('circle', { cx: p.x, cy: p.y, r: 9, fill: 'none', stroke: '#f5dea0', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
      const t = el('text', { x: p.x + 14, y: p.y + 5, 'font-size': 13, fill: '#f5dea0', ...fuente }, svg);
      t.textContent = 'polo sur celeste';
    }
    // Rosa de los vientos del mapa
    const r = el('g', { transform: `translate(${W - 34} ${H - 40})`, ...fuente, 'font-size': 12, fill: '#a9b2c4', 'text-anchor': 'middle' }, svg);
    el('path', { d: 'M0 -16 L0 16 M-16 0 L16 0', stroke: '#a9b2c4', 'stroke-opacity': 0.5 }, r);
    const tn = el('text', { x: 0, y: -21 }, r); tn.textContent = 'N';
    const te = el('text', { x: -24, y: 4 }, r); te.textContent = 'E';
    const to = el('text', { x: 24, y: 4 }, r); to.textContent = 'O';
    svg.append(capa);
  }

  const capa = el('g', {});

  function linea(puntos, curva, clase = 'trazo') {
    let d;
    if (curva && puntos.length > 2) {
      // Curva suave que pasa por los puntos (Catmull-Rom)
      d = `M${puntos[0].x} ${puntos[0].y}`;
      for (let i = 0; i < puntos.length - 1; i++) {
        const p0 = puntos[i - 1] || puntos[i], p1 = puntos[i], p2 = puntos[i + 1], p3 = puntos[i + 2] || p2;
        d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
      }
    } else d = `M${puntos.map((p) => `${p.x} ${p.y}`).join(' L')}`;
    const path = el('path', { d, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2.5, 'stroke-linecap': 'round', class: clase }, capa);
    const largo = path.getTotalLength ? path.getTotalLength() : 0;
    if (largo && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDasharray = `${largo}`;
      path.style.strokeDashoffset = `${largo}`;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1.1s ease-out';
      requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
    }
  }

  function dibujarPaso() {
    capa.innerHTML = '';
    const p = ruta.pasos[paso];
    const xy = (n) => { const s = punto(n); return proy(s.ra, s.dec); };
    if (p.trazo) linea(p.trazo.map(xy), p.curva);
    if (p.prolongar) {
      const [a, b, veces] = p.prolongar;
      const A = xy(a), B = xy(b);
      // Si el destino es una estrella, la línea llega a ella; si es el polo, se alarga «veces» su longitud
      const fin = p.hasta && p.hasta !== 'polo-sur' ? xy(p.hasta) : { x: B.x + (B.x - A.x) * veces, y: B.y + (B.y - A.y) * veces };
      linea([A, B], false);
      const l = el('path', { d: `M${B.x} ${B.y} L${fin.x} ${fin.y}`, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 2, 'stroke-dasharray': '6 6', 'stroke-opacity': 0.9 }, capa);
      l.style.opacity = 0; requestAnimationFrame(() => { l.style.transition = 'opacity .8s .6s'; l.style.opacity = 1; });
    }
    if (p.perpendicular) {
      const [a, b] = p.perpendicular;
      const A = xy(a), B = xy(b), M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const P = xy('polo-sur');
      linea([A, B], false);
      // recta perpendicular por el punto medio, hacia el polo
      const dx = B.y - A.y, dy = A.x - B.x, n = Math.hypot(dx, dy) || 1;
      const sentido = ((P.x - M.x) * dx + (P.y - M.y) * dy) > 0 ? 1 : -1;
      const largo = Math.hypot(P.x - M.x, P.y - M.y) * 1.15;
      el('path', { d: `M${M.x} ${M.y} L${M.x + (sentido * dx / n) * largo} ${M.y + (sentido * dy / n) * largo}`, fill: 'none', stroke: '#8fb0e0', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, capa);
      el('circle', { cx: M.x, cy: M.y, r: 3.5, fill: '#8fb0e0' }, capa);
    }
    // Estrellas resaltadas con su nombre
    for (const n of p.estrellas || []) {
      const s = punto(n), q = proy(s.ra, s.dec);
      el('circle', { cx: q.x, cy: q.y, r: 10, fill: 'none', stroke: '#d4ae5a', 'stroke-width': 1.6 }, capa);
      // Cerca del borde derecho el nombre va a la izquierda. Alfa y Beta Centauri están muy juntas:
      // Alfa (al este) lleva el nombre a la izquierda y Beta, debajo a la derecha.
      const izq = n === 'Alfa Centauri' || (q.x > W * 0.72 && n !== 'Beta Centauri'), abajo = n === 'Beta Centauri';
      const t = el('text', { x: q.x + (izq ? -13 : 13), y: q.y + (abajo ? 26 : -8), 'font-size': 14, fill: '#f5dea0', 'font-weight': 600, 'text-anchor': izq ? 'end' : 'start', ...fuente }, capa);
      t.textContent = n;
    }
    dato.innerHTML = `<strong>Paso ${paso + 1} de ${ruta.pasos.length}.</strong> ${p.texto}`;
    cuando.textContent = ruta.cuando;
    bAnt.disabled = paso === 0;
    bSig.textContent = paso === ruta.pasos.length - 1 ? 'Empezar de nuevo' : 'Siguiente paso';
    svg.setAttribute('aria-label', `Salto de estrella: ${ruta.nombre}. ${dato.textContent}`);
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const cuando = document.createElement('p');
  cuando.className = 'lectura-dato';
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const filaPasos = document.createElement('div');
  filaPasos.className = 'grupo-botones';
  const bAnt = boton('Paso anterior', () => { if (paso > 0) { paso--; dibujarPaso(); } });
  const bSig = boton('Siguiente paso', () => { paso = paso < ruta.pasos.length - 1 ? paso + 1 : 0; dibujarPaso(); });
  filaPasos.append(bAnt, bSig);
  const filaRutas = document.createElement('div');
  filaRutas.className = 'grupo-botones';
  filaRutas.setAttribute('role', 'group');
  filaRutas.setAttribute('aria-label', 'Ruta');
  const botones = RUTAS.map((r) => {
    const b = boton(r.nombre, () => elegir(r), { 'aria-pressed': 'false' });
    b.dataset.id = r.id;
    return b;
  });
  filaRutas.append(...botones);
  barra.append(dato, cuando, filaPasos, filaRutas);

  function elegir(r) {
    ruta = r; paso = 0;
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === r.id)));
    preparar(); dibujarFondo(); dibujarPaso();
  }
  elegir(RUTAS[0]);
  return { destruir() {} };
}
