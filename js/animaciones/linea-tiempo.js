// Línea del tiempo de las culturas y el modelo del mundo que usaron.
// Está hecha en HTML (no en SVG) para que crezca con el tamaño de letra y se pueda leer en el móvil.
// La escala del tiempo es por tramos: los milenios antiguos se comprimen para que quepan.

import { MODELOS, CULTURAS, textoAnio } from './datos-modelos.js';
import { boton, barraControles } from './comun.js';

const ESCALA = [[-3000, 0], [-500, 0.28], [1500, 0.66], [2026, 1]];
const MARCAS = [-3000, -1500, -500, 0, 500, 1000, 1500, 1800, 2026];

function posicion(anio) {
  for (let i = 1; i < ESCALA.length; i++) {
    const [a0, p0] = ESCALA[i - 1], [a1, p1] = ESCALA[i];
    if (anio <= a1) return p0 + ((Math.max(anio, a0) - a0) / (a1 - a0)) * (p1 - p0);
  }
  return 1;
}

function fondoTramo(modelos) {
  if (modelos.length === 1) {
    const m = modelos[0];
    return m === 'sin-documentar'
      ? `repeating-linear-gradient(135deg, ${MODELOS[m].color} 0 4px, transparent 4px 8px)`
      : MODELOS[m].color;
  }
  // Varios modelos: franjas horizontales, una por modelo
  const paso = 100 / modelos.length;
  return `linear-gradient(to bottom, ${modelos.map((m, i) => `${MODELOS[m].color} ${i * paso}% ${(i + 1) * paso}%`).join(', ')})`;
}

export function lineaTiempo(contenedor) {
  const raiz = document.createElement('div');
  raiz.className = 'linea-tiempo';
  raiz.setAttribute('role', 'img');
  raiz.setAttribute('aria-label', 'Línea del tiempo: qué modelo del mundo usó cada cultura, desde el 3000 antes de Cristo hasta hoy. El mismo contenido está en el texto que sigue.');

  const leyenda = document.createElement('div');
  leyenda.className = 'lt-leyenda';
  leyenda.innerHTML = ['plana-geo', 'esferica-geo', 'esferica-helio', 'sin-documentar'].map((m) =>
    `<span><i style="background:${fondoTramo([m])}"></i>${MODELOS[m].corto}</span>`).join('') +
    '<span><i style="background:' + fondoTramo(['plana-geo', 'esferica-geo']) + '"></i>Dos franjas: convivieron o se debate</span>';

  const filas = document.createElement('div');
  filas.className = 'lt-filas';
  filas.innerHTML = CULTURAS.map((c) => `
    <div class="lt-fila" data-modelos="${[...new Set(c.tramos.flatMap((t) => t[2]))].join(' ')}">
      <span class="lt-nombre">${c.nombre}${c.nota ? `<small>${c.nota}</small>` : ''}</span>
      <span class="lt-pista">${c.tramos.map(([d, h, ms]) => {
        const iz = posicion(d) * 100, an = Math.max(1.2, (posicion(h) - posicion(d)) * 100);
        return `<i style="left:${iz}%;width:${an}%;background:${fondoTramo(ms)}" title="${textoAnio(d)} – ${textoAnio(h)}: ${ms.map((m) => MODELOS[m].nombre).join(' / ')}"></i>`;
      }).join('')}</span>
    </div>`).join('');

  const eje = document.createElement('div');
  eje.className = 'lt-eje';
  eje.innerHTML = `<span class="lt-nombre"></span><span class="lt-pista">${MARCAS.map((a) =>
    `<b class="${[-1500, 0, 1000, 1800].includes(a) ? 'menor' : ''}" style="left:${posicion(a) * 100}%">${a === 2026 ? 'hoy' : a < 0 ? `${-a}<br>a. C.` : a}</b>`).join('')}</span>`;

  raiz.append(leyenda, filas, eje);
  contenedor.append(raiz);

  // Filtro: resaltar las culturas de un modelo
  const barra = barraControles(contenedor);
  const fila = document.createElement('div');
  fila.className = 'grupo-botones';
  fila.setAttribute('role', 'group');
  fila.setAttribute('aria-label', 'Resaltar un modelo');
  const opciones = [['todos', 'Todos'], ['plana-geo', 'Plana'], ['esferica-geo', 'Esférica geocéntrica'], ['esferica-helio', 'Heliocéntrica'], ['sin-documentar', 'No documentado']];
  const botones = opciones.map(([id, t]) => {
    const b = boton(t, () => elegir(id), { 'aria-pressed': String(id === 'todos') });
    b.dataset.id = id;
    return b;
  });
  fila.append(...botones);
  const nota = document.createElement('p');
  nota.className = 'lectura-dato';
  nota.textContent = 'La escala del tiempo no es uniforme: los milenios más antiguos están comprimidos.';
  barra.append(nota, fila);

  function elegir(id) {
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    filas.querySelectorAll('.lt-fila').forEach((f) => {
      f.classList.toggle('apagada', id !== 'todos' && !f.dataset.modelos.split(' ').includes(id));
    });
  }
  return { destruir() {} };
}
