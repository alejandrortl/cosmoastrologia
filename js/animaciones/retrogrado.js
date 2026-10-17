// Animación: el bucle retrógrado de Marte explicado por dos modelos.
// Heliocéntrico (Copérnico, Kepler): la Tierra adelanta a Marte en sus órbitas.
// Geocéntrico (Ptolomeo): Marte gira en un epiciclo cuyo centro recorre un deferente
// alrededor de la Tierra. Con estas medidas, los dos producen el mismo recorrido
// aparente, que se dibuja abajo contra las estrellas. La inclinación de la órbita
// de Marte está exagerada para que el bucle se distinga.

import { ajustarLienzo, bucle, sinMovimiento, boton, barraControles, azar, escalaLetra } from './comun.js';

const T_TIERRA = 1, T_MARTE = 1.881;
const R_TIERRA = 1, R_MARTE = 1.524;
const INCLINACION = (5.5 * Math.PI) / 180; // real ~1,85°, exagerada
const VENTANA = 0.3;                       // años antes y después de la oposición

function posiciones(t) {
  const at = (2 * Math.PI * t) / T_TIERRA;
  const am = (2 * Math.PI * t) / T_MARTE;
  const tierra = { x: R_TIERRA * Math.cos(at), y: R_TIERRA * Math.sin(at), z: 0 };
  const marte = {
    x: R_MARTE * Math.cos(am),
    y: R_MARTE * Math.sin(am),
    z: R_MARTE * Math.sin(am - 1.1) * Math.sin(INCLINACION),
  };
  const dx = marte.x - tierra.x, dy = marte.y - tierra.y;
  return {
    tierra, marte,
    lon: Math.atan2(dy, dx),
    lat: Math.atan2(marte.z, Math.hypot(dx, dy)),
  };
}

export function retrogrado(contenedor) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Animación: arriba, la Tierra adelanta a Marte en sus órbitas alrededor del Sol; abajo, visto desde la Tierra, Marte frena, retrocede y vuelve a avanzar entre las estrellas, dibujando un bucle.');
  contenedor.append(canvas);

  let ctx, ancho, alto;
  let t = -VENTANA;
  let modelo = 'helio';
  const fondo = [];
  const rnd = azar(5);
  for (let i = 0; i < 70; i++) fondo.push([rnd(), rnd(), 0.4 + rnd() * 1.1]);

  // Longitud central de la franja de cielo: la de la oposición (t = 0)
  const lon0 = posiciones(0).lon;
  const rango = { lonMin: Infinity, lonMax: -Infinity, latMin: Infinity, latMax: -Infinity };
  for (let s = -VENTANA; s <= VENTANA; s += 0.005) {
    const q = posiciones(s);
    const d = Math.atan2(Math.sin(q.lon - lon0), Math.cos(q.lon - lon0));
    rango.lonMin = Math.min(rango.lonMin, d); rango.lonMax = Math.max(rango.lonMax, d);
    rango.latMin = Math.min(rango.latMin, q.lat); rango.latMax = Math.max(rango.latMax, q.lat);
  }

  function dibujar() {
    ctx.fillStyle = '#0f1930';
    ctx.fillRect(0, 0, ancho, alto);
    const altoArriba = alto * 0.58;
    const p = posiciones(t);

    // --- Vista desde fuera ---
    const cx = ancho / 2, cy = altoArriba / 2 + 6;
    ctx.font = `500 ${Math.round(12 * escalaLetra())}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.lineWidth = 1;
    if (modelo === 'geo') { dibujarPtolomeo(p, cx, cy, altoArriba); dibujarFranja(p, altoArriba); return; }
    if (modelo === 'plano') { dibujarPlano(p, cx, cy, altoArriba); dibujarFranja(p, altoArriba); return; }
    const k = Math.min(ancho * 0.42, altoArriba * 0.44) / R_MARTE;
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(143,176,224,.4)';
    for (const r of [R_TIERRA, R_MARTE]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
    const T = { x: cx + p.tierra.x * k, y: cy - p.tierra.y * k };
    const M = { x: cx + p.marte.x * k, y: cy - p.marte.y * k };
    // línea de visión
    const largo = 3 * k;
    const ux = (M.x - T.x), uy = (M.y - T.y), n = Math.hypot(ux, uy) || 1;
    ctx.strokeStyle = 'rgba(212,174,90,.55)';
    ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(T.x + (ux / n) * largo, T.y + (uy / n) * largo); ctx.stroke();
    // Sol, Tierra y Marte
    ctx.fillStyle = '#f2cf72'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b8fd6'; ctx.beginPath(); ctx.arc(T.x, T.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9714e'; ctx.beginPath(); ctx.arc(M.x, M.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = `500 ${Math.round(12 * escalaLetra())}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(235,229,213,.85)';
    ctx.fillText('Sol', cx + 12, cy + 4);
    ctx.fillText('Tierra', T.x + 9, T.y + 14);
    ctx.fillText('Marte', M.x + 9, M.y - 6);
    ctx.fillStyle = 'rgba(235,229,213,.6)';
    ctx.fillText('Modelo heliocéntrico (Copérnico, Kepler)', 14, 20);
    dibujarFranja(p, altoArriba);
  }

  function dibujarPtolomeo(p, cx, cy, altoArriba) {
    const k = Math.min(ancho * 0.42, altoArriba * 0.44) / (R_MARTE + R_TIERRA);
    // Centro del epiciclo: recorre el deferente al ritmo de Marte
    const D = { x: cx + p.marte.x * k, y: cy - p.marte.y * k };
    // Marte en el epiciclo: el radio del epiciclo apunta como la línea Tierra-Sol
    const M = { x: D.x - p.tierra.x * k, y: D.y + p.tierra.y * k };
    const Sol = { x: cx - p.tierra.x * k, y: cy + p.tierra.y * k };
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(143,176,224,.4)';
    ctx.beginPath(); ctx.arc(cx, cy, R_MARTE * k, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R_TIERRA * k, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(217,113,78,.55)';
    ctx.beginPath(); ctx.arc(D.x, D.y, R_TIERRA * k, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(143,176,224,.6)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(D.x, D.y); ctx.stroke();
    // línea de visión
    const ux = M.x - cx, uy = M.y - cy, n = Math.hypot(ux, uy) || 1, largo = 3 * k;
    ctx.strokeStyle = 'rgba(212,174,90,.55)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (ux / n) * largo, cy + (uy / n) * largo); ctx.stroke();
    ctx.fillStyle = '#5b8fd6'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2cf72'; ctx.beginPath(); ctx.arc(Sol.x, Sol.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(217,113,78,.6)'; ctx.beginPath(); ctx.arc(D.x, D.y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9714e'; ctx.beginPath(); ctx.arc(M.x, M.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(235,229,213,.85)';
    ctx.fillText('Tierra', cx + 10, cy + 16);
    ctx.fillText('Sol', Sol.x - 8, Sol.y - 12);
    ctx.fillText('Marte', M.x + 9, M.y - 6);
    ctx.fillStyle = 'rgba(217,113,78,.85)';
    ctx.fillText('epiciclo', D.x + R_TIERRA * k * 0.72, D.y - R_TIERRA * k * 0.72);
    ctx.fillStyle = 'rgba(143,176,224,.85)';
    ctx.fillText('deferente', cx + R_MARTE * k * 0.72 + 6, cy + R_MARTE * k * 0.72);
    ctx.fillStyle = 'rgba(235,229,213,.6)';
    ctx.fillText('Modelo geocéntrico (Ptolomeo)', 14, 20);
  }

  // Disposición de la wiki de la Flat Earth Society: el Sol da vueltas sobre el centro del
  // plano y los planetas giran alrededor del Sol. Por simplificar, el observador está en el centro.
  function dibujarPlano(p, cx, cy, altoArriba) {
    const k = Math.min(ancho * 0.42, altoArriba * 0.44) / (R_MARTE + R_TIERRA);
    const Sol = { x: cx - p.tierra.x * k, y: cy + p.tierra.y * k };
    const M = { x: Sol.x + p.marte.x * k, y: Sol.y - p.marte.y * k };
    ctx.fillStyle = 'rgba(29,58,95,.6)';
    ctx.beginPath(); ctx.arc(cx, cy, (R_MARTE + R_TIERRA) * k + 8, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(212,174,90,.5)';
    ctx.beginPath(); ctx.arc(cx, cy, R_TIERRA * k, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(217,113,78,.55)';
    ctx.beginPath(); ctx.arc(Sol.x, Sol.y, R_MARTE * k, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const ux = M.x - cx, uy = M.y - cy, n = Math.hypot(ux, uy) || 1, largo = 3 * k;
    ctx.strokeStyle = 'rgba(212,174,90,.55)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (ux / n) * largo, cy + (uy / n) * largo); ctx.stroke();
    ctx.fillStyle = '#ebe5d5'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2cf72'; ctx.beginPath(); ctx.arc(Sol.x, Sol.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9714e'; ctx.beginPath(); ctx.arc(M.x, M.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(235,229,213,.85)';
    ctx.textAlign = 'right';
    ctx.fillText('Centro del plano', cx - 8, cy + 18);
    ctx.textAlign = 'left';
    ctx.fillText('Sol', Sol.x - 8, Sol.y - 12);
    ctx.fillText('Marte', M.x + 9, M.y - 6);
    ctx.fillStyle = 'rgba(235,229,213,.6)';
    ctx.fillText('Modelo plano (Flat Earth Society)', 14, 20);
  }

  function dibujarFranja(p, altoArriba) {
    // --- Franja de cielo vista desde la Tierra ---
    const y0 = altoArriba + 10, hFranja = alto - y0 - 10;
    ctx.fillStyle = '#0a1224';
    ctx.fillRect(10, y0, ancho - 20, hFranja);
    for (const [fx, fy, fr] of fondo) {
      ctx.fillStyle = 'rgba(243,236,216,.55)';
      ctx.beginPath(); ctx.arc(10 + fx * (ancho - 20), y0 + fy * hFranja, fr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(10, y0, ancho - 20, hFranja); ctx.clip();
    // Encajar todo el recorrido de la ventana en la franja (el este, a la izquierda)
    const aPantalla = (q) => {
      let d = q.lon - lon0;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const fx = (d - rango.lonMin) / (rango.lonMax - rango.lonMin || 1);
      const fy = (q.lat - rango.latMin) / (rango.latMax - rango.latMin || 1);
      return { x: ancho - 40 - fx * (ancho - 80), y: y0 + hFranja * (0.78 - fy * 0.5) };
    };
    ctx.strokeStyle = 'rgba(217,113,78,.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = -VENTANA; s <= t; s += 0.004) {
      const q = aPantalla(posiciones(s));
      if (s === -VENTANA) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
    const a = aPantalla(p);
    ctx.fillStyle = '#ffb08f'; ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(235,229,213,.7)';
    ctx.fillText('El cielo visto desde la Tierra', 18, y0 + 18);
    ctx.textAlign = 'right';
    ctx.fillText('Oeste', ancho - 18, y0 + hFranja - 8);
    ctx.textAlign = 'left';
    ctx.fillText('Este', 18, y0 + hFranja - 8);
  }

  function preparar() { ({ ctx, ancho, alto } = ajustarLienzo(canvas, 0.95)); }

  const anim = bucle(canvas, (dt) => {
    t += dt * 0.11;
    if (t > VENTANA) t = -VENTANA;
    dibujar();
  });
  preparar();
  if (sinMovimiento()) { t = 0.15; anim.pausar(); }
  dibujar();

  const barra = barraControles(contenedor);
  const bPausa = boton(anim.activo ? 'Pausar' : 'Reproducir', () => {
    if (anim.activo) anim.pausar(); else anim.reanudar();
    bPausa.textContent = anim.activo ? 'Pausar' : 'Reproducir';
  });
  const bHelio = boton('Heliocéntrico', () => elegir('helio'), { 'aria-pressed': 'true' });
  const bGeo = boton('Geocéntrico (Ptolomeo)', () => elegir('geo'), { 'aria-pressed': 'false' });
  const bPlano = boton('Plano (Flat Earth Society)', () => elegir('plano'), { 'aria-pressed': 'false' });
  const DESCRIPCION = {
    helio: 'Animación, modelo heliocéntrico: la Tierra adelanta a Marte en sus órbitas alrededor del Sol; abajo, visto desde la Tierra, Marte frena, retrocede y vuelve a avanzar entre las estrellas.',
    geo: 'Animación, modelo geocéntrico de Ptolomeo: Marte gira en un epiciclo cuyo centro recorre un deferente alrededor de la Tierra; abajo, el mismo bucle visto contra las estrellas.',
    plano: 'Animación, modelo plano según la Flat Earth Society: el Sol da vueltas sobre el centro del plano y Marte gira alrededor del Sol; abajo, el mismo bucle visto contra las estrellas.',
  };
  const elegir = (m) => {
    modelo = m;
    bHelio.setAttribute('aria-pressed', String(m === 'helio'));
    bGeo.setAttribute('aria-pressed', String(m === 'geo'));
    bPlano.setAttribute('aria-pressed', String(m === 'plano'));
    canvas.setAttribute('aria-label', DESCRIPCION[m]);
    dibujar();
  };
  barra.append(bHelio, bGeo, bPlano, bPausa, boton('Empezar de nuevo', () => { t = -VENTANA; dibujar(); }));

  const ro = new ResizeObserver(() => { if (Math.abs(canvas.clientWidth - ancho) > 2) { preparar(); dibujar(); } });
  ro.observe(contenedor);

  const alCambiarLetra = () => dibujar();
  window.addEventListener('cambio-letra', alCambiarLetra);
  return { destruir() { anim.destruir(); ro.disconnect(); window.removeEventListener('cambio-letra', alCambiarLetra); } };
}
