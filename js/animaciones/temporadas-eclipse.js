// Interactivo: por qué los eclipses llegan en temporadas.
// Arriba, lo que se ve en el cielo (observación): el camino del Sol, el de la Luna inclinado
// unos 5° y los dos nodos donde se cruzan. En medio, el modelo del globo visto desde fuera:
// la órbita inclinada de la Luna y su línea de nodos. Abajo, la disposición plana de la wiki de
// la Flat Earth Society, sin un cálculo publicado de las temporadas. Debajo de todo, la línea
// del tiempo con cada luna nueva y llena y las que quedan cerca de un nodo.
// Posiciones medias del Sol y la Luna (Jean Meeus, «Astronomical Algorithms», cap. 47, solo
// términos medios): aproximan las fechas reales en un día o dos. Esquemas, no a escala.

import { svgNS, boton, barraControles, sinMovimiento, bucle } from './comun.js';

const W = 640, H = 860;
const RAD = Math.PI / 180;
const INCL = 5.145;              // inclinación de la órbita lunar
const LIM_SOL = 1.5, LIM_LUNA = 1.5; // latitud de la Luna por debajo de la cual hay eclipse, penumbrales incluidos (aprox.)
const DIAS = 731;                // dos años desde el 1 de enero de 2026
const D0 = 9496.5;               // días desde J2000.0 hasta el 1-1-2026 a las 0 h TT

const norm = (x) => ((x % 360) + 360) % 360;
const firmado = (x) => { const n = norm(x); return n > 180 ? n - 360 : n; };

// Posiciones medias para «t» días desde el 1-1-2026
function cielo(t) {
  const d = D0 + t;
  const sol = norm(280.4665 + 0.98564736 * d);
  const luna = norm(218.3165 + 13.17639648 * d);
  const F = norm(93.2721 + 13.22935024 * d);       // distancia de la Luna a su nodo ascendente
  const nodo = norm(125.0445 - 0.05295377 * d);    // longitud del nodo ascendente
  return { sol, luna, nodo, lat: INCL * Math.sin(F * RAD), elong: norm(luna - sol) };
}

// Lunas nuevas y llenas del periodo, con su latitud: las que quedan cerca del nodo son eclipses
function sicigias() {
  const lista = [];
  let prev = cielo(0);
  for (let t = 0.25; t <= DIAS; t += 0.25) {
    const c = cielo(t);
    for (const [obj, tipo] of [[0, 'nueva'], [180, 'llena']]) {
      const a = firmado(prev.elong - obj), b = firmado(c.elong - obj);
      if (a < 0 && b >= 0) {
        const tt = t - 0.25 + 0.25 * (-a / (b - a));
        const cc = cielo(tt);
        const lim = tipo === 'nueva' ? LIM_SOL : LIM_LUNA;
        lista.push({ t: tt, tipo, lat: cc.lat, eclipse: Math.abs(cc.lat) < lim });
      }
    }
    prev = c;
  }
  return lista;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fecha(t) {
  const f = new Date(Date.UTC(2026, 0, 1) + t * 86400000);
  return `${f.getUTCDate()} ${MESES[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
}

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}
function texto(padre, x, y, t, attrs = {}) {
  const e = el('text', { x, y, 'font-family': 'IBM Plex Sans, system-ui, sans-serif', 'font-size': 15, fill: '#a9b2c4', ...attrs }, padre);
  e.textContent = t;
  return e;
}

let contador = 0;

export function temporadasEclipse(contenedor) {
  const id = `tem${++contador}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  svg.innerHTML = `<defs>
    <radialGradient id="${id}-sol"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#f2cf72"/><stop offset="1" stop-color="#f2cf72" stop-opacity="0"/></radialGradient>
  </defs><rect width="${W}" height="${H}" fill="#0f1930"/>`;
  const eventos = sicigias();

  // ---------- 1. Lo que se ve en el cielo ----------
  const cielo1 = el('g', {}, svg);
  texto(cielo1, 20, 30, 'Lo que se ve: el camino del Sol y el de la Luna', { fill: '#ebe5d5', 'font-size': 18, 'font-weight': 600 });
  texto(cielo1, 20, 50, 'Todo el cielo desenrollado en una tira, con la inclinación exagerada', { 'font-size': 14 });
  const X0 = 30, X1 = W - 30, YE = 125, ESC = 9; // 9 px por grado de latitud
  const lonX = (lon, centro) => X0 + (firmado(lon - centro) + 180) / 360 * (X1 - X0);
  el('rect', { x: X0, y: YE - 60, width: X1 - X0, height: 120, fill: '#0b1326', rx: 6 }, cielo1);
  el('line', { x1: X0, x2: X1, y1: YE, y2: YE, stroke: '#d4ae5a', 'stroke-width': 1.5 }, cielo1);
  texto(cielo1, X1 - 4, YE + 20, 'camino del Sol', { 'text-anchor': 'end', 'font-size': 14, fill: '#d4ae5a' });
  const caminoLuna = el('path', { fill: 'none', stroke: '#c9c2ae', 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, cielo1);
  const rotCamino = texto(cielo1, X0 + 6, YE + 52, 'camino de la Luna', { 'font-size': 14, fill: '#c9c2ae' });
  const nodos = [0, 1].map(() => {
    const g = el('g', {}, cielo1);
    el('circle', { r: 5, fill: 'none', stroke: '#8fb0e0', 'stroke-width': 2 }, g);
    texto(g, 0, -10, 'nodo', { 'text-anchor': 'middle', 'font-size': 14, fill: '#8fb0e0' });
    return g;
  });
  const sol1 = el('circle', { r: 11, fill: '#f2cf72' }, cielo1);
  const luna1 = el('circle', { r: 9, fill: '#e9e3d4', stroke: '#0f1930', 'stroke-width': 1.5 }, cielo1);
  const antiSol = el('circle', { r: 11, fill: 'none', stroke: '#f2cf72', 'stroke-opacity': 0.5, 'stroke-dasharray': '3 3' }, cielo1);
  texto(cielo1, 20, 205, 'El círculo punteado marca el punto opuesto al Sol, donde está la luna llena.', { 'font-size': 14 });

  // ---------- 2. Modelo del globo ----------
  const globo = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 224, y2: 224, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, globo);
  texto(globo, 20, 252, 'Modelo del globo (astronomía moderna)', { fill: '#ebe5d5', 'font-size': 18, 'font-weight': 600 });
  texto(globo, 20, 272, 'Visto desde fuera y un poco por encima de la órbita de la Tierra', { 'font-size': 14 });
  const SC = { x: W / 2, y: 395 }, RX = 210, RY = 70;  // órbita de la Tierra en perspectiva
  el('ellipse', { cx: SC.x, cy: SC.y, rx: RX, ry: RY, fill: 'none', stroke: '#8fb0e0', 'stroke-opacity': 0.35 }, globo);
  el('circle', { cx: SC.x, cy: SC.y, r: 34, fill: `url(#${id}-sol)` }, globo);
  texto(globo, SC.x, SC.y + 5, 'Sol', { 'text-anchor': 'middle', fill: '#14203a', 'font-size': 14, 'font-weight': 600 });
  const sombraT = el('line', { stroke: '#05070d', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }, globo);
  const orbLunaArr = el('path', { fill: 'none', stroke: '#c9c2ae', 'stroke-width': 1.5 }, globo);
  const orbLunaAb = el('path', { fill: 'none', stroke: '#c9c2ae', 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.7 }, globo);
  const lineaNodos = el('line', { stroke: '#8fb0e0', 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }, globo);
  const tierra = el('circle', { r: 10, fill: '#3d6fb0', stroke: '#8fb0e0' }, globo);
  const luna2 = el('circle', { r: 6, fill: '#e9e3d4' }, globo);
  const rotTierra = texto(globo, 0, 0, 'Tierra', { 'text-anchor': 'middle', 'font-size': 14, fill: '#8fb0e0' });
  texto(globo, 20, 512, 'Trazo continuo: la mitad de la órbita de la Luna que queda por encima del plano', { 'font-size': 14 });
  texto(globo, 20, 528, 'de la Tierra; punteado, la de debajo. Línea azul: la línea de los nodos.', { 'font-size': 14 });

  // ---------- 3. Modelo plano ----------
  const plano = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 546, y2: 546, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, plano);
  texto(plano, 20, 574, 'Modelo plano (disposición de la wiki de la Flat Earth Society)', { fill: '#ebe5d5', 'font-size': 18, 'font-weight': 600 });
  texto(plano, 20, 594, 'El plano visto desde encima del polo norte', { 'font-size': 14 });
  const PC = { x: 170, y: 672 };
  el('circle', { cx: PC.x, cy: PC.y, r: 66, fill: '#1d3a5f', stroke: '#8fb0e0', 'stroke-opacity': 0.5 }, plano);
  el('circle', { cx: PC.x, cy: PC.y, r: 3, fill: '#ebe5d5' }, plano);
  const solP = el('circle', { r: 9, fill: '#f2cf72' }, plano);
  const lunaP = el('circle', { r: 7, fill: '#e9e3d4', stroke: '#0f1930', 'stroke-width': 1.5 }, plano);
  const notasP = [
    'El Sol y la Luna, pequeños, giran sobre el plano.',
    'Para los eclipses de Sol, la Luna pasa por delante.',
    'Para los de Luna, la wiki propone un «objeto de',
    'sombra» con unos 5° de inclinación.',
    'No publica un cálculo de las temporadas.',
  ];
  notasP.forEach((t, i) => texto(plano, 262, 632 + i * 19, t, { 'font-size': 14, fill: i === 4 ? '#f3e6bf' : '#a9b2c4' }));

  // ---------- 4. Línea del tiempo ----------
  const linea = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 754, y2: 754, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, linea);
  texto(linea, 20, 778, 'Lunas nuevas (arriba) y llenas (abajo), 2026 y 2027', { fill: '#ebe5d5', 'font-size': 15, 'font-weight': 600 });
  const TX0 = 30, TX1 = W - 30, TY = 816;
  const tX = (t) => TX0 + t / DIAS * (TX1 - TX0);
  el('line', { x1: TX0, x2: TX1, y1: TY, y2: TY, stroke: '#a9b2c4', 'stroke-opacity': 0.5 }, linea);
  [0, 365].forEach((t, i) => texto(linea, tX(t), TY + 36, String(2026 + i), { 'font-size': 14 }));
  eventos.forEach((e) => {
    const arriba = e.tipo === 'nueva';
    el('line', {
      x1: tX(e.t), x2: tX(e.t), y1: TY, y2: arriba ? TY - (e.eclipse ? 18 : 8) : TY + (e.eclipse ? 18 : 8),
      stroke: e.eclipse ? (arriba ? '#f2cf72' : '#e07a52') : '#a9b2c4', 'stroke-width': e.eclipse ? 3 : 1, 'stroke-opacity': e.eclipse ? 1 : 0.5,
    }, linea);
  });
  const cursor = el('line', { y1: TY - 24, y2: TY + 24, stroke: '#ebe5d5', 'stroke-width': 1.5 }, linea);
  texto(linea, TX1, 778, 'en color: con eclipse', { 'text-anchor': 'end', 'font-size': 14, fill: '#f2cf72' });

  // ---------- Controles ----------
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = `<span>Fecha</span><input type="range" min="0" max="${DIAS}" step="0.25" value="40" aria-label="Fecha, del 1 de enero de 2026 al 31 de diciembre de 2027">`;
  const entrada = rango.querySelector('input');
  const saltar = (dir) => {
    const t = +entrada.value;
    const sig = dir > 0 ? eventos.find((e) => e.eclipse && e.t > t + 0.5) : [...eventos].reverse().find((e) => e.eclipse && e.t < t - 0.5);
    if (sig) { entrada.value = sig.t; fijar(sig.t); }
  };
  const bPrev = boton('◀ Eclipse anterior', () => saltar(-1));
  const bSig = boton('Eclipse siguiente ▶', () => saltar(1));
  const bPlay = boton('▶ Avanzar', () => { if (anim.activo) { anim.pausar(); bPlay.textContent = '▶ Avanzar'; } else { anim.reanudar(); bPlay.textContent = '❚❚ Pausa'; } });
  barra.append(dato, rango, bPrev, bSig, bPlay);

  function fijar(t) {
    const c = cielo(t);
    // 1. Tira del cielo centrada en el Sol
    const centro = c.sol;
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const lon = centro - 180 + i * 3;
      const b = INCL * Math.sin((lon - c.nodo) * RAD);
      d += `${i ? 'L' : 'M'}${lonX(lon, centro).toFixed(1)} ${(YE - b * ESC).toFixed(1)}`;
    }
    caminoLuna.setAttribute('d', d);
    [c.nodo, c.nodo + 180].forEach((n, i) => nodos[i].setAttribute('transform', `translate(${lonX(n, centro).toFixed(1)} ${YE})`));
    sol1.setAttribute('cx', lonX(c.sol, centro)); sol1.setAttribute('cy', YE);
    antiSol.setAttribute('cx', lonX(c.sol + 180, centro) - 2); antiSol.setAttribute('cy', YE);
    luna1.setAttribute('cx', lonX(c.luna, centro)); luna1.setAttribute('cy', YE - c.lat * ESC);
    rotCamino.setAttribute('y', YE + (Math.sin((centro - 180 - c.nodo) * RAD) > 0 ? 52 : -44));

    // 2. Globo: la Tierra en su órbita, vista con perspectiva
    const aT = (c.sol + 180) * RAD;                    // la Tierra está en el lado opuesto al Sol
    const T = { x: SC.x + RX * Math.cos(aT), y: SC.y + RY * Math.sin(aT) };
    tierra.setAttribute('cx', T.x); tierra.setAttribute('cy', T.y);
    rotTierra.setAttribute('x', T.x); rotTierra.setAttribute('y', T.y + (T.y > SC.y ? -16 : 28));
    const rl = 72, ry = rl * RY / RX, alza = 30;        // órbita lunar con su inclinación exagerada
    const punto = (lon) => {
      const z = Math.sin((lon - c.nodo) * RAD) * alza;
      return { x: T.x + rl * Math.cos(lon * RAD), y: T.y + ry * Math.sin(lon * RAD) - z, z };
    };
    let arr = '', ab = '';
    for (let i = 0; i <= 72; i++) {
      const lon = c.nodo + i * 5, p = punto(lon);
      const seg = `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      if (i <= 36) arr += `${i ? 'L' : 'M'}${seg}`; else ab += `${i === 37 ? 'M' + punto(c.nodo + 180).x.toFixed(1) + ' ' + punto(c.nodo + 180).y.toFixed(1) + 'L' : 'L'}${seg}`;
    }
    orbLunaArr.setAttribute('d', arr); orbLunaAb.setAttribute('d', ab);
    const n1 = punto(c.nodo), n2 = punto(c.nodo + 180);
    lineaNodos.setAttribute('x1', n1.x); lineaNodos.setAttribute('y1', n1.y); lineaNodos.setAttribute('x2', n2.x); lineaNodos.setAttribute('y2', n2.y);
    const pl = punto(c.luna);
    luna2.setAttribute('cx', pl.x); luna2.setAttribute('cy', pl.y);
    const fx = T.x + (T.x - SC.x) * 0.3, fy = T.y + (T.y - SC.y) * 0.3; // sombra de la Tierra, hacia fuera
    sombraT.setAttribute('x1', T.x); sombraT.setAttribute('y1', T.y); sombraT.setAttribute('x2', fx); sombraT.setAttribute('y2', fy);

    // 3. Plano: ángulo entre el Sol y la Luna sobre el disco (la elongación)
    const aS = -90 * RAD, aL = (-90 - c.elong) * RAD;
    solP.setAttribute('cx', PC.x + 52 * Math.cos(aS)); solP.setAttribute('cy', PC.y + 52 * Math.sin(aS));
    lunaP.setAttribute('cx', PC.x + 40 * Math.cos(aL)); lunaP.setAttribute('cy', PC.y + 40 * Math.sin(aL));

    // 4. Cursor y lectura
    cursor.setAttribute('x1', tX(t)); cursor.setAttribute('x2', tX(t));
    const e = firmado(c.elong);
    const lat = Math.abs(c.lat).toFixed(1).replace('.', ',');
    const lado = c.lat >= 0 ? 'por encima' : 'por debajo';
    let frase;
    if (Math.abs(e) < 7) {
      frase = Math.abs(c.lat) < LIM_SOL
        ? `Luna nueva cerca de un nodo: la Luna está a ${lat}° del camino del Sol y lo tapa. <strong>Eclipse de Sol.</strong>`
        : `Luna nueva, pero la Luna pasa ${lado} del Sol, a ${lat}° de su camino: no hay eclipse.`;
    } else if (Math.abs(Math.abs(e) - 180) < 7) {
      frase = Math.abs(c.lat) < LIM_LUNA
        ? `Luna llena cerca de un nodo: la Luna está a ${lat}° del punto opuesto al Sol. <strong>Eclipse de Luna.</strong>`
        : `Luna llena, pero la Luna pasa ${lado} del punto opuesto al Sol, a ${lat}°: no hay eclipse.`;
    } else {
      frase = `Fuera de la luna nueva y la llena. La Luna está a ${lat}° del camino del Sol.`;
    }
    dato.innerHTML = `<strong>${fecha(t)}.</strong> ${frase}`;
    svg.setAttribute('aria-label', `Esquema de las temporadas de eclipses en el cielo, en el modelo del globo y en el modelo plano. ${dato.textContent}`);
  }

  const anim = bucle(svg, (dt) => {
    let t = +entrada.value + dt * 6;   // seis días por segundo
    if (t > DIAS) t = 0;
    entrada.value = t;
    fijar(t);
  });
  anim.pausar();
  if (sinMovimiento()) bPlay.hidden = true;

  entrada.addEventListener('input', () => fijar(+entrada.value));
  fijar(40);
  return { destruir() { anim.destruir(); } };
}
