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

// Proporción del tamaño de letra elegido por el lector (1 = normal).
export function escalaLetra() {
  return (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
}

// Los dibujos SVG se encogen con la pantalla y sus rótulos se vuelven diminutos en el móvil.
// Esto agranda cada rótulo lo justo para que se lea a un tamaño mínimo en pantalla,
// siguiendo también el tamaño de letra elegido, hasta 1,5 veces su tamaño de diseño para que
// no se monten unos sobre otros. Para leerlos más grandes, cada dibujo se puede ampliar.
const MINIMO_PANTALLA = 11.5; // píxeles con letra normal

export function rotulosLegibles(svg) {
  const vb = svg.viewBox?.baseVal;
  if (!vb || !vb.width) return () => {};
  let pendiente = 0;
  const ajustar = () => {
    pendiente = 0;
    const ancho = svg.getBoundingClientRect().width;
    if (!ancho) return;
    const unidadesPorPixel = vb.width / ancho;
    const u = escalaLetra();
    const tope = parseFloat(svg.dataset.crecimientoMax) || 1.5;
    svg.querySelectorAll('text').forEach((t) => {
      if (!t.dataset.base) t.dataset.base = t.getAttribute('font-size') || '14';
      const base = parseFloat(t.dataset.base);
      const tam = Math.min(base * tope, Math.max(base * Math.min(u, tope), MINIMO_PANTALLA * u * unidadesPorPixel));
      const nuevo = tam.toFixed(1);
      if (t.getAttribute('font-size') !== nuevo) t.setAttribute('font-size', nuevo);
    });
  };
  const programar = () => { if (!pendiente) pendiente = requestAnimationFrame(ajustar); };
  const ro = new ResizeObserver(programar);
  ro.observe(svg);
  // Los rótulos que se dibujan de nuevo (al cambiar de opción) también se ajustan
  const mo = new MutationObserver(programar);
  mo.observe(svg, { childList: true, subtree: true });
  window.addEventListener('cambio-letra', programar);
  ajustar();
  return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener('cambio-letra', programar); cancelAnimationFrame(pendiente); };
}

// Foto fija de un dibujo (SVG o canvas) en alta resolución, para abrirla en el visor con zoom.
export async function instantanea(contenedor) {
  const canvas = contenedor.querySelector('canvas');
  if (canvas) return canvas.toDataURL('image/png');
  const svg = contenedor.querySelector('svg.escena');
  if (!svg) return null;
  const vb = svg.viewBox.baseVal;
  const copia = svg.cloneNode(true);
  copia.querySelectorAll('text').forEach((t) => { if (t.dataset.base) t.setAttribute('font-size', t.dataset.base); });
  copia.setAttribute('xmlns', svgNS);
  copia.setAttribute('width', vb.width);
  copia.setAttribute('height', vb.height);
  const datos = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copia));
  const img = new Image();
  await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = datos; });
  const escala = Math.max(2, 2400 / vb.width);
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(vb.width * escala);
  lienzo.height = Math.round(vb.height * escala);
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#0f1930';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL('image/png');
}
