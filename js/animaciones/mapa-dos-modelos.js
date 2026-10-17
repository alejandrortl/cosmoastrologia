// Interactivo: el mismo mundo dibujado por los dos modelos, lado a lado.
// Izquierda, el globo (proyección ortográfica, como se vería una esfera).
// Derecha, el mapa plano de un solo centro (proyección azimutal equidistante polar,
// la disposición del mapa de Gleason de 1892).
// Los continentes salen de Natural Earth (dominio público), simplificados a 2°.

import { boton, barraControles, escalaLetra } from './comun.js';
import { tierras } from '../datos/tierras.js';

const rad = (g) => (g * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const CIUDADES = [
  ['Madrid', 40.4, -3.7], ['Buenos Aires', -34.6, -58.4], ['Quito', -0.2, -78.5],
  ['Sídney', -33.9, 151.2], ['Tokio', 35.7, 139.7], ['Polo Norte', 90, 0],
];
const COLOR = {
  mar: [29, 58, 95], tierra: [118, 150, 108], norte: [212, 174, 90], sur: [143, 176, 224],
};

// Máscara de tierras en proyección equirectangular (2 píxeles por grado)
let mascara = null;
function crearMascara() {
  if (mascara) return mascara;
  const c = document.createElement('canvas');
  c.width = 720; c.height = 360;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 720, 360);
  ctx.fillStyle = '#fff';
  for (const anillo of tierras()) {
    ctx.beginPath();
    anillo.forEach(([lon, lat], i) => {
      const x = (lon + 180) * 2, y = (90 - lat) * 2;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  const d = ctx.getImageData(0, 0, 720, 360).data;
  mascara = new Uint8Array(720 * 360);
  for (let i = 0; i < mascara.length; i++) mascara[i] = d[i * 4] > 127 ? 1 : 0;
  return mascara;
}
function esTierra(lat, lon) {
  let x = Math.floor((((lon + 180) % 360) + 360) % 360 * 2);
  let y = Math.floor((90 - lat) * 2);
  if (y < 0) y = 0; if (y > 359) y = 359; if (x > 719) x = 719;
  return mascara[y * 720 + x] === 1;
}

export function mapaDosModelos(contenedor) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  contenedor.append(canvas);
  crearMascara();

  let lat = 40.4, lon = -3.7, nombre = 'Madrid', hemisferios = false;
  let ctx, ancho, alto, dpr, apilado, tam, ox1, oy1, ox2, oy2;

  function preparar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.parentElement.clientWidth;
    apilado = ancho < 520;
    const titulo = Math.round(26 * escalaLetra());
    tam = apilado ? Math.min(ancho - 32, 420) : Math.min((ancho - 48) / 2, 380);
    alto = apilado ? (tam + titulo + 30) * 2 + 10 : tam + titulo + 40;
    ox1 = apilado ? (ancho - tam) / 2 : (ancho - 2 * tam - 16) / 2;
    oy1 = titulo + 14;
    ox2 = apilado ? ox1 : ox1 + tam + 16;
    oy2 = apilado ? oy1 + tam + titulo + 40 : oy1;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    canvas.style.height = `${alto}px`;
    ctx = canvas.getContext('2d');
  }

  function colorDe(la, lo) {
    let c = esTierra(la, lo) ? COLOR.tierra : COLOR.mar;
    if (hemisferios) {
      const t = la >= 0 ? COLOR.norte : COLOR.sur;
      c = [c[0] * 0.6 + t[0] * 0.4, c[1] * 0.6 + t[1] * 0.4, c[2] * 0.6 + t[2] * 0.4];
    }
    return c;
  }

  // Pinta un panel punto a punto con la función inversa de la proyección
  function pintar(ox, oy, inversa) {
    const n = Math.round(tam * Math.min(dpr, 1.5));
    const img = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) / n * 2 - 1, y = 1 - (j + 0.5) / n * 2;
        const p = inversa(x, y);
        if (!p) continue;
        const c = colorDe(p[0], p[1]);
        const k = (j * n + i) * 4;
        img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = n; tmp.height = n;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.drawImage(tmp, ox, oy, tam, tam);
  }

  // Globo: centro de la vista en el punto elegido (inclinación moderada)
  const vista = () => ({ l0: rad(lon), p0: rad(Math.max(-55, Math.min(55, lat * 0.7))) });
  function inversaGlobo(x, y) {
    const rho = Math.hypot(x, y);
    if (rho > 1) return null;
    const { l0, p0 } = vista();
    const c = Math.asin(rho);
    if (rho === 0) return [deg(p0), deg(l0)];
    const la = Math.asin(Math.cos(c) * Math.sin(p0) + (y * Math.sin(c) * Math.cos(p0)) / rho);
    const lo = l0 + Math.atan2(x * Math.sin(c), rho * Math.cos(c) * Math.cos(p0) - y * Math.sin(c) * Math.sin(p0));
    return [deg(la), ((deg(lo) + 540) % 360) - 180];
  }
  function directaGlobo(la, lo) {
    const { l0, p0 } = vista();
    const p = rad(la), l = rad(lo) - l0;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    return { x: Math.cos(p) * Math.sin(l), y: Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l), visible: cosc > 0 };
  }
  // Mapa plano: Polo Norte en el centro, el borde es el sur; Greenwich hacia abajo
  function inversaPlano(x, y) {
    const r = Math.hypot(x, y);
    if (r > 1) return null;
    return [90 - r * 180, deg(Math.atan2(x, -y))];
  }
  function directaPlano(la, lo) {
    const r = (90 - la) / 180;
    return { x: r * Math.sin(rad(lo)), y: -r * Math.cos(rad(lo)), visible: true };
  }

  function trazo(ox, oy, directa, puntos, estilo) {
    ctx.save();
    Object.assign(ctx, estilo);
    if (estilo.dash) ctx.setLineDash(estilo.dash);
    ctx.beginPath();
    let abierto = false;
    for (const [la, lo] of puntos) {
      const p = directa(la, lo);
      const sx = ox + (p.x + 1) / 2 * tam, sy = oy + (1 - (p.y + 1) / 2) * tam;
      if (!p.visible) { abierto = false; continue; }
      if (abierto) ctx.lineTo(sx, sy); else { ctx.moveTo(sx, sy); abierto = true; }
    }
    ctx.stroke();
    ctx.restore();
  }
  const paralelo = (la) => Array.from({ length: 181 }, (_, i) => [la, -180 + i * 2]);
  const meridiano = (lo) => Array.from({ length: 91 }, (_, i) => [-90 + i * 2, lo]);

  function rejilla(ox, oy, directa) {
    const fina = { strokeStyle: 'rgba(235,229,213,.22)', lineWidth: 1 };
    for (let la = -60; la <= 60; la += 30) if (la) trazo(ox, oy, directa, paralelo(la), fina);
    for (let lo = -150; lo <= 180; lo += 30) if (lo) trazo(ox, oy, directa, meridiano(lo), fina);
    trazo(ox, oy, directa, meridiano(0), { strokeStyle: 'rgba(235,229,213,.55)', lineWidth: 1.2, dash: [5, 4] });
    trazo(ox, oy, directa, paralelo(0), { strokeStyle: 'rgba(235,229,213,.85)', lineWidth: 2 });
    trazo(ox, oy, directa, paralelo(lat), { strokeStyle: '#d4ae5a', lineWidth: 2.2 });
    trazo(ox, oy, directa, meridiano(lon), { strokeStyle: '#d4ae5a', lineWidth: 2.2 });
    const p = directa(lat, lon);
    if (p.visible) {
      const sx = ox + (p.x + 1) / 2 * tam, sy = oy + (1 - (p.y + 1) / 2) * tam;
      ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = '#14203a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  function rotulo(t, x, y, opciones = {}) {
    const u = escalaLetra();
    ctx.font = `${opciones.peso || 500} ${Math.round((opciones.tam || 13) * u)}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.fillStyle = opciones.color || 'rgba(235,229,213,.9)';
    ctx.textAlign = opciones.alinear || 'center';
    ctx.fillText(t, x, y);
  }

  function dibujar() {
    if (!(tam > 8)) return; // la figura aún no tiene ancho (al cargar o recargar la página)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f1930';
    ctx.fillRect(0, 0, ancho, alto);
    rotulo('Modelo del globo', ox1 + tam / 2, oy1 - 10, { tam: 15, peso: 600, color: '#ebe5d5' });
    rotulo('Modelo plano (un centro)', ox2 + tam / 2, oy2 - 10, { tam: 15, peso: 600, color: '#ebe5d5' });
    // borde del disco plano (hielo)
    ctx.fillStyle = '#d9e3f0';
    ctx.beginPath(); ctx.arc(ox2 + tam / 2, oy2 + tam / 2, tam / 2 + 3, 0, Math.PI * 2); ctx.fill();
    pintar(ox1, oy1, inversaGlobo);
    pintar(ox2, oy2, inversaPlano);
    rejilla(ox1, oy1, directaGlobo);
    rejilla(ox2, oy2, directaPlano);
    ctx.strokeStyle = 'rgba(169,196,234,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ox1 + tam / 2, oy1 + tam / 2, tam / 2, 0, Math.PI * 2); ctx.stroke();
    rotulo('Polo Norte', ox2 + tam / 2, oy2 + tam / 2 - 8, { tam: 12 });
    rotulo('Borde sur: anillo de hielo', ox2 + tam / 2, oy2 + tam + 20, { tam: 12, color: 'rgba(169,178,196,.95)' });
    rotulo('Se ve la mitad de la esfera', ox1 + tam / 2, oy1 + tam + 20, { tam: 12, color: 'rgba(169,178,196,.95)' });
  }

  // ---- Controles ----
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Lugar');
  const botones = CIUDADES.map(([n, la, lo]) => {
    const b = boton(n, () => { nombre = n; lat = la; lon = lo; sincronizar(); actualizar(); }, { 'aria-pressed': String(n === nombre) });
    b.dataset.n = n;
    return b;
  });
  fila.append(...botones);
  const rLat = document.createElement('label');
  rLat.className = 'control-rango';
  rLat.innerHTML = '<span>Latitud</span><input type="range" min="-90" max="90" step="1" aria-label="Latitud">';
  const rLon = document.createElement('label');
  rLon.className = 'control-rango';
  rLon.innerHTML = '<span>Longitud</span><input type="range" min="-180" max="180" step="1" aria-label="Longitud">';
  const bHem = boton('Colorear los hemisferios', () => {
    hemisferios = !hemisferios;
    bHem.setAttribute('aria-pressed', String(hemisferios));
    dibujar();
  }, { 'aria-pressed': 'false' });
  barra.append(dato, fila, rLat, rLon, bHem);
  const iLat = rLat.querySelector('input'), iLon = rLon.querySelector('input');
  const sincronizar = () => { iLat.value = Math.round(lat); iLon.value = Math.round(lon); };
  iLat.addEventListener('input', () => { lat = +iLat.value; nombre = ''; actualizar(); });
  iLon.addEventListener('input', () => { lon = +iLon.value; nombre = ''; actualizar(); });

  const fmt = (v, pos, neg) => (Math.round(Math.abs(v)) === 0 ? '0°' : `${Math.round(Math.abs(v))}° ${v >= 0 ? pos : neg}`);
  function actualizar() {
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === nombre)));
    const hem = Math.round(lat) === 0 ? 'sobre el ecuador' : lat > 0 ? 'en el hemisferio norte' : 'en el hemisferio sur';
    const donde = nombre ? `<strong>${nombre}</strong>` : 'El punto elegido';
    dato.innerHTML = `${donde}: latitud <strong>${fmt(lat, 'norte', 'sur')}</strong>, longitud <strong>${fmt(lon, 'este', 'oeste')}</strong>, ${hem}. ` +
      (Math.round(lat) === 90 ? 'Es el Polo Norte: en el globo, un extremo de la esfera; en el mapa plano, el centro del disco.'
        : `Su paralelo (en dorado) es, en el globo, un círculo alrededor de la esfera; en el mapa plano, un círculo alrededor del centro, ${lat > 0.5 ? 'dentro' : lat < -0.5 ? 'fuera' : 'justo encima'} del ecuador.`);
    canvas.setAttribute('aria-label', `Mapas del mundo según el modelo del globo y según el modelo plano de un centro. ${dato.textContent}`);
    dibujar();
  }

  preparar();
  sincronizar();
  actualizar();
  const ro = new ResizeObserver(() => {
    if (Math.abs(canvas.parentElement.clientWidth - ancho) > 2) { preparar(); dibujar(); }
  });
  ro.observe(contenedor);
  const alCambiarLetra = () => { preparar(); dibujar(); };
  window.addEventListener('cambio-letra', alCambiarLetra);
  return { destruir() { ro.disconnect(); window.removeEventListener('cambio-letra', alCambiarLetra); } };
}
