// Interactivo: el cielo de esta noche (o de cualquier fecha, hora y lugar).
// Mapa del cielo visto como una cúpula sobre la cabeza, como un planisferio: el centro es el
// cenit y el borde, el horizonte. La dirección hacia la que miras queda abajo.
// Estrellas y constelaciones: d3-celestial (Hipparcos). Sol, Luna y planetas: método de Schlyter.

import { boton, barraControles, escalaLetra, sinMovimiento } from './comun.js';
import { cielo } from '../datos/cielo.js';
import { sol, luna, planeta, PLANETAS, diaJ, sidereoLocal, horizontales, rumbo, desfase } from '../astro.js';

const LUGARES = [
  { nombre: 'Madrid', lat: 40.42, lon: -3.7, zona: 'Europe/Madrid' },
  { nombre: 'Ciudad de México', lat: 19.43, lon: -99.13, zona: 'America/Mexico_City' },
  { nombre: 'Bogotá', lat: 4.71, lon: -74.07, zona: 'America/Bogota' },
  { nombre: 'Lima', lat: -12.05, lon: -77.04, zona: 'America/Lima' },
  { nombre: 'Buenos Aires', lat: -34.6, lon: -58.38, zona: 'America/Argentina/Buenos_Aires' },
  { nombre: 'Santiago', lat: -33.45, lon: -70.67, zona: 'America/Santiago' },
];
const COLOR_PLANETA = { Mercurio: '#c9c3b8', Venus: '#fff4d6', Marte: '#ff8a5c', Júpiter: '#f3dfb8', Saturno: '#e8cf8a' };
const DIRECCIONES = [['Norte', 0], ['Este', 90], ['Sur', 180], ['Oeste', 270]];
const rad = (g) => (g * Math.PI) / 180;

function colorEstrella(bv) {
  if (bv < 0) return [190, 210, 255];
  if (bv < 0.4) return [235, 240, 255];
  if (bv < 0.8) return [255, 246, 228];
  if (bv < 1.2) return [255, 222, 180];
  return [255, 196, 150];
}

const leer = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } };

export function cieloEstaNoche(contenedor) {
  const datos = cielo();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.style.touchAction = 'manipulation';
  contenedor.append(canvas);

  let lugar = leer('cielo:lugar', LUGARES[0]);
  let mira = leer('cielo:mira', lugar.lat >= 0 ? 0 : 180);
  let nombres = true, lineas = true;
  // Fecha y hora locales del lugar
  let fechaUT = new Date();
  let seleccion = null;
  let ctx, ancho, alto, dpr, R, CX, CY, objetos = [];

  function preparar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.parentElement.clientWidth;
    const margen = Math.round(26 * escalaLetra()) + 10;
    const lado = Math.min(ancho, 620);
    R = Math.max(20, lado / 2 - margen);
    alto = lado;
    CX = ancho / 2; CY = alto / 2;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    canvas.style.height = `${alto}px`;
    ctx = canvas.getContext('2d');
  }

  // Proyección estereográfica desde el cenit; la dirección «mira» queda abajo
  function proyectar(alt, az) {
    const r = R * Math.tan(rad(90 - alt) / 2);
    const f = rad(az - mira);
    return { x: CX + r * Math.sin(f), y: CY + r * Math.cos(f), r };
  }

  function letra(tam, peso = 500) {
    ctx.font = `${peso} ${Math.round(tam * escalaLetra())}px "IBM Plex Sans", system-ui, sans-serif`;
  }

  function dibujar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const d = diaJ(fechaUT);
    const lst = sidereoLocal(fechaUT, lugar.lon);
    const hz = (ra, dec) => horizontales(ra, dec, lst, lugar.lat);
    const s = sol(d), sh = hz(s.ra, s.dec);
    objetos = [];

    // Fondo: color del cielo según la altura del Sol
    ctx.fillStyle = '#0b1326';
    ctx.fillRect(0, 0, ancho, alto);
    const noche = sh.alt < -18 ? 0 : sh.alt > 0 ? 1 : (sh.alt + 18) / 18;
    const mezcla = (a, b) => a.map((x, i) => Math.round(x + (b[i] - x) * noche));
    const c0 = mezcla([10, 18, 38], [70, 130, 200]), c1 = mezcla([20, 34, 66], [150, 195, 235]);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    g.addColorStop(0, `rgb(${c0})`); g.addColorStop(1, `rgb(${c1})`);
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    const brilloEstrellas = Math.max(0, 1 - noche * 1.6);

    // Anillos de altura y cenit
    ctx.strokeStyle = 'rgba(169,196,234,.16)'; ctx.lineWidth = 1;
    for (const a of [30, 60]) { const p = proyectar(a, 0); ctx.beginPath(); ctx.arc(CX, CY, p.r, 0, Math.PI * 2); ctx.stroke(); }

    // Eclíptica, el camino del Sol (y por donde van la Luna y los planetas)
    ctx.strokeStyle = 'rgba(212,174,90,.45)'; ctx.setLineDash([5, 6]); ctx.lineWidth = 1.2;
    ctx.beginPath();
    let abierto = false;
    for (let L = 0; L <= 360; L += 3) {
      const e = rad(23.44), ra = Math.atan2(Math.sin(rad(L)) * Math.cos(e), Math.cos(rad(L))) * 180 / Math.PI;
      const dec = Math.asin(Math.sin(rad(L)) * Math.sin(e)) * 180 / Math.PI;
      const h = hz(ra, dec);
      if (h.alt < -2) { abierto = false; continue; }
      const p = proyectar(h.alt, h.az);
      if (abierto) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); abierto = true; }
    }
    ctx.stroke(); ctx.setLineDash([]);

    // Líneas de las constelaciones
    if (lineas && brilloEstrellas > 0.05) {
      ctx.strokeStyle = `rgba(143,176,224,${0.42 * brilloEstrellas})`; ctx.lineWidth = 1;
      for (const k of datos.constelaciones) {
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
    }

    // Estrellas
    if (brilloEstrellas > 0.02) {
      for (const st of datos.estrellas) {
        const h = hz(st.ra, st.dec);
        if (h.alt < 0) continue;
        const p = proyectar(h.alt, h.az);
        const radio = Math.max(0.7, 3.4 - st.mag * 0.62) * (R / 280);
        const [r, gg, b] = colorEstrella(st.bv);
        const extincion = h.alt < 10 ? 0.45 + h.alt * 0.055 : 1;
        ctx.fillStyle = `rgba(${r},${gg},${b},${Math.min(1, (1.15 - st.mag * 0.12)) * brilloEstrellas * extincion})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, radio, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Nombres de constelaciones
    if (nombres && brilloEstrellas > 0.2) {
      letra(11, 400);
      ctx.fillStyle = `rgba(169,196,234,${0.75 * brilloEstrellas})`;
      ctx.textAlign = 'center';
      for (const k of datos.constelaciones) {
        if (k.rango > (R > 220 ? 2 : 1) && !['Cru', 'UMi', 'Cas'].includes(k.id)) continue;
        const h = hz(k.ra, k.dec);
        if (h.alt < 6) continue;
        const p = proyectar(h.alt, h.az);
        ctx.fillText(k.nombre, p.x, p.y);
      }
    }

    // Estrellas con nombre
    letra(11.5, 500);
    ctx.textAlign = 'left';
    for (const st of datos.conNombre) {
      const h = hz(st.ra, st.dec);
      if (h.alt < 2) continue;
      const p = proyectar(h.alt, h.az);
      objetos.push({ x: p.x, y: p.y, nombre: st.nombre, alt: h.alt, az: h.az, tipo: 'estrella' });
      const importante = st.mag < 1.0 || ['Polaris', 'Ácrux', 'Pléyades', 'Sigma Octantis'].includes(st.nombre);
      if (!nombres || !importante || brilloEstrellas < 0.25) continue;
      if (st.nombre === 'Sigma Octantis') {
        ctx.strokeStyle = 'rgba(245,222,160,.7)'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = `rgba(245,222,160,${0.95 * brilloEstrellas})`;
      const izq = p.x > CX + R * 0.6;
      ctx.textAlign = izq ? 'right' : 'left';
      ctx.fillText(st.nombre === 'Sigma Octantis' ? 'Polo sur celeste' : st.nombre, p.x + (izq ? -6 : 6), p.y - 5);
      ctx.textAlign = 'left';
    }

    // Planetas
    const visibles = [];
    for (const n of PLANETAS) {
      const pl = planeta(n, d), h = hz(pl.ra, pl.dec);
      if (h.alt < 0) continue;
      const p = proyectar(h.alt, h.az);
      ctx.fillStyle = COLOR_PLANETA[n];
      ctx.beginPath(); ctx.arc(p.x, p.y, n === 'Venus' ? 4.6 : n === 'Júpiter' ? 4 : 3.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(15,25,48,.8)'; ctx.lineWidth = 1; ctx.stroke();
      letra(12.5, 600);
      ctx.fillStyle = COLOR_PLANETA[n];
      const izqP = p.x > CX + R * 0.6;
      ctx.textAlign = izqP ? 'right' : 'left';
      ctx.fillText(n, p.x + (izqP ? -7 : 7), p.y + 4);
      ctx.textAlign = 'left';
      objetos.push({ x: p.x, y: p.y, nombre: n, alt: h.alt, az: h.az, tipo: 'planeta' });
      visibles.push({ nombre: n, ...h });
    }

    // Luna, con su fase orientada hacia el Sol
    const m = luna(d);
    let mh = hz(m.ra, m.dec);
    mh = { ...mh, alt: mh.alt - (Math.asin(1 / m.r) * 180 / Math.PI) * Math.cos(rad(mh.alt)) }; // paralaje
    let lunaInfo = null;
    if (mh.alt > -0.5) {
      const p = proyectar(mh.alt, mh.az), ps = proyectar(Math.max(-80, sh.alt), sh.az);
      const ang = Math.atan2(ps.y - p.y, ps.x - p.x);
      const rl = 8 * (R / 280) + 3;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
      ctx.fillStyle = '#2a3554'; ctx.beginPath(); ctx.arc(0, 0, rl, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f3ecd8';
      ctx.beginPath();
      const k = 1 - 2 * m.iluminada; // del terminador
      ctx.arc(0, 0, rl, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(0, 0, Math.abs(k) * rl, rl, 0, Math.PI / 2, -Math.PI / 2, k > 0);
      ctx.fill();
      ctx.restore();
      letra(12.5, 600); ctx.fillStyle = '#f3ecd8';
      const izqL = p.x > CX + R * 0.6;
      ctx.textAlign = izqL ? 'right' : 'left';
      ctx.fillText('Luna', p.x + (izqL ? -(rl + 4) : rl + 4), p.y + 4);
      ctx.textAlign = 'left';
      objetos.push({ x: p.x, y: p.y, nombre: 'Luna', alt: mh.alt, az: mh.az, tipo: 'luna' });
      lunaInfo = mh;
    }

    // Sol
    if (sh.alt > -0.8) {
      const p = proyectar(sh.alt, sh.az);
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.arc(p.x, p.y, 9 * (R / 280) + 3, 0, Math.PI * 2); ctx.fill();
      objetos.push({ x: p.x, y: p.y, nombre: 'Sol', alt: sh.alt, az: sh.az, tipo: 'sol' });
    }
    ctx.restore();

    // Selección
    if (seleccion) {
      const o = objetos.find((x) => x.nombre === seleccion);
      if (o) { ctx.strokeStyle = '#d4ae5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, 11, 0, Math.PI * 2); ctx.stroke(); }
    }

    // Horizonte y puntos cardinales
    ctx.strokeStyle = 'rgba(169,196,234,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    letra(13, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [n, az] of [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]]) {
      const f = rad(az - mira), rr = R + 14 * escalaLetra();
      ctx.fillStyle = n.length === 1 ? '#ebe5d5' : 'rgba(169,178,196,.8)';
      ctx.fillText(n, CX + rr * Math.sin(f), CY + rr * Math.cos(f));
    }
    ctx.textBaseline = 'alphabetic';
    letra(10.5, 400); ctx.fillStyle = 'rgba(169,196,234,.6)';
    ctx.fillText('cenit', CX, CY - 4);
    ctx.fillStyle = 'rgba(169,196,234,.6)'; ctx.beginPath(); ctx.arc(CX, CY + 2, 1.6, 0, Math.PI * 2); ctx.fill();

    return { sh, lunaInfo, luna: m, visibles };
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const detalle = document.createElement('p');
  detalle.className = 'lectura-dato';
  const filaLugar = document.createElement('div');
  filaLugar.className = 'grupo-botones';
  filaLugar.setAttribute('role', 'group');
  filaLugar.setAttribute('aria-label', 'Lugar');
  const botonesLugar = LUGARES.map((l) => {
    const b = boton(l.nombre, () => cambiarLugar(l));
    b.dataset.n = l.nombre;
    return b;
  });
  const bUbicacion = boton('Usar mi ubicación', () => {
    if (!navigator.geolocation) { detalle.textContent = 'Este navegador no puede darte tu ubicación. Elige el lugar más cercano.'; return; }
    detalle.textContent = 'Buscando tu ubicación…';
    navigator.geolocation.getCurrentPosition((p) => {
      cambiarLugar({ nombre: 'Tu ubicación', lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2), zona: Intl.DateTimeFormat().resolvedOptions().timeZone });
    }, () => { detalle.textContent = 'No se ha podido obtener tu ubicación. Elige el lugar más cercano.'; }, { maximumAge: 600000, timeout: 15000 });
  });
  bUbicacion.dataset.n = 'Tu ubicación';
  filaLugar.append(...botonesLugar, bUbicacion);

  const filaHora = document.createElement('div');
  filaHora.className = 'grupo-botones';
  const iFecha = document.createElement('input');
  iFecha.type = 'date'; iFecha.className = 'control'; iFecha.setAttribute('aria-label', 'Fecha');
  const rHora = document.createElement('label');
  rHora.className = 'control-rango';
  rHora.innerHTML = '<span class="hora-texto">Hora</span><input type="range" min="0" max="1439" step="5" aria-label="Hora local del lugar">';
  const iHora = rHora.querySelector('input'), tHora = rHora.querySelector('.hora-texto');
  let animando = 0;
  const bAhora = boton('Ahora', () => { pararAnimacion(); fechaUT = new Date(); sincronizar(); actualizar(); });
  const bNoche = boton('Ver pasar la noche', () => (animando ? pararAnimacion() : animar()));
  filaHora.append(iFecha, bAhora, bNoche);

  const filaMira = document.createElement('div');
  filaMira.className = 'grupo-botones';
  filaMira.setAttribute('role', 'group');
  filaMira.setAttribute('aria-label', 'Hacia dónde miras');
  const tMira = document.createElement('span'); tMira.textContent = 'Miro hacia el:';
  const botonesMira = DIRECCIONES.map(([n, az]) => {
    const b = boton(n.toLowerCase(), () => { mira = az; guardar('cielo:mira', mira); marcar(); actualizar(); });
    b.dataset.az = az;
    return b;
  });
  const bNombres = boton('Nombres', () => { nombres = !nombres; bNombres.setAttribute('aria-pressed', String(nombres)); actualizar(); }, { 'aria-pressed': 'true' });
  const bLineas = boton('Figuras', () => { lineas = !lineas; bLineas.setAttribute('aria-pressed', String(lineas)); actualizar(); }, { 'aria-pressed': 'true' });
  filaMira.append(tMira, ...botonesMira, bNombres, bLineas);
  barra.append(dato, detalle, filaLugar, filaHora, rHora, filaMira);

  function horaLocal() {
    const off = desfase(fechaUT, lugar.zona);
    const loc = new Date(fechaUT.getTime() + off * 60000);
    return { y: loc.getUTCFullYear(), m: loc.getUTCMonth() + 1, d: loc.getUTCDate(), min: loc.getUTCHours() * 60 + loc.getUTCMinutes() };
  }
  function desdeLocal(y, m, d, min) {
    let t = Date.UTC(y, m - 1, d, Math.floor(min / 60), min % 60);
    for (let k = 0; k < 2; k++) t = Date.UTC(y, m - 1, d, Math.floor(min / 60), min % 60) - desfase(new Date(t), lugar.zona) * 60000;
    return new Date(t);
  }
  const dos = (n) => String(n).padStart(2, '0');
  function sincronizar() {
    const h = horaLocal();
    iFecha.value = `${h.y}-${dos(h.m)}-${dos(h.d)}`;
    iHora.value = h.min;
    tHora.textContent = `${dos(Math.floor(h.min / 60))}:${dos(h.min % 60)}`;
  }
  iFecha.addEventListener('change', () => {
    if (!iFecha.value) return;
    const [y, m, d] = iFecha.value.split('-').map(Number);
    fechaUT = desdeLocal(y, m, d, +iHora.value); actualizar();
  });
  iHora.addEventListener('input', () => {
    pararAnimacion();
    const h = horaLocal();
    fechaUT = desdeLocal(h.y, h.m, h.d, +iHora.value);
    tHora.textContent = `${dos(Math.floor(iHora.value / 60))}:${dos(iHora.value % 60)}`;
    actualizar(false);
  });
  // Al cambiar de lugar se conserva la fecha y la hora local: las 22:00 de allí
  function cambiarLugar(l) {
    const h = horaLocal();
    lugar = l; guardar('cielo:lugar', l);
    mira = l.lat >= 0 ? 0 : 180; guardar('cielo:mira', mira);
    fechaUT = desdeLocal(h.y, h.m, h.d, h.min);
    sincronizar(); marcar(); actualizar();
  }
  function marcar() {
    botonesLugar.concat(bUbicacion).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === lugar.nombre)));
    botonesMira.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.az === mira)));
  }
  function pararAnimacion() { cancelAnimationFrame(animando); animando = 0; bNoche.textContent = 'Ver pasar la noche'; }
  function animar() {
    bNoche.textContent = 'Detener';
    let ultimo = 0;
    const paso = (t) => {
      const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0; ultimo = t;
      fechaUT = new Date(fechaUT.getTime() + dt * (sinMovimiento() ? 1800 : 3600) * 1000); // una hora por segundo
      sincronizar(); actualizar(false);
      animando = requestAnimationFrame(paso);
    };
    animando = requestAnimationFrame(paso);
  }

  const fmtAlt = (a) => `${Math.round(a)}° de altura`;
  function actualizar(conTexto = true) {
    const r = dibujar();
    const h = horaLocal();
    const fecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(h.y, h.m - 1, h.d)));
    let momento;
    if (r.sh.alt > 0) momento = `Es de día: el Sol está al ${rumbo(r.sh.az)}, a ${Math.round(r.sh.alt)}° de altura, y su luz no deja ver las estrellas.`;
    else if (r.sh.alt > -12) momento = 'Es el crepúsculo: empiezan a verse las estrellas más brillantes y los planetas.';
    else momento = 'Es de noche.';
    let textoLuna = '';
    if (r.lunaInfo) {
      const pct = Math.round(r.luna.iluminada * 100);
      const fase = pct < 3 ? 'casi nueva' : pct > 97 ? 'llena' : `${r.luna.creciente ? 'creciente' : 'menguante'}, iluminada al ${pct} %`;
      textoLuna = ` La Luna (${fase}) está al ${rumbo(r.lunaInfo.az)}, a ${fmtAlt(r.lunaInfo.alt)}.`;
    } else textoLuna = ' La Luna está bajo el horizonte.';
    const pl = r.visibles.filter((p) => p.alt > 3).sort((a, b) => b.alt - a.alt);
    const textoPl = pl.length ? ` Planetas a la vista: ${pl.map((p) => `${p.nombre} (al ${rumbo(p.az)}, a ${Math.round(p.alt)}°)`).join(', ')}.` : ' No hay planetas brillantes por encima del horizonte.';
    const polo = lugar.lat >= 0
      ? ` Polaris está al norte, a unos ${Math.round(lugar.lat)}° de altura.`
      : ` El polo sur celeste está al sur, a unos ${Math.round(-lugar.lat)}° de altura.`;
    dato.innerHTML = `<strong>${lugar.nombre}, ${fecha}, ${tHora.textContent || ''}</strong>. ${momento}${textoLuna}${textoPl}${polo}`;
    canvas.setAttribute('aria-label', `Mapa del cielo. ${dato.textContent}`);
    if (conTexto) detalle.textContent = 'Toca una estrella con nombre, un planeta o la Luna para saber hacia dónde mirar. Sujeta el móvil por encima de tu cabeza con la dirección elegida hacia abajo.';
  }

  canvas.addEventListener('click', (e) => {
    const b = canvas.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    let mejor = null, dmin = 22;
    for (const o of objetos) { const dd = Math.hypot(o.x - x, o.y - y); if (dd < dmin) { dmin = dd; mejor = o; } }
    if (!mejor) return;
    seleccion = mejor.nombre;
    const nombre = mejor.nombre === 'Sigma Octantis' ? 'el polo sur celeste (junto a Sigma Octantis)' : mejor.nombre;
    detalle.innerHTML = `<strong>${nombre[0].toUpperCase() + nombre.slice(1)}</strong>: mira hacia el <strong>${rumbo(mejor.az, true)}</strong> y levanta la vista unos <strong>${Math.round(mejor.alt)}°</strong> sobre el horizonte (unos ${Math.max(0, Math.round(mejor.alt / 10))} puños).`;
    dibujar();
  });

  preparar();
  sincronizar();
  marcar();
  actualizar();
  const ro = new ResizeObserver(() => { if (Math.abs(canvas.parentElement.clientWidth - ancho) > 2) { preparar(); dibujar(); } });
  ro.observe(contenedor);
  const alCambiarLetra = () => { preparar(); dibujar(); };
  window.addEventListener('cambio-letra', alCambiarLetra);
  return { destruir() { pararAnimacion(); ro.disconnect(); window.removeEventListener('cambio-letra', alCambiarLetra); } };
}
