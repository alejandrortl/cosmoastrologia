// Interactivo: cómo se ven los ocho tipos de eclipse desde el suelo.
// Es observación: no presupone ningún modelo. Esquema, no a escala.

import { svgNS, boton, barraControles } from './comun.js';

const TIPOS = [
  { id: 'sol-total', grupo: 'Sol', nombre: 'Total', texto: 'El disco del Sol queda tapado por completo durante unos minutos como mucho, y alrededor aparece la corona, un halo blanquecino.' },
  { id: 'sol-parcial', grupo: 'Sol', nombre: 'Parcial', texto: 'Un disco oscuro tapa solo una parte del Sol, que queda como un bocado.' },
  { id: 'sol-anular', grupo: 'Sol', nombre: 'Anular', texto: 'Se tapa el centro del Sol, pero queda a la vista un anillo brillante alrededor.' },
  { id: 'sol-hibrido', grupo: 'Sol', nombre: 'Híbrido', texto: 'El mismo eclipse se ve total en unos lugares y anular en otros a lo largo de su franja.' },
  { id: 'luna-total', grupo: 'Luna', nombre: 'Total', texto: 'La Luna llena entera se oscurece y toma un color rojizo o cobrizo; no desaparece.' },
  { id: 'luna-parcial', grupo: 'Luna', nombre: 'Parcial', texto: 'Solo una parte de la Luna entra en una sombra oscura de borde curvo.' },
  { id: 'luna-penumbral', grupo: 'Luna', nombre: 'Penumbral', texto: 'La Luna apenas se oscurece por un lado; a menudo no se nota a simple vista.' },
  { id: 'luna-penumbral-total', grupo: 'Luna', nombre: 'Penumbral total', texto: 'Toda la Luna se oscurece levemente, sin llegar a la sombra oscura. Es poco frecuente.' },
];

const W = 640, H = 300;

function el(tag, attrs = {}, padre) {
  const e = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.append(e);
  return e;
}

let contador = 0;

export function tiposEclipse(contenedor) {
  const id = `ecl${++contador}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'escena', role: 'img' });
  contenedor.append(svg);
  svg.innerHTML = `
    <defs>
      <radialGradient id="${id}-corona"><stop offset="0.45" stop-color="#fff8e6" stop-opacity=".95"/><stop offset="0.62" stop-color="#e9e3d4" stop-opacity=".45"/><stop offset="1" stop-color="#e9e3d4" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-sol"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#f2c85a"/></radialGradient>
      <radialGradient id="${id}-roja" cx=".42" cy=".4"><stop offset="0" stop-color="#c8643c"/><stop offset="1" stop-color="#6e2416"/></radialGradient>
      <radialGradient id="${id}-luna" cx=".45" cy=".42"><stop offset="0" stop-color="#f3eedf"/><stop offset="1" stop-color="#c9c2ae"/></radialGradient>
      <linearGradient id="${id}-penumbra" x1="0" x2="1"><stop offset="0" stop-color="#0a1224" stop-opacity=".55"/><stop offset=".6" stop-color="#0a1224" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}-clip"><circle cx="0" cy="0" r="88"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#0f1930"/>
    <g class="escena-eclipse" transform="translate(${W / 2} ${H / 2})"></g>`;
  const g = svg.querySelector('.escena-eclipse');

  const dibujos = {
    'sol-total': () => `<circle r="150" fill="url(#${id}-corona)"/><circle r="80" fill="#05070d"/>`,
    'sol-parcial': () => `<rect x="-${W}" y="-${H}" width="${W * 2}" height="${H * 2}" fill="#2a4a78"/><circle r="80" fill="url(#${id}-sol)"/><circle cx="52" cy="-18" r="82" fill="#1d2f52"/>`,
    'sol-anular': () => `<circle r="80" fill="url(#${id}-sol)"/><circle r="70" fill="#121b31"/>`,
    'sol-hibrido': () => `
      <g transform="translate(-150 0) scale(.7)"><circle r="150" fill="url(#${id}-corona)"/><circle r="80" fill="#05070d"/></g>
      <g transform="translate(150 0) scale(.7)"><circle r="80" fill="url(#${id}-sol)"/><circle r="72" fill="#121b31"/></g>
      <text x="-150" y="118" text-anchor="middle" font-size="15" fill="#a9b2c4" font-family="IBM Plex Sans, system-ui, sans-serif">En unos lugares, total</text>
      <text x="150" y="118" text-anchor="middle" font-size="15" fill="#a9b2c4" font-family="IBM Plex Sans, system-ui, sans-serif">En otros, anular</text>`,
    'luna-total': () => `<circle r="88" fill="url(#${id}-roja)"/>`,
    'luna-parcial': () => `<circle r="88" fill="url(#${id}-luna)"/><g clip-path="url(#${id}-clip)"><circle cx="-120" cy="40" r="150" fill="#4a1d14" opacity=".88"/></g>`,
    'luna-penumbral': () => `<circle r="88" fill="url(#${id}-luna)"/><circle r="88" fill="url(#${id}-penumbra)"/>`,
    'luna-penumbral-total': () => `<circle r="88" fill="url(#${id}-luna)"/><circle r="88" fill="#0a1224" opacity=".38"/><circle r="88" fill="url(#${id}-penumbra)" opacity=".6"/>`,
  };

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  barra.append(dato);
  const botones = [];
  for (const grupo of ['Sol', 'Luna']) {
    const fila = document.createElement('div');
    fila.className = 'grupo-botones';
    fila.setAttribute('role', 'group');
    fila.setAttribute('aria-label', `Eclipses de ${grupo}`);
    const rot = document.createElement('span');
    rot.textContent = `De ${grupo}:`;
    fila.append(rot);
    TIPOS.filter((t) => t.grupo === grupo).forEach((t) => {
      const b = boton(t.nombre, () => fijar(t), { 'aria-pressed': 'false' });
      b.dataset.tipo = t.id;
      botones.push(b);
      fila.append(b);
    });
    barra.append(fila);
  }

  function fijar(t) {
    g.innerHTML = dibujos[t.id]();
    botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === t.id)));
    dato.innerHTML = `<strong>Eclipse ${t.grupo === 'Sol' ? 'de Sol' : 'de Luna'} ${t.nombre.toLowerCase()}</strong>: ${t.texto}`;
    svg.setAttribute('aria-label', `Esquema: ${dato.textContent}`);
  }
  fijar(TIPOS[0]);
  return { destruir() {} };
}
