// Interactivo: aprender a reconocer las figuras del cielo y ponerse a prueba.
// Modo «Aprender»: se elige una figura y se ve primero solo con sus estrellas, como en el cielo,
// y después con sus líneas y con cómo encontrarla. Modo «Ponte a prueba»: aparecen las estrellas
// de una figura al azar y hay que adivinar cuál es.
// Estrellas y líneas: d3-celestial de Olaf Frohn (catálogo Hipparcos). Mapa con el norte arriba y
// el este a la izquierda, como se ve el cielo al mirar hacia arriba. Es observación: sirve igual
// en cualquier modelo del mundo.

import { svgNS, boton, barraControles } from './comun.js';
import { cielo } from '../datos/cielo.js';

const W = 640, H = 460;
const rad = (g) => (g * Math.PI) / 180;
const fuente = { 'font-family': 'IBM Plex Sans, system-ui, sans-serif' };

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

// Cuándo se ve mejor a primera hora de la noche y cómo encontrarla
const FIGURAS = {
  UMa: ['Todo el año desde el hemisferio norte; alta en primavera', 'Siete estrellas brillantes en forma de cazo con su mango: el Carro. Las dos del extremo del cazo, Merak y Dubhe, señalan a Polaris.'],
  UMi: ['Todo el año desde el hemisferio norte', 'Un carro pequeño y débil. Polaris es la punta de su mango; Kochab y Pherkad, «las guardas», el otro extremo.'],
  Cas: ['Todo el año desde el hemisferio norte; alta en otoño', 'Una W o una M, según la hora, al otro lado de Polaris respecto al Carro.'],
  Ori: ['De diciembre a marzo, desde los dos hemisferios', 'Un gran rectángulo con Betelgeuse, rojiza, y Rigel, azulada, en esquinas opuestas, y las Tres Marías en el centro.'],
  Tau: ['De diciembre a febrero', 'Sigue el cinturón de Orión hacia el noroeste: Aldebarán, anaranjada, en la punta de una V de estrellas. Más allá, las Pléyades.'],
  Gem: ['De enero a marzo', 'Dos estrellas brillantes y parecidas, Cástor y Pólux, al noreste de Orión, cada una a la cabeza de una fila de estrellas.'],
  CMa: ['De diciembre a marzo', 'Sigue el cinturón de Orión hacia el sudeste hasta Sirio, la estrella más brillante de la noche.'],
  CMi: ['De enero a abril', 'Casi solo dos estrellas: Proción, brillante, y Gomeisa. Proción forma con Sirio y Betelgeuse el triángulo de invierno.'],
  Aur: ['De diciembre a marzo; alta desde el norte', 'Un pentágono de estrellas encima de Orión, con Capela, muy brillante y amarillenta, en una esquina.'],
  Leo: ['De marzo a mayo', 'Una hoz, o un signo de interrogación al revés, con Régulo en la base, y un triángulo detrás con Denébola en la cola.'],
  Boo: ['De abril a julio', 'Una cometa o un cucurucho de helado con Arturo, anaranjada, en la punta. Se llega siguiendo la curva del mango del Carro.'],
  Vir: ['De abril a junio', 'Grande y poco marcada. Lo más visible es Espiga, al final del arco que sale del Carro y pasa por Arturo.'],
  CrB: ['De mayo a agosto', 'Un semicírculo pequeño de estrellas entre Arturo y Vega.'],
  Her: ['De junio a septiembre', 'Un trapecio de estrellas no muy brillantes entre Vega y la Corona Boreal.'],
  Lyr: ['De junio a octubre; alta desde el norte', 'Vega, blanco azulada y muy brillante, con un pequeño paralelogramo de estrellas al lado.'],
  Cyg: ['De julio a noviembre', 'Una gran cruz, la «Cruz del Norte», a lo largo de la Vía Láctea, con Deneb en la cola.'],
  Aql: ['De julio a octubre', 'Altair, brillante, entre dos estrellas más débiles en línea. Con Vega y Deneb forma el triángulo de verano.'],
  Sco: ['De junio a agosto; muy alta desde el sur', 'Una cola curvada como la de un escorpión, con Antares, roja, en el corazón.'],
  Sgr: ['De julio a septiembre', 'Al este de Escorpio, ocho estrellas en forma de tetera, con la Vía Láctea saliendo del pico.'],
  Peg: ['De septiembre a diciembre', 'El Gran Cuadrado: cuatro estrellas muy separadas con casi nada dentro. Una esquina, Alpheratz, es de Andrómeda.'],
  And: ['De octubre a enero', 'Dos filas de estrellas que salen de una esquina del Cuadrado de Pegaso. Junto a ellas, desde un lugar oscuro, la galaxia de Andrómeda.'],
  Per: ['De octubre a marzo', 'Un arco de estrellas entre Casiopea y las Pléyades, con Mirfak y Algol, la estrella que cambia de brillo.'],
  Cru: ['Todo el año desde latitudes como Buenos Aires; mejor de marzo a septiembre', 'Cuatro estrellas brillantes en forma de cometa pequeña. Su palo largo señala hacia el polo sur celeste.'],
  Cen: ['Todo el año desde el sur lejano; mejor de marzo a julio', 'Una figura enorme alrededor de la Cruz. Alfa y Beta Centauri, muy brillantes, son los punteros de la Cruz.'],
  Car: ['De diciembre a mayo, desde el sur', 'Canopo, la segunda estrella más brillante de la noche, y una larga quilla de barco hacia la Cruz del Sur.'],
  Vel: ['De enero a mayo, desde el sur', 'Las velas del antiguo Navío Argos. Dos de sus estrellas y dos de la Quilla forman la Falsa Cruz.'],
  TrA: ['Todo el año desde el sur lejano', 'Un triángulo claro de tres estrellas, cerca de los punteros de Centauro.'],
  PsA: ['De septiembre a noviembre', 'Fomalhaut, brillante y muy sola en su zona del cielo, al sur de Acuario.'],
  Ari: ['De octubre a enero', 'Tres estrellas en un arco corto entre las Pléyades y el Cuadrado de Pegaso; la más brillante es Hamal.'],
  Cnc: ['De febrero a abril', 'Muy débil, entre Pólux y Régulo. En el centro, desde un lugar oscuro, una manchita: el Pesebre.'],
  Lib: ['De mayo a julio', 'Entre Espiga y Antares. Sus dos estrellas principales eran antes las pinzas del Escorpión.'],
  Oph: ['De junio a agosto', 'Un gran pentágono alargado encima de Escorpio. La eclíptica cruza su parte sur.'],
  Cap: ['De agosto a octubre', 'Un triángulo grande y débil, como una sonrisa, al sur de Altair.'],
  Aqr: ['De septiembre a noviembre', 'Débil y extensa, al sur de Pegaso; lo más reconocible es la Y del Cántaro.'],
  Psc: ['De octubre a diciembre', 'Una cadena de estrellas débiles que rodea Pegaso por el sur y el este, con un anillo, «el Círculo».'],
};

const GRUPOS = [
  { id: 'primeras', nombre: 'Primeras figuras', ids: ['UMa', 'UMi', 'Cas', 'Ori', 'Tau', 'Gem', 'CMa', 'CMi', 'Aur', 'Leo', 'Boo', 'Vir', 'CrB', 'Her', 'Lyr', 'Cyg', 'Aql', 'Sco', 'Sgr', 'Peg', 'And', 'Per'] },
  { id: 'zodiaco', nombre: 'Zodiaco', ids: ['Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Oph', 'Sgr', 'Cap', 'Aqr', 'Psc'] },
  { id: 'sur', nombre: 'Cielo del sur', ids: ['Cru', 'Cen', 'Car', 'Vel', 'TrA', 'Sco', 'Sgr', 'CMa', 'PsA', 'Ori'] },
];

export function figurasCielo(contenedor) {
  const datos = cielo();
  const porId = Object.fromEntries(datos.constelaciones.map((c) => [c.id, c]));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);

  let modo = 'aprender', grupo = GRUPOS[0], actual = porId.UMa, conLineas = false, respondida = false;

  function proyeccion(k) {
    const pts = k.lineas.flat();
    let x = 0, y = 0, z = 0;
    pts.forEach(([ra, dec]) => { x += Math.cos(rad(dec)) * Math.cos(rad(ra)); y += Math.cos(rad(dec)) * Math.sin(rad(ra)); z += Math.sin(rad(dec)); });
    const ra0 = (Math.atan2(y, x) * 180) / Math.PI, dec0 = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
    const est = (ra, dec) => {
      const c = Math.sin(rad(dec0)) * Math.sin(rad(dec)) + Math.cos(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0));
      const f = 2 / (1 + c);
      return [f * Math.cos(rad(dec)) * Math.sin(rad(ra - ra0)), f * (Math.cos(rad(dec0)) * Math.sin(rad(dec)) - Math.sin(rad(dec0)) * Math.cos(rad(dec)) * Math.cos(rad(ra - ra0))), c];
    };
    const xy = pts.map(([ra, dec]) => est(ra, dec));
    // Campo mínimo de unos 14° a cada lado, para que las figuras pequeñas no parezcan enormes
    const ancho = Math.max(0.25, ...xy.map((p) => Math.abs(p[0]))), alto = Math.max(0.2, ...xy.map((p) => Math.abs(p[1])));
    const s = Math.min((W / 2 - 50) / ancho, (H / 2 - 40) / alto);
    return (ra, dec) => { const [px, py, c] = est(ra, dec); return { x: W / 2 - px * s, y: H / 2 - py * s, visible: c > 0 }; };
  }

  function dibujar() {
    svg.innerHTML = '';
    const k = actual, proy = proyeccion(k);
    el('rect', { width: W, height: H, fill: '#0b1326' }, svg);
    const enCampo = (p) => p.visible && p.x > -10 && p.x < W + 10 && p.y > -10 && p.y < H + 10;
    if (conLineas) {
      // Las vecinas, muy tenues, para ver qué tiene alrededor
      const vecinas = el('g', { stroke: '#8fb0e0', 'stroke-opacity': 0.13, 'stroke-width': 1, fill: 'none' }, svg);
      for (const otra of datos.constelaciones) {
        if (otra.id === k.id) continue;
        for (const poli of otra.lineas) {
          const pts = poli.map(([ra, dec]) => proy(ra, dec));
          if (!pts.every(enCampo)) continue;
          el('polyline', { points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') }, vecinas);
        }
      }
      const g = el('g', { stroke: '#d4ae5a', 'stroke-opacity': 0.85, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round' }, svg);
      for (const poli of k.lineas) {
        const pts = poli.map(([ra, dec]) => proy(ra, dec));
        el('polyline', { points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') }, g);
      }
    }
    const g = el('g', {}, svg);
    for (const st of datos.estrellas) {
      const p = proy(st.ra, st.dec);
      if (!enCampo(p)) continue;
      const tinte = st.bv > 1.2 ? '#ffc9a0' : st.bv > 0.7 ? '#ffe3b8' : st.bv < 0.1 ? '#d8e4ff' : '#f3ecd8';
      el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: Math.max(0.9, 4.6 - st.mag * 0.85).toFixed(2), fill: tinte, opacity: Math.min(1, 1.1 - st.mag * 0.12).toFixed(2) }, g);
    }
    if (conLineas) {
      const puestos = []; // no poner dos nombres encima uno de otro (van de más a menos brillante)
      for (const s of datos.conNombre) {
        const p = proy(s.ra, s.dec);
        if (!enCampo(p) || p.x < 20 || p.x > W - 20 || p.y < 20 || p.y > H - 10) continue;
        if (puestos.some((q) => Math.abs(q.x - p.x) < 70 && Math.abs(q.y - p.y) < 18)) continue;
        puestos.push(p);
        const izq = p.x > W * 0.75;
        const t = el('text', { x: p.x + (izq ? -10 : 10), y: p.y - 7, 'font-size': 13, fill: '#f5dea0', 'text-anchor': izq ? 'end' : 'start', ...fuente }, svg);
        t.textContent = s.nombre;
      }
      const t = el('text', { x: 18, y: 32, 'font-size': 20, 'font-weight': 600, fill: '#ebe5d5', ...fuente }, svg);
      t.textContent = k.nombre;
    }
    const r = el('g', { transform: `translate(${W - 34} ${H - 34})`, ...fuente, 'font-size': 12, fill: '#a9b2c4', 'text-anchor': 'middle' }, svg);
    el('path', { d: 'M0 -14 L0 14 M-14 0 L14 0', stroke: '#a9b2c4', 'stroke-opacity': 0.5 }, r);
    el('text', { x: 0, y: -19 }, r).textContent = 'N';
    el('text', { x: -22, y: 4 }, r).textContent = 'E';
    svg.setAttribute('aria-label', conLineas ? `Mapa de ${k.nombre} con sus líneas. ${FIGURAS[k.id][1]}` : 'Mapa de estrellas de una figura, sin líneas.');
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = (etiqueta) => { const f = document.createElement('div'); f.className = 'grupo-botones'; f.setAttribute('role', 'group'); f.setAttribute('aria-label', etiqueta); return f; };
  const filaModo = fila('Modo'), filaGrupo = fila('Grupo de figuras'), filaFiguras = fila('Figura'), filaAccion = fila('Acciones');
  const bModos = [['aprender', 'Aprender'], ['prueba', 'Ponte a prueba']].map(([id, t]) => {
    const b = boton(t, () => { modo = id; empezar(); }, { 'aria-pressed': 'false' }); b.dataset.id = id; return b;
  });
  filaModo.append(...bModos);
  const bGrupos = GRUPOS.map((gr) => { const b = boton(gr.nombre, () => { grupo = gr; empezar(); }, { 'aria-pressed': 'false' }); b.dataset.id = gr.id; return b; });
  filaGrupo.append(...bGrupos);
  barra.append(dato, filaModo, filaGrupo, filaFiguras, filaAccion);

  function marcar(botones, id) { botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id))); }

  function explicar() {
    const [cuando, como] = FIGURAS[actual.id];
    return `<strong>${actual.nombre}.</strong> ${como} <em>Cuándo verla:</em> ${cuando.charAt(0).toLowerCase() + cuando.slice(1)}.`;
  }

  function aprender(k) {
    actual = k; conLineas = false;
    marcar(filaFiguras.querySelectorAll('button'), k.id);
    dibujar();
    dato.innerHTML = `Así se ve <strong>${k.nombre}</strong> en el cielo, solo con sus estrellas. ¿Distingues la figura? Pulsa «Ver la figura» para ver sus líneas y cómo encontrarla.`;
    pintarAccion();
  }

  function pintarAccion() {
    filaAccion.innerHTML = '';
    if (modo === 'aprender') {
      filaAccion.append(boton(conLineas ? 'Solo estrellas' : 'Ver la figura', () => {
        conLineas = !conLineas; dibujar();
        dato.innerHTML = conLineas ? explicar() : `Así se ve <strong>${actual.nombre}</strong> en el cielo, solo con sus estrellas.`;
        pintarAccion();
      }));
    } else if (respondida) {
      filaAccion.append(boton('Otra figura', pregunta));
    }
  }

  let aciertos = 0, intentos = 0, ultima = null;
  function pregunta() {
    const ids = grupo.ids.filter((id) => id !== ultima);
    const id = ids[Math.floor(Math.random() * ids.length)];
    ultima = id; actual = porId[id]; conLineas = false; respondida = false;
    const otras = grupo.ids.filter((x) => x !== id).sort(() => Math.random() - 0.5).slice(0, 3);
    const opciones = [id, ...otras].sort(() => Math.random() - 0.5);
    filaFiguras.innerHTML = '';
    opciones.forEach((op) => {
      const b = boton(porId[op].nombre, () => responder(op, b));
      b.dataset.id = op;
      filaFiguras.append(b);
    });
    dibujar();
    dato.innerHTML = `¿Qué figura forman estas estrellas? Elige una de las cuatro.${intentos ? ` Llevas ${aciertos} de ${intentos}.` : ''}`;
    pintarAccion();
  }

  function responder(op, b) {
    if (respondida) return;
    respondida = true; intentos++;
    const bien = op === actual.id;
    if (bien) aciertos++;
    filaFiguras.querySelectorAll('button').forEach((x) => { x.disabled = true; if (x.dataset.id === actual.id) x.setAttribute('aria-pressed', 'true'); });
    if (!bien) b.classList.add('fallo');
    conLineas = true; dibujar();
    dato.innerHTML = `${bien ? '¡Correcto!' : `No: es <strong>${actual.nombre}</strong>.`} ${explicar()} Llevas ${aciertos} de ${intentos}.`;
    pintarAccion();
  }

  function empezar() {
    marcar(bModos, modo); marcar(bGrupos, grupo.id);
    filaFiguras.innerHTML = '';
    if (modo === 'aprender') {
      filaFiguras.append(...grupo.ids.map((id) => { const b = boton(porId[id].nombre, () => aprender(porId[id]), { 'aria-pressed': 'false' }); b.dataset.id = id; return b; }));
      aprender(porId[grupo.ids.includes(actual.id) ? actual.id : grupo.ids[0]]);
    } else {
      aciertos = 0; intentos = 0;
      pregunta();
    }
  }

  empezar();
  return { destruir() {} };
}
