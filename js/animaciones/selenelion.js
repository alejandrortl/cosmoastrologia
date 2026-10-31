// Interactivo: la selenelion en dos modelos.
// Arriba, el modelo del globo: el observador en la línea entre el día y la noche, y la luz que
// la atmósfera curva. En medio, lo que ve ese observador hacia el este y hacia el oeste, con los
// valores medios de refracción (34′), paralaje lunar (57′) y radio aparente (16′).
// Abajo, las dos propuestas planas para el eclipse de Luna. Esquemas, no a escala.

import { svgNS, boton, barraControles } from './comun.js';

const W = 640, H = 800;
const REFRACCION = 0.57, PARALAJE = 0.95, RADIO = 0.27, DEPRESION_MONTE = 1.0;
const SUBIDA = 0.2; // grados por minuto que sube el Sol al amanecer en latitudes medias

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
function grupoBotones(etiqueta, opciones, alElegir) {
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', etiqueta);
  const rot = document.createElement('span');
  rot.textContent = `${etiqueta}:`;
  fila.append(rot);
  const botones = opciones.map(([valor, nombre]) => {
    const b = boton(nombre, () => { marcar(valor); alElegir(valor); }, { 'aria-pressed': 'false' });
    b.dataset.valor = valor;
    fila.append(b);
    return b;
  });
  function marcar(valor) { botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === String(valor)))); }
  return { fila, marcar };
}

let contador = 0;

export function selenelion(contenedor) {
  const id = `sel${++contador}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  svg.innerHTML = `<defs>
    <radialGradient id="${id}-sol"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2cf72"/><stop offset="1" stop-color="#f2cf72" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-roja" cx=".42" cy=".4"><stop offset="0" stop-color="#c8643c"/><stop offset="1" stop-color="#6e2416"/></radialGradient>
    <linearGradient id="${id}-cielo" x1="0" x2="1"><stop offset="0" stop-color="#4d79b3"/><stop offset="1" stop-color="#1b2c4f"/></linearGradient>
    <clipPath id="${id}-vista"><rect x="20" y="300" width="${W - 40}" height="150"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="#0f1930"/>`;

  // ---------- Modelo del globo ----------
  const arriba = el('g', {}, svg);
  texto(arriba, 20, 32, 'Modelo del globo (astronomía moderna)', { fill: '#ebe5d5', 'font-size': 19, 'font-weight': 600 });
  const T = { x: 230, y: 175 }, R = 85;
  el('circle', { cx: 30, cy: T.y, r: 46, fill: `url(#${id}-sol)` }, arriba);
  texto(arriba, 30, T.y + 64, 'Sol', { 'text-anchor': 'middle' });
  // Sombra de la Tierra hacia la derecha, con la Luna dentro
  el('path', { d: `M${T.x} ${T.y - R} L${W - 20} ${T.y - 52} L${W - 20} ${T.y + 52} L${T.x} ${T.y + R} Z`, fill: '#05070d', opacity: 0.75 }, arriba);
  el('circle', { cx: 560, cy: T.y, r: 16, fill: `url(#${id}-roja)` }, arriba);
  texto(arriba, 560, T.y + 38, 'Luna en la sombra', { 'text-anchor': 'middle', 'font-size': 13 });
  const capaAire = el('circle', { cx: T.x, cy: T.y, r: R + 9, fill: '#6f9fe0', opacity: 0.22 }, arriba);
  el('circle', { cx: T.x, cy: T.y, r: R, fill: '#1c2c4c' }, arriba);
  el('path', { d: `M${T.x} ${T.y - R} A${R} ${R} 0 0 0 ${T.x} ${T.y + R} Z`, fill: '#6f9fe0' }, arriba);
  texto(arriba, T.x - 42, T.y + 5, 'día', { 'text-anchor': 'middle', fill: '#0f1930', 'font-weight': 600 });
  texto(arriba, T.x + 42, T.y + 5, 'noche', { 'text-anchor': 'middle', fill: '#a9b2c4' });
  // Observador en la línea entre el día y la noche, con su horizonte
  const O = { x: T.x, y: T.y - R };
  el('line', { x1: O.x - 150, x2: O.x + 150, y1: O.y, y2: O.y, stroke: '#ebe5d5', 'stroke-opacity': 0.6, 'stroke-dasharray': '3 4' }, arriba);
  texto(arriba, O.x + 152, O.y - 6, 'horizonte', { 'font-size': 13 });
  const rectas = el('g', {}, arriba);
  el('line', { x1: O.x, y1: O.y, x2: O.x - 140, y2: O.y + 22, stroke: '#f2cf72', 'stroke-width': 2 }, rectas);
  el('line', { x1: O.x, y1: O.y, x2: 548, y2: T.y - 8, stroke: '#c8643c', 'stroke-width': 2 }, rectas);
  const curvas = el('g', {}, arriba);
  el('path', { d: `M${O.x - 140} ${O.y + 22} Q ${O.x - 70} ${O.y + 4} ${O.x} ${O.y}`, fill: 'none', stroke: '#f2cf72', 'stroke-width': 2 }, curvas);
  el('path', { d: `M548 ${T.y - 8} Q ${O.x + 110} ${O.y + 6} ${O.x} ${O.y}`, fill: 'none', stroke: '#c8643c', 'stroke-width': 2 }, curvas);
  el('circle', { cx: O.x, cy: O.y, r: 6, fill: '#d4ae5a', stroke: '#0f1930', 'stroke-width': 2 }, arriba);
  texto(arriba, O.x, O.y - 14, 'observador', { 'text-anchor': 'middle', fill: '#f3e6bf', 'font-size': 13 });
  const notaGlobo = texto(arriba, 20, 284, '', { fill: '#f3e6bf', 'font-size': 14 });

  // ---------- Lo que ve el observador ----------
  const vista = el('g', {}, svg);
  const cielo = el('rect', { x: 20, y: 300, width: W - 40, height: 150, fill: `url(#${id}-cielo)` }, vista);
  const astros = el('g', { 'clip-path': `url(#${id}-vista)` }, vista);
  const ESCALA = 55; // píxeles por grado
  const HORIZONTE = 410;
  const fantasmaSol = el('circle', { cx: 150, r: RADIO * ESCALA, fill: 'none', stroke: '#f2cf72', 'stroke-dasharray': '3 3' }, astros);
  const fantasmaLuna = el('circle', { cx: 490, r: RADIO * ESCALA, fill: 'none', stroke: '#c8643c', 'stroke-dasharray': '3 3' }, astros);
  const solV = el('circle', { cx: 150, r: RADIO * ESCALA, fill: '#fff3c4' }, astros);
  const lunaV = el('circle', { cx: 490, r: RADIO * ESCALA, fill: `url(#${id}-roja)` }, astros);
  const suelo = el('rect', { x: 20, width: W - 40, height: 200, fill: '#0b1326' }, astros);
  el('line', { x1: W / 2, x2: W / 2, y1: 300, y2: 450, stroke: '#0f1930', 'stroke-width': 4 }, vista);
  texto(vista, 150, 442, 'mirando al este', { 'text-anchor': 'middle', 'font-size': 13 });
  texto(vista, 490, 442, 'mirando al oeste', { 'text-anchor': 'middle', 'font-size': 13 });
  const notaVista = texto(vista, 20, 474, '', { fill: '#f3e6bf', 'font-size': 14 });

  // ---------- Modelo plano ----------
  const abajo = el('g', {}, svg);
  el('line', { x1: 20, x2: W - 20, y1: 492, y2: 492, stroke: '#8fb0e0', 'stroke-opacity': 0.25 }, abajo);
  texto(abajo, 20, 524, 'Modelo plano', { fill: '#ebe5d5', 'font-size': 19, 'font-weight': 600 });
  const SUELO = 730;
  el('rect', { x: 20, y: SUELO, width: W - 40, height: 12, fill: '#1d3a5f' }, abajo);
  const OP = { x: W / 2, y: SUELO - 6 };
  const S = { x: 110, y: 600 }, L = { x: 530, y: 610 };
  el('line', { x1: OP.x, y1: OP.y, x2: S.x, y2: S.y, stroke: '#f2cf72', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, abajo);
  el('line', { x1: OP.x, y1: OP.y, x2: L.x, y2: L.y, stroke: '#c8643c', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, abajo);
  el('circle', { cx: S.x, cy: S.y, r: 12, fill: '#f2cf72' }, abajo);
  texto(abajo, S.x, S.y - 20, 'Sol', { 'text-anchor': 'middle' });
  el('circle', { cx: L.x, cy: L.y, r: 11, fill: `url(#${id}-roja)` }, abajo);
  texto(abajo, L.x, L.y - 20, 'Luna', { 'text-anchor': 'middle' });
  el('circle', { cx: OP.x, cy: OP.y, r: 6, fill: '#d4ae5a', stroke: '#0f1930', 'stroke-width': 2 }, abajo);
  texto(abajo, OP.x, SUELO + 34, 'observador sobre el plano', { 'text-anchor': 'middle', 'font-size': 13 });
  const propuesta = el('g', {}, abajo);
  const notaPlana = texto(abajo, 20, 792, '', { fill: '#f3e6bf', 'font-size': 14 });

  const PROPUESTAS = {
    objeto: {
      nombre: 'Objeto de sombra (wiki de la Flat Earth Society)',
      dibujar(g) {
        // Un cuerpo no visto entre el Sol y la Luna proyecta su sombra sobre ella
        const P = { x: 330, y: 575 };
        el('path', { d: `M${P.x} ${P.y - 14} L${L.x} ${L.y - 13} L${L.x} ${L.y + 13} L${P.x} ${P.y + 14} Z`, fill: '#05070d', opacity: 0.5 }, g);
        el('circle', { cx: P.x, cy: P.y, r: 14, fill: '#05070d', stroke: '#8fb0e0', 'stroke-dasharray': '3 3' }, g);
        texto(g, P.x, P.y - 22, 'objeto de sombra', { 'text-anchor': 'middle', 'font-size': 13 });
      },
      texto: 'Un cuerpo no visto pasa entre el Sol y la Luna y proyecta su sombra sobre ella.',
    },
    cuerpo: {
      nombre: 'Cuerpo semitransparente (Rowbotham, 1881)',
      dibujar(g) {
        // Un cuerpo oscuro y semitransparente pasa por delante de la Luna, visto desde el suelo
        const P = { x: OP.x + (L.x - OP.x) * 0.8, y: OP.y + (L.y - OP.y) * 0.8 };
        el('circle', { cx: P.x, cy: P.y, r: 15, fill: '#3a1a14', opacity: 0.6, stroke: '#c8643c', 'stroke-dasharray': '3 3' }, g);
        texto(g, P.x - 20, P.y + 36, 'cuerpo semitransparente', { 'text-anchor': 'middle', 'font-size': 13 });
      },
      texto: 'Un cuerpo oscuro y semitransparente pasa por delante de la Luna, entre ella y quien la mira.',
    },
  };

  // ---------- Controles ----------
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const rango = document.createElement('label');
  rango.className = 'control-rango';
  rango.innerHTML = '<span>Minutos</span><input type="range" min="-8" max="6" step="0.1" value="-2" aria-label="Minutos antes o después de que el centro del Sol cruce el horizonte en línea recta">';
  const entrada = rango.querySelector('input');
  const estado = { aire: true, monte: false, plano: 'objeto', t: -2 };
  const gAire = grupoBotones('Atmósfera', [['true', 'Con aire'], ['false', 'Sin aire']], (v) => { estado.aire = v === 'true'; fijar(); });
  const gAltura = grupoBotones('Lugar', [['false', 'Nivel del mar'], ['true', 'Una cima']], (v) => { estado.monte = v === 'true'; fijar(); });
  const gPlano = grupoBotones('Propuesta plana', [['objeto', 'Objeto de sombra'], ['cuerpo', 'Cuerpo de Rowbotham']], (v) => { estado.plano = v; fijar(); });
  barra.append(dato, rango, gAire.fila, gAltura.fila, gPlano.fila);
  gAire.marcar('true'); gAltura.marcar('false'); gPlano.marcar('objeto');

  function fijar() {
    const { aire, monte, t } = estado;
    // Alturas en grados: la del Sol en línea recta y la de la Luna, en el centro de la sombra,
    // rebajada por la paralaje. La refracción eleva las dos imágenes.
    const solGeo = t * SUBIDA;
    const lunaGeo = -solGeo - PARALAJE;
    const ref = aire ? REFRACCION : 0;
    const depresion = monte ? DEPRESION_MONTE : 0;
    const solAp = solGeo + ref, lunaAp = lunaGeo + ref;
    const veSol = solAp + RADIO > -depresion, veLuna = lunaAp + RADIO > -depresion;

    const y = (alt) => HORIZONTE - (alt + depresion) * ESCALA; // el horizonte baja si se sube
    suelo.setAttribute('y', HORIZONTE);
    solV.setAttribute('cy', y(solAp)); lunaV.setAttribute('cy', y(lunaAp));
    fantasmaSol.setAttribute('cy', y(solGeo)); fantasmaLuna.setAttribute('cy', y(lunaGeo));
    fantasmaSol.setAttribute('opacity', aire ? 0.8 : 0); fantasmaLuna.setAttribute('opacity', aire ? 0.8 : 0);
    cielo.setAttribute('opacity', solAp > -0.8 ? 1 : 0.5);
    rectas.setAttribute('opacity', aire ? 0.25 : 1);
    curvas.setAttribute('opacity', aire ? 1 : 0);
    capaAire.setAttribute('opacity', aire ? 0.22 : 0);

    notaGlobo.textContent = aire
      ? 'Con aire: la luz rasante se curva y llega por encima del horizonte'
      : 'Sin aire: en línea recta, los dos no pueden estar sobre el horizonte';
    const ambos = veSol && veLuna;
    notaVista.textContent = ambos ? 'Se ven los dos a la vez: selenelion'
      : veSol ? 'Solo se ve el Sol: la Luna ya se ha puesto'
        : veLuna ? 'Solo se ve la Luna: el Sol aún no ha salido' : 'No se ve ninguno de los dos';

    const p = PROPUESTAS[estado.plano];
    propuesta.innerHTML = '';
    p.dibujar(propuesta);
    notaPlana.textContent = 'El Sol y la Luna siempre están sobre el plano, en lados opuestos del cielo.';

    dato.innerHTML = `<strong>${notaVista.textContent}.</strong> Según el modelo del globo, el Sol está a ${solGeo.toFixed(1).replace('.', ',')}° del horizonte en línea recta y la Luna a ${lunaGeo.toFixed(1).replace('.', ',')}°` +
      `${aire ? `, y la refracción eleva cada imagen unos ${REFRACCION.toFixed(2).replace('.', ',')}°` : ', sin refracción'}` +
      `${monte ? '; desde la cima, el horizonte queda 1° más bajo' : ''}. ` +
      `Según el modelo plano, propuesta «${p.nombre}»: ${p.texto}`;
    svg.setAttribute('aria-label', `Esquema de dos modelos de la selenelion. ${dato.textContent}`);
  }

  entrada.addEventListener('input', () => { estado.t = +entrada.value; fijar(); });
  fijar();
  return { destruir() {} };
}
