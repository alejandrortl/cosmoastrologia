// Interactivo: cuaderno de misiones de observación. Cada misión se puede marcar como hecha y
// llevar una nota. Se guarda solo en este navegador (localStorage): es un cuaderno personal.

import { barraControles } from './comun.js';

export const MISIONES = [
  ['norte', 'Encuentra el norte o el sur de tu casa', 'Fácil', 'Cualquier noche despejada'],
  ['latitud', 'Mide tu latitud con la mano', 'Fácil', 'Cualquier noche despejada'],
  ['saltos', 'Recorre los saltos de estrella de la estación', 'Fácil', 'Cualquier noche sin Luna'],
  ['luna', 'Sigue a la Luna durante una semana', 'Paciencia', 'Desde la Luna nueva hasta la llena'],
  ['madrugan', 'Comprueba que las estrellas madrugan', 'Media', 'Dos noches separadas una semana'],
  ['planeta', 'Distingue un planeta de una estrella', 'Media', 'Varias semanas'],
  ['sombra', 'Encuentra el mediodía con la sombra de un palo', 'Fácil', 'Un día de sol'],
  ['horizonte', 'Sigue al Sol por el horizonte', 'Paciencia', 'Una vez cada dos semanas, durante meses'],
  ['lluvia', 'Cuenta estrellas fugaces', 'Media', 'El máximo de una lluvia, según el calendario'],
  ['giro', 'Fotografía el giro del cielo', 'Media', 'Una noche despejada, con trípode'],
];

const CLAVE = 'misiones-observacion';
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, JSON.stringify(v)); return true; } catch (e) { return false; } };

export function misiones(contenedor) {
  let estado = leer();
  const raiz = document.createElement('div');
  raiz.className = 'misiones';
  contenedor.append(raiz);
  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  barra.append(dato);
  const fFecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const escHTML = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function pintar() {
    raiz.innerHTML = `<ol>${MISIONES.map(([id, titulo, nivel, cuando], i) => {
      const e = estado[id] || {};
      return `<li class="mision${e.hecha ? ' hecha' : ''}">
        <label class="mision-cabeza"><input type="checkbox" data-id="${id}"${e.hecha ? ' checked' : ''}>
          <span><strong>${i + 1}. ${titulo}</strong><small>${nivel} · ${cuando}${e.hecha ? ` · hecha el ${fFecha.format(new Date(e.hecha))}` : ''}</small></span></label>
        <details${e.nota ? ' open' : ''}><summary>Mis notas</summary>
          <textarea data-nota="${id}" rows="3" placeholder="Qué viste, dónde, a qué hora…">${escHTML(e.nota || '')}</textarea></details>
      </li>`;
    }).join('')}</ol>`;
    const hechas = MISIONES.filter(([id]) => estado[id]?.hecha).length;
    dato.innerHTML = `<strong>${hechas} de ${MISIONES.length}</strong> misiones hechas. Las marcas y las notas se guardan solo en este navegador.`;
  }

  raiz.addEventListener('change', (ev) => {
    const c = ev.target.closest('input[type=checkbox]');
    if (!c) return;
    const e = estado[c.dataset.id] || {};
    e.hecha = c.checked ? new Date().toISOString() : null;
    estado[c.dataset.id] = e;
    if (!guardar(estado)) dato.textContent = 'Este navegador no deja guardar las marcas: se perderán al cerrar la página.';
    pintar();
  });
  let tempo = 0;
  raiz.addEventListener('input', (ev) => {
    const t = ev.target.closest('textarea[data-nota]');
    if (!t) return;
    (estado[t.dataset.nota] ||= {}).nota = t.value;
    clearTimeout(tempo);
    tempo = setTimeout(() => guardar(estado), 400);
  });

  pintar();
  return { destruir() { clearTimeout(tempo); guardar(estado); } };
}
