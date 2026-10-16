// Arcos de estrellas alrededor de Polaris, como en una fotografía de larga exposición.
// Es una observación: no presupone ningún modelo del cosmos.

import { ajustarLienzo, bucle, sinMovimiento, azar, boton, barraControles } from './comun.js';

const VUELTA = Math.PI * 2;
const HORAS_POR_SEGUNDO = 0.9;   // 1 segundo de animación = 54 minutos de noche
const HORAS_MAX = 11;            // una noche larga; luego vuelve a empezar

export function arcosPolaris(canvas, { decorativo = false, conControles = false } = {}) {
  const rnd = azar(decorativo ? 11 : 29);
  let ctx, ancho, alto, polo, estrellas = [], suelo = [];
  let horas = sinMovimiento() || decorativo ? 3.5 : 0;
  let desvanecer = 0;

  function preparar() {
    ({ ctx, ancho, alto } = ajustarLienzo(canvas, decorativo ? null : 0.62));
    polo = decorativo
      ? { x: ancho * (ancho > 700 ? 0.7 : 0.62), y: alto * 0.3 }
      : { x: ancho * 0.5, y: alto * 0.4 };
    const radioMax = Math.hypot(Math.max(polo.x, ancho - polo.x), Math.max(polo.y, alto - polo.y));
    const n = Math.round((ancho * alto) / (decorativo ? 1900 : 1500));
    const r2 = azar(decorativo ? 11 : 29);
    estrellas = Array.from({ length: n }, () => {
      const brillo = Math.pow(r2(), 3.2);
      return {
        r: Math.sqrt(r2()) * radioMax,
        a: r2() * VUELTA,
        brillo,
        ancho: 0.5 + brillo * 1.6,
        tono: r2() < 0.15 ? 'calida' : r2() < 0.3 ? 'fria' : 'blanca',
      };
    });
    // Polaris, a menos de un grado del polo: un arco diminuto
    estrellas.push({ r: Math.max(2.5, ancho * 0.004), a: 1, brillo: 1, ancho: 2.4, tono: 'polaris' });
    // Silueta del horizonte
    suelo = [];
    const base = alto * (decorativo ? 0.9 : 0.86);
    for (let x = 0, i = 0; x <= ancho + 20; x += 20, i++) {
      suelo.push([x, base - Math.sin(i * 0.35) * alto * 0.025 - Math.sin(i * 0.11 + 1) * alto * 0.04 - rnd() * 3]);
    }
  }

  function colorDe(e, alfa) {
    if (e.tono === 'polaris') return `rgba(245, 222, 160, ${alfa})`;
    if (e.tono === 'calida') return `rgba(255, 214, 170, ${alfa})`;
    if (e.tono === 'fria') return `rgba(190, 210, 255, ${alfa})`;
    return `rgba(243, 236, 216, ${alfa})`;
  }

  function dibujar() {
    const cielo = ctx.createLinearGradient(0, 0, 0, alto);
    cielo.addColorStop(0, '#0c1528');
    cielo.addColorStop(0.75, '#16264a');
    cielo.addColorStop(1, '#22365e');
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, ancho, alto);

    const giro = (horas / 24) * VUELTA;
    const opacidad = 1 - desvanecer;
    ctx.lineCap = 'round';
    for (const e of estrellas) {
      const fin = e.a - giro; // hacia el norte, el cielo gira en sentido antihorario
      const alfa = (0.25 + e.brillo * 0.75) * opacidad;
      if (giro > 0.002) {
        ctx.beginPath();
        ctx.strokeStyle = colorDe(e, alfa * (decorativo ? 0.55 : 0.7));
        ctx.lineWidth = e.ancho;
        ctx.arc(polo.x, polo.y, e.r, e.a, fin, true);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.fillStyle = colorDe(e, Math.min(1, alfa + 0.15));
      ctx.arc(polo.x + Math.cos(fin) * e.r, polo.y + Math.sin(fin) * e.r, e.ancho * 0.9, 0, VUELTA);
      ctx.fill();
    }

    ctx.fillStyle = '#0a1122';
    ctx.beginPath();
    ctx.moveTo(0, alto);
    suelo.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(ancho, alto);
    ctx.closePath();
    ctx.fill();

    if (!decorativo) {
      ctx.font = '500 13px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(235, 229, 213, .85)';
      ctx.textBaseline = 'top';
      const h = Math.floor(horas), m = Math.floor((horas - h) * 60);
      ctx.fillText(`Tiempo de exposición: ${h} h ${String(m).padStart(2, '0')} min`, 14, 12);
      ctx.fillStyle = 'rgba(245, 222, 160, .95)';
      ctx.fillText('Polaris', polo.x + 10, polo.y + 6);
      ctx.fillStyle = 'rgba(235, 229, 213, .6)';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Mirando al norte', 14, alto - 10);
    }
  }

  function paso(dt) {
    if (desvanecer > 0) {
      desvanecer += dt * 1.6;
      if (desvanecer >= 1) { desvanecer = 0; horas = 0; }
    } else {
      horas += dt * HORAS_POR_SEGUNDO * (decorativo ? 0.35 : 1);
      if (horas >= HORAS_MAX) desvanecer = 0.001;
    }
    dibujar();
  }

  preparar();
  dibujar();
  const anim = bucle(canvas, paso);
  if (sinMovimiento()) anim.pausar();

  let botonPausa;
  if (conControles) {
    const barra = barraControles(canvas.parentElement);
    botonPausa = boton(anim.activo ? 'Pausar' : 'Reproducir', () => {
      if (anim.activo) anim.pausar(); else anim.reanudar();
      botonPausa.textContent = anim.activo ? 'Pausar' : 'Reproducir';
    });
    barra.append(
      botonPausa,
      boton('Empezar la noche de nuevo', () => { horas = 0; desvanecer = 0; dibujar(); }),
    );
  }

  const alRedimensionar = () => { preparar(); dibujar(); };
  const ro = new ResizeObserver(() => {
    if (Math.abs((canvas.clientWidth || 0) - ancho) > 2) alRedimensionar();
  });
  ro.observe(canvas.parentElement);

  return {
    destruir() { anim.destruir(); ro.disconnect(); },
  };
}
