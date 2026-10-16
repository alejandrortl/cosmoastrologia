// Utilidades compartidas por las animaciones.

export const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function color(nombre, defecto) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return v || defecto;
}

// Ajusta un canvas a su tamaño en pantalla con buena nitidez. Devuelve {ctx, ancho, alto}.
export function ajustarLienzo(canvas, proporcion) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ancho = canvas.clientWidth || canvas.parentElement.clientWidth;
  const alto = proporcion ? Math.round(ancho * proporcion) : (canvas.clientHeight || canvas.parentElement.clientHeight);
  canvas.width = Math.round(ancho * dpr);
  canvas.height = Math.round(alto * dpr);
  if (proporcion) canvas.style.height = `${alto}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, ancho, alto };
}

// Bucle de animación que solo corre cuando el elemento está a la vista y no está en pausa.
export function bucle(elemento, paso) {
  let visible = false, activo = true, id = 0, ultimo = 0;
  const marco = (t) => {
    const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0;
    ultimo = t;
    paso(dt);
    id = requestAnimationFrame(marco);
  };
  const decidir = () => {
    cancelAnimationFrame(id); ultimo = 0;
    if (visible && activo) id = requestAnimationFrame(marco);
  };
  const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; decidir(); });
  obs.observe(elemento);
  return {
    pausar() { activo = false; decidir(); },
    reanudar() { activo = true; decidir(); },
    get activo() { return activo; },
    destruir() { obs.disconnect(); cancelAnimationFrame(id); },
  };
}

export function boton(texto, onClick, extra = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'control';
  b.textContent = texto;
  b.addEventListener('click', onClick);
  Object.entries(extra).forEach(([k, v]) => b.setAttribute(k, v));
  return b;
}

export function barraControles(figura) {
  const c = document.createElement('div');
  c.className = 'controles';
  figura.after(c);
  return c;
}

// Generador pseudoaleatorio con semilla, para que el cielo sea siempre el mismo.
export function azar(semilla = 7) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const svgNS = 'http://www.w3.org/2000/svg';
