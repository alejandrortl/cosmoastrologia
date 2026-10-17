// Interactivo: las constelaciones de cada estación. El cielo a las 22:00 (hora solar) de mediados
// de enero, abril, julio y octubre, visto desde una latitud media del norte (40° N, como Madrid)
// o del sur (34° S, como Buenos Aires o Santiago), con las figuras más fáciles resaltadas.
// Es observación. Estrellas y constelaciones: d3-celestial (Hipparcos).

import { boton, barraControles, escalaLetra } from './comun.js';
import { cielo } from '../datos/cielo.js';
import { sidereoLocal, horizontales, rumbo } from '../astro.js';
import { enManos } from './medir-mano.js';

const rad = (g) => (g * Math.PI) / 180;
const MESES = [['enero', 0], ['abril', 3], ['julio', 6], ['octubre', 9]];
const ESTACION = {
  0: ['invierno', 'verano'], 3: ['primavera', 'otoño'], 6: ['verano', 'invierno'], 9: ['otoño', 'primavera'],
};
const HEMIS = {
  norte: { lat: 40, nombre: 'hemisferio norte (40° N, como Madrid)' },
  sur: { lat: -34, nombre: 'hemisferio sur (34° S, como Buenos Aires o Santiago)' },
};
// Figuras y estrellas que conviene buscar en cada momento
const GUIA = {
  norte: {
    0: { figuras: ['Ori', 'Tau', 'Gem', 'CMa', 'CMi', 'Aur'], estrellas: ['Betelgeuse', 'Rigel', 'Sirio', 'Aldebarán', 'Pléyades', 'Capela', 'Pólux', 'Cástor', 'Proción'],
      nota: 'Es el cielo más brillante del año. Orión domina el sur; Sirio, la estrella más brillante de la noche, brilla bajo él.' },
    3: { figuras: ['Leo', 'Vir', 'Boo', 'UMa', 'Cnc'], estrellas: ['Régulo', 'Denébola', 'Espiga', 'Arturo', 'Dubhe', 'Merak', 'Alkaid'],
      nota: 'El Carro está casi encima de la cabeza. Leo, con su «hoz» invertida, ocupa el sur, y Arturo sube por el este.' },
    6: { figuras: ['Lyr', 'Cyg', 'Aql', 'Sco', 'Sgr', 'Her', 'Boo'], estrellas: ['Vega', 'Deneb', 'Altair', 'Antares', 'Arturo'],
      nota: 'El triángulo de verano está muy alto. Escorpio, con la rojiza Antares, se arrastra bajo por el sur, y la Vía Láctea cruza el cielo si estás lejos de las luces.' },
    9: { figuras: ['Peg', 'And', 'Cas', 'Per', 'Psc', 'Aqr', 'PsA', 'Cyg'], estrellas: ['Alpheratz', 'Schedar', 'Caph', 'Mirfak', 'Fomalhaut', 'Deneb', 'Vega', 'Altair'],
      nota: 'El gran cuadrado de Pegaso preside el cielo. Casiopea, con forma de W, está alta al norte, y Fomalhaut brilla sola y baja al sur.' },
  },
  sur: {
    0: { figuras: ['Ori', 'CMa', 'Tau', 'Car', 'Eri', 'Gem'], estrellas: ['Sirio', 'Canopo', 'Rigel', 'Betelgeuse', 'Aldebarán', 'Achernar', 'Pléyades'],
      nota: 'Orión está alto al norte y se ve «cabeza abajo» respecto a como lo dibujan los mapas del norte; su cinturón son las Tres Marías. Sirio y Canopo, las dos estrellas más brillantes de la noche, están casi encima.' },
    3: { figuras: ['Cru', 'Cen', 'Car', 'Vel', 'Leo', 'Vir', 'Hya'], estrellas: ['Ácrux', 'Gácrux', 'Mimosa', 'Alfa Centauri', 'Beta Centauri', 'Canopo', 'Régulo', 'Espiga'],
      nota: 'La Cruz del Sur está de pie, alta sobre el sur, con los punteros de Centauro a su lado. Es el mejor momento del año para usarla de brújula.' },
    6: { figuras: ['Sco', 'Sgr', 'Cen', 'Cru', 'Lup', 'TrA', 'Oph'], estrellas: ['Antares', 'Alfa Centauri', 'Beta Centauri', 'Ácrux', 'Arturo', 'Altair'],
      nota: 'Escorpio pasa casi por encima de la cabeza, y en su cola empieza la parte más brillante de la Vía Láctea, hacia Sagitario.' },
    9: { figuras: ['Gru', 'PsA', 'Phe', 'Tuc', 'Peg', 'Aqr', 'Eri'], estrellas: ['Fomalhaut', 'Achernar', 'Alpheratz', 'Altair'],
      nota: 'Es un cielo de estrellas más débiles. Fomalhaut está casi encima; al sur se ven las dos Nubes de Magallanes, dos manchas de luz como trozos sueltos de Vía Láctea.' },
  },
};

function colorEstrella(bv) {
  if (bv < 0) return [190, 210, 255];
  if (bv < 0.4) return [235, 240, 255];
  if (bv < 0.8) return [255, 246, 228];
  if (bv < 1.2) return [255, 222, 180];
  return [255, 196, 150];
}

export function cieloEstaciones(contenedor) {
  const datos = cielo();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  contenedor.append(canvas);

  let hemi = 'norte', mes = (() => { const m = new Date().getMonth(); return [0, 3, 6, 9].reduce((a, b) => (Math.abs(((m - b + 18) % 12) - 6) > Math.abs(((m - a + 18) % 12) - 6) ? b : a)); })();
  let mira = 180;
  let ctx, ancho, alto, dpr, R, CX, CY;

  function preparar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.parentElement.clientWidth;
    const lado = Math.min(ancho, 600);
    R = Math.max(20, lado / 2 - (Math.round(26 * escalaLetra()) + 10));
    alto = lado;
    CX = ancho / 2; CY = alto / 2;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    canvas.style.height = `${alto}px`;
    ctx = canvas.getContext('2d');
  }
  function proyectar(alt, az) {
    const r = R * Math.tan(rad(90 - alt) / 2);
    const f = rad(az - mira);
    return { x: CX + r * Math.sin(f), y: CY + r * Math.cos(f), r };
  }
  const letra = (tam, peso = 500) => { ctx.font = `${peso} ${Math.round(tam * escalaLetra())}px "IBM Plex Sans", system-ui, sans-serif`; };

  function dibujar() {
    const { lat } = HEMIS[hemi];
    const guia = GUIA[hemi][mes];
    const fecha = new Date(Date.UTC(2027, mes, 15, 22, 0));
    const lst = sidereoLocal(fecha, 0);
    const hz = (ra, dec) => horizontales(ra, dec, lst, lat);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b1326'; ctx.fillRect(0, 0, ancho, alto);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    g.addColorStop(0, '#0a1226'); g.addColorStop(1, '#16223f');
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.clip();

    ctx.strokeStyle = 'rgba(169,196,234,.14)'; ctx.lineWidth = 1;
    for (const a of [30, 60]) { const p = proyectar(a, 0); ctx.beginPath(); ctx.arc(CX, CY, p.r, 0, Math.PI * 2); ctx.stroke(); }

    // Figuras: las de la estación, resaltadas; el resto, tenues
    for (const k of datos.constelaciones) {
      const resaltada = guia.figuras.includes(k.id);
      ctx.strokeStyle = resaltada ? 'rgba(232,207,138,.75)' : 'rgba(143,176,224,.2)';
      ctx.lineWidth = resaltada ? 1.6 : 1;
      for (const poli of k.lineas) {
        ctx.beginPath();
        let ab = false;
        for (const [ra, dec] of poli) {
          const h = hz(ra, dec);
          if (h.alt < -1) { ab = false; continue; }
          const p = proyectar(h.alt, h.az);
          if (ab) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); ab = true; }
        }
        ctx.stroke();
      }
    }
    for (const st of datos.estrellas) {
      const h = hz(st.ra, st.dec);
      if (h.alt < 0) continue;
      const p = proyectar(h.alt, h.az);
      const [r, gg, b] = colorEstrella(st.bv);
      const ext = h.alt < 10 ? 0.45 + h.alt * 0.055 : 1;
      ctx.fillStyle = `rgba(${r},${gg},${b},${Math.min(1, 1.15 - st.mag * 0.12) * ext})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.7, 3.4 - st.mag * 0.62) * (R / 280), 0, Math.PI * 2); ctx.fill();
    }
    // Nombres de las figuras resaltadas
    const lista = [];
    // Para no amontonar rótulos: se salta el que pisaría a otro ya escrito
    const ocupados = [];
    const cabe = (x, y, w, h) => {
      const r = [x - 2, y - h, x + w + 2, y + 3];
      if (ocupados.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return false;
      ocupados.push(r); return true;
    };
    letra(12.5, 600); ctx.textAlign = 'center';
    // En el orden de la guía: las primeras son las más importantes y no se saltan
    for (const k of guia.figuras.map((id) => datos.constelaciones.find((c) => c.id === id)).filter(Boolean)) {
      const h = hz(k.ra, k.dec);
      lista.push({ nombre: k.nombre, ...h });
      if (h.alt < 4) continue;
      const p = proyectar(h.alt, h.az);
      const w = ctx.measureText(k.nombre).width;
      if (!cabe(p.x - w / 2, p.y, w, 13 * escalaLetra())) continue;
      ctx.fillStyle = 'rgba(243,230,191,.95)';
      ctx.fillText(k.nombre, p.x, p.y);
    }
    // Estrellas guía
    letra(11, 500);
    for (const n of guia.estrellas) {
      const st = datos.conNombre.find((s) => s.nombre === n);
      if (!st) continue;
      const h = hz(st.ra, st.dec);
      if (h.alt < 2) continue;
      const p = proyectar(h.alt, h.az);
      const izq = p.x > CX + R * 0.55;
      const w = ctx.measureText(n).width, x0 = izq ? p.x - 6 - w : p.x + 6;
      if (!cabe(x0, p.y - 5, w, 11 * escalaLetra())) continue;
      ctx.textAlign = izq ? 'right' : 'left';
      ctx.fillStyle = 'rgba(245,222,160,.85)';
      ctx.fillText(n, p.x + (izq ? -6 : 6), p.y - 5);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(169,196,234,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    letra(13, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [n, az] of [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]]) {
      const f = rad(az - mira), rr = R + 14 * escalaLetra();
      ctx.fillStyle = n.length === 1 ? '#ebe5d5' : 'rgba(169,178,196,.8)';
      ctx.fillText(n, CX + rr * Math.sin(f), CY + rr * Math.cos(f));
    }
    ctx.textBaseline = 'alphabetic';
    return lista;
  }

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const detalle = document.createElement('p');
  detalle.className = 'lectura-dato';
  const fH = document.createElement('div'); fH.className = 'grupo-botones';
  const bH = Object.keys(HEMIS).map((h) => { const b = boton(`Hemisferio ${h}`, () => { hemi = h; mira = 180; actualizar(); }); b.dataset.h = h; return b; });
  fH.append(...bH);
  const fM = document.createElement('div'); fM.className = 'grupo-botones';
  const bM = MESES.map(([n, m]) => { const b = boton(n[0].toUpperCase() + n.slice(1), () => { mes = m; actualizar(); }); b.dataset.m = m; return b; });
  fM.append(...bM);
  const fMira = document.createElement('div'); fMira.className = 'grupo-botones';
  const tMira = document.createElement('span'); tMira.textContent = 'Miro hacia el:';
  const bMira = [['norte', 0], ['sur', 180]].map(([n, az]) => { const b = boton(n, () => { mira = az; actualizar(); }); b.dataset.az = az; return b; });
  fMira.append(tMira, ...bMira);
  barra.append(dato, detalle, fH, fM, fMira);

  function actualizar() {
    bH.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.h === hemi)));
    bM.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.m === mes)));
    bMira.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.az === mira)));
    const lista = dibujar();
    const nombreMes = MESES.find((x) => x[1] === mes)[0];
    const est = ESTACION[mes][hemi === 'norte' ? 0 : 1];
    dato.innerHTML = `<strong>Mediados de ${nombreMes}, hacia las 22:00</strong>, en el ${HEMIS[hemi].nombre}: allí es <strong>${est}</strong>. ${GUIA[hemi][mes].nota}`;
    const visibles = lista.filter((x) => x.alt > 8).sort((a, b) => b.alt - a.alt);
    detalle.innerHTML = `Dónde buscarlas: ${visibles.map((x) => `<strong>${x.nombre}</strong> al ${rumbo(x.az)}, a unos ${Math.round(x.alt)}° (${enManos(x.alt)})`).join('; ')}.`;
    canvas.setAttribute('aria-label', `Mapa del cielo de ${nombreMes}. ${dato.textContent} ${detalle.textContent}`);
  }

  preparar();
  actualizar();
  const ro = new ResizeObserver(() => { if (Math.abs(canvas.parentElement.clientWidth - ancho) > 2) { preparar(); dibujar(); } });
  ro.observe(contenedor);
  const alCambiarLetra = () => { preparar(); dibujar(); };
  window.addEventListener('cambio-letra', alCambiarLetra);
  return { destruir() { ro.disconnect(); window.removeEventListener('cambio-letra', alCambiarLetra); } };
}
