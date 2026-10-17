import { listarModulos, cargarModulo, urlMedio } from './datos.js';
import { Lector } from './lector.js';
import { montarAnimacion } from './animaciones/index.js';
import { instantanea } from './animaciones/comun.js';
import { arcosPolaris } from './animaciones/arcos-polaris.js';
import { abrirVisor, cerrarVisor, visorAbierto, consumirAtrasPropio } from './visor.js';

const principal = document.getElementById('principal');
let limpiezas = [];
let lector = null;
let cacheModulos = null;

const icono = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm1 2v2h2v2h-2v2H9v-2H7V9h2V7h2Z"/></svg>',
  auriculares: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-1a7 7 0 0 1 14 0v1h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z"/></svg>',
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function sesion(clave, valor) {
  // sessionStorage puede no existir o fallar (modo privado); nada de esto es imprescindible
  try {
    if (valor === undefined) return JSON.parse(sessionStorage.getItem(clave) || 'null');
    if (valor === null) sessionStorage.removeItem(clave);
    else sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch (e) { return null; }
  return null;
}

function aSlug(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function limpiar() {
  limpiezas.forEach((f) => { try { f(); } catch (e) { /* nada */ } });
  limpiezas = [];
  if (lector) { lector.destruir(); lector = null; }
}

async function modulos() {
  if (!cacheModulos) cacheModulos = await listarModulos();
  return cacheModulos;
}

/* ---------------- Portada ---------------- */

async function portada() {
  document.title = 'Cosmoastrología — astronomía y astrología comparada';
  principal.innerHTML = `
    <section class="portada">
      <canvas aria-hidden="true"></canvas>
      <div class="portada-texto">
        <h1>El cielo, leído de muchas maneras</h1>
        <p>Un curso de astronomía y astrología comparada. Primero, lo que cualquiera puede observar; después, cómo lo explica cada cosmovisión, con su propia lógica y sus propias fuentes.</p>
        <div class="acciones">
          <a class="boton" href="/modulo/mirar-el-cielo" data-enlace>Empezar por el módulo 1</a>
          <a class="boton secundario" href="/modulo/introduccion" data-enlace>Leer los principios del curso</a>
        </div>
      </div>
    </section>
    <section class="temario" aria-labelledby="t-temario">
      <h2 id="t-temario">Temario</h2>
      <p>Cada módulo va de lo accesible a lo profundo. Puedes leerlo o escucharlo como un audiolibro.</p>
      <ol class="lista-modulos" aria-busy="true"><li class="estado">Cargando el temario…</li></ol>
    </section>`;

  const lienzo = principal.querySelector('.portada canvas');
  const anim = arcosPolaris(lienzo, { decorativo: true });
  limpiezas.push(() => anim.destruir());

  const lista = principal.querySelector('.lista-modulos');
  try {
    const todos = await modulos();
    lista.innerHTML = todos.filter((m) => m.numero > 0).map((m) => {
      const dentro = `
        <span class="numero-modulo" aria-hidden="true">${m.numero}</span>
        <span>
          <span class="titulo-modulo"><span class="visualmente-oculto">Módulo ${m.numero}: </span>${esc(m.titulo)}</span>
          <span class="resumen-modulo">${esc(m.resumen)}</span>
          <span class="estado">${m.publicado ? 'Disponible para leer y escuchar' : 'En preparación'}</span>
        </span>`;
      return `<li>${m.publicado
        ? `<a class="fila-modulo" href="/modulo/${m.slug}" data-enlace>${dentro}</a>`
        : `<div class="fila-modulo">${dentro}</div>`}</li>`;
    }).join('');
  } catch (e) {
    lista.innerHTML = `<li class="aviso">No se ha podido cargar el temario. Comprueba tu conexión y recarga la página.</li>`;
  }
  lista.removeAttribute('aria-busy');
}

/* ---------------- Módulo ---------------- */

// Qué es cada imagen, para que el lector sepa si es una foto, una obra antigua o un dibujo.
const TIPOS_IMAGEN = {
  foto: 'Fotografía real',
  obra: 'Obra histórica',
  esquema: 'Esquema',
  ia: 'Imagen generada por IA',
};

function etiquetas(...textos) {
  const t = textos.filter(Boolean);
  return t.length ? `<p class="etiquetas">${t.map((x, i) => `<span class="etiqueta${i === 0 ? ' principal' : ''}">${esc(x)}</span>`).join('')}</p>` : '';
}

function htmlBloque(b) {
  const c = b.contenido || {};
  switch (b.tipo) {
    case 'texto':
      return `<div class="texto">${c.html || ''}</div>`;
    case 'imagen': {
      const fuente = c.enlace
        ? `<a href="${esc(c.enlace)}" target="_blank" rel="noopener">${esc(c.credito || 'Ver fuente')}</a>`
        : esc(c.credito || '');
      return `<figure class="figura figura-imagen">
        ${etiquetas(TIPOS_IMAGEN[c.tipo] || TIPOS_IMAGEN.foto, c.fecha)}
        <div class="marco-imagen"><button type="button" class="ampliar" aria-label="Ampliar la imagen">
          <img src="${esc(urlMedio(c))}" data-grande="${esc(c.grande || '')}" data-iiif="${esc(c.iiif || '')}" data-tam="${esc((c.tam || []).join(','))}" alt="${esc(c.alt || c.pie || '')}" loading="lazy" decoding="async">
          <span class="ampliar-icono" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm1 2v2h2v2h-2v2H9v-2H7V9h2V7h2Z"/></svg></span>
        </button></div>
        <figcaption>${esc(c.pie || '')}
          ${fuente ? `<span class="credito">${fuente}${c.licencia ? `, ${esc(c.licencia)}` : ''}</span>` : ''}
        </figcaption></figure>`;
    }
    case 'audio':
      return `<figure class="figura audio-bloque"><audio controls preload="none" src="${esc(urlMedio(c))}"></audio>
        ${c.titulo ? `<figcaption>${esc(c.titulo)}</figcaption>` : ''}</figure>`;
    case 'animacion':
    case 'interactivo':
      return `<figure class="figura" data-componente="${esc(c.componente)}">
        ${etiquetas(c.etiqueta || (b.tipo === 'animacion' ? 'Animación' : 'Interactivo'), c.modelo)}
        <div class="lienzo"><button type="button" class="ampliar-dibujo" aria-label="Ampliar el dibujo a pantalla completa">${icono.lupa}</button></div>
        ${c.pie ? `<figcaption>${esc(c.pie)}</figcaption>` : ''}</figure>`;
    case 'fuente':
      return `<p class="fuente">${esc(c.cita || '')}${c.url ? ` <a href="${esc(c.url)}" target="_blank" rel="noopener">Ver fuente</a>` : ''}</p>`;
    default:
      return '';
  }
}

async function paginaModulo(slug) {
  principal.innerHTML = `<p class="aviso">Cargando el módulo…</p>`;
  let modulo;
  try {
    modulo = await cargarModulo(slug);
  } catch (e) {
    principal.innerHTML = `<p class="aviso">No se ha podido cargar el módulo. Comprueba tu conexión y recarga la página.</p>`;
    return;
  }
  if (!modulo) {
    principal.innerHTML = `<p class="aviso">Este módulo no existe. <a href="/" data-enlace>Volver al temario</a></p>`;
    return;
  }
  if (!modulo.publicado || !modulo.secciones.length) {
    principal.innerHTML = `<p class="aviso">«${esc(modulo.titulo)}» está en preparación. <a href="/" data-enlace>Volver al temario</a></p>`;
    return;
  }

  document.title = `${modulo.titulo} — Cosmoastrología`;
  const etiqueta = modulo.numero === 0 ? 'Antes de empezar' : `Módulo ${modulo.numero}`;

  const todos = await modulos().catch(() => []);
  const publicados = todos.filter((m) => m.publicado);
  const i = publicados.findIndex((m) => m.slug === slug);
  const anterior = publicados[i - 1];
  const siguiente = publicados[i + 1];

  principal.innerHTML = `
    <div class="modulo">
      <header class="encabezado-modulo">
        <p class="numero">${etiqueta}</p>
        <h1>${esc(modulo.titulo)}</h1>
        ${modulo.resumen ? `<p class="resumen">${esc(modulo.resumen)}</p>` : ''}
        <button class="boton escuchar-todo" type="button">${icono.auriculares}<span>Escuchar el módulo</span></button>
      </header>
      <nav class="indice" aria-label="Secciones del módulo">
        <details${matchMedia('(min-width: 1100px)').matches && !('letraGrande' in document.documentElement.dataset) ? ' open' : ''}>
          <summary>En este módulo</summary>
          <ol>${modulo.secciones.map((s) => `<li><a href="#${s.slug}">${esc(s.titulo)}</a></li>`).join('')}</ol>
        </details>
      </nav>
      <article class="lectura">
        ${modulo.secciones.map((s) => `
          <section class="seccion" id="${s.slug}" aria-labelledby="h-${s.slug}">
            <div class="seccion-cabecera">
              <h2 id="h-${s.slug}">${esc(s.titulo)}</h2>
              <button class="escuchar-aqui" type="button" aria-label="Escuchar desde «${esc(s.titulo)}»" title="Escuchar desde aquí">${icono.play}</button>
            </div>
            ${s.bloques.map(htmlBloque).join('')}
          </section>`).join('')}
        <nav class="pie-modulo" aria-label="Otros módulos">
          <div>${anterior ? `<a href="/modulo/${anterior.slug}" data-enlace><span>Anterior</span>${esc(anterior.titulo)}</a>` : ''}</div>
          <div style="text-align:right">${siguiente ? `<a href="/modulo/${siguiente.slug}" data-enlace><span>Siguiente</span>${esc(siguiente.titulo)}</a>` : `<a href="/" data-enlace><span>Volver</span>Temario</a>`}</div>
        </nav>
      </article>
    </div>`;

  // Si una foto no carga, se deja el pie con el enlace a la fuente
  principal.querySelectorAll('.figura-imagen img').forEach((img) => {
    img.addEventListener('error', () => {
      img.closest('.marco-imagen').innerHTML = '<p class="imagen-no-disponible">La imagen no se ha podido cargar ahora. Puedes verla en su fuente, enlazada abajo.</p>';
    }, { once: true });
  });
  // Tocar una foto la abre a pantalla completa con zoom
  const figuras = [...principal.querySelectorAll('.figura-imagen')];
  principal.querySelectorAll('.figura-imagen .ampliar').forEach((b) => {
    b.addEventListener('click', () => {
      const img = b.querySelector('img');
      const fig = b.closest('figure');
      // Si el navegador del móvil recarga la pestaña con la imagen abierta (por ejemplo, por falta
      // de memoria), al volver a pintar el módulo se regresa a esta misma imagen.
      sesion('volverA', { slug, figura: figuras.indexOf(fig), t: Date.now() });
      abrirVisor({
        alCerrar: () => sesion('volverA', null),
        src: img.currentSrc || img.src,
        grande: img.dataset.grande,
        iiif: img.dataset.iiif,
        tam: img.dataset.tam ? img.dataset.tam.split(',').map(Number) : null,
        alt: img.alt,
        pie: fig.querySelector('figcaption')?.firstChild?.textContent?.trim(),
        credito: fig.querySelector('.credito')?.textContent?.trim(),
      });
    });
  });

  // Animaciones e interactivos
  principal.querySelectorAll('[data-componente]').forEach((fig) => {
    const des = montarAnimacion(fig.dataset.componente, fig.querySelector('.lienzo'));
    if (des) limpiezas.push(des);
  });

  // Ampliar un dibujo: se abre una imagen fija en alta resolución en el visor con zoom
  principal.querySelectorAll('.ampliar-dibujo').forEach((b) => {
    b.addEventListener('click', async () => {
      const fig = b.closest('figure');
      try {
        const src = await instantanea(fig.querySelector('.lienzo'));
        if (!src) return;
        abrirVisor({
          src,
          alt: fig.querySelector('[role="img"]')?.getAttribute('aria-label') || '',
          pie: fig.querySelector('figcaption')?.textContent?.trim(),
          credito: [...fig.querySelectorAll('.etiqueta')].map((e) => e.textContent).join(', '),
        });
      } catch (e) { /* si no se puede, no pasa nada */ }
    });
  });

  // Audiolibro
  const articulo = principal.querySelector('.lectura');
  lector = new Lector(articulo, document.getElementById('reproductor'), {
    clave: slug, titulo: modulo.titulo,
  });
  principal.querySelector('.escuchar-todo').addEventListener('click', () => lector.reproducirDesde(lector.posicionGuardada()));
  principal.querySelectorAll('.escuchar-aqui').forEach((b) => {
    b.addEventListener('click', () => lector.reproducirDesdeElemento(b.closest('.seccion').querySelector('h2')));
  });

  montarIndice(modulo);

  const volver = sesion('volverA');
  if (volver && volver.slug === slug && Date.now() - volver.t < 30 * 60 * 1000 && figuras[volver.figura]) {
    sesion('volverA', null);
    const fig = figuras[volver.figura];
    const ir = () => fig.scrollIntoView({ block: 'center' });
    ir();
    // Las imágenes de más arriba pueden terminar de cargar y desplazar la página: se corrige una vez
    setTimeout(ir, 600);
  } else if (location.hash) {
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }
}

/* ---------------- Índice del módulo ---------------- */

// Da un id a cada apartado (h3) y construye el índice: secciones y, dentro, sus apartados.
// Se muestra en la barra lateral en pantallas anchas y, en el móvil, en un panel que se abre
// con un botón fijo, para saltar a cualquier punto sin volver al principio.
function montarIndice(modulo) {
  const usados = new Set();
  const arbol = modulo.secciones.map((s) => {
    const seccion = document.getElementById(s.slug);
    const apartados = [...(seccion?.querySelectorAll('.texto h3') || [])].map((h) => {
      let id = `${s.slug}--${aSlug(h.textContent)}`;
      for (let n = 2; usados.has(id); n++) id = `${s.slug}--${aSlug(h.textContent)}-${n}`;
      usados.add(id);
      h.id = id;
      return { id, titulo: h.textContent.trim() };
    });
    return { id: s.slug, titulo: s.titulo, apartados };
  });

  const lista = arbol.map((s) => `<li><a href="#${s.id}" data-salto>${esc(s.titulo)}</a>${s.apartados.length
    ? `<ol class="apartados">${s.apartados.map((a) => `<li><a href="#${a.id}" data-salto>${esc(a.titulo)}</a></li>`).join('')}</ol>`
    : ''}</li>`).join('');

  // Barra lateral / desplegable de arriba
  const ol = principal.querySelector('.indice ol');
  if (ol) ol.innerHTML = lista;

  // Botón fijo y panel
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-indice';
  boton.setAttribute('aria-haspopup', 'dialog');
  boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8z"/></svg><span>Índice</span>';
  const panel = document.createElement('div');
  panel.className = 'panel-indice';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'titulo-panel-indice');
  panel.innerHTML = `
    <div class="panel-indice-fondo" data-cerrar-indice></div>
    <div class="panel-indice-hoja">
      <div class="panel-indice-cabecera">
        <h2 id="titulo-panel-indice">En este módulo</h2>
        <button type="button" class="panel-indice-cerrar" data-cerrar-indice aria-label="Cerrar el índice">×</button>
      </div>
      <nav aria-label="Índice del módulo"><ol>${lista}</ol></nav>
    </div>`;
  principal.append(boton, panel);

  const abrir = () => {
    panel.hidden = false;
    document.body.classList.add('con-panel');
    // Llevar a la vista el apartado en el que se está leyendo
    const actual = panel.querySelector('a[aria-current="true"]');
    actual?.scrollIntoView({ block: 'center' });
    (actual || panel.querySelector('.panel-indice-cerrar')).focus({ preventScroll: true });
  };
  const cerrar = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove('con-panel');
    boton.focus({ preventScroll: true });
  };
  boton.addEventListener('click', abrir);
  panel.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar-indice]')) cerrar(); });
  const alTeclado = (e) => { if (e.key === 'Escape') cerrar(); };
  document.addEventListener('keydown', alTeclado);
  limpiezas.push(() => { document.removeEventListener('keydown', alTeclado); document.body.classList.remove('con-panel'); });

  // Saltos: sin añadir entradas al historial, para que «atrás» siga llevando a la página anterior
  const alSaltar = (e) => {
    const a = e.target.closest('a[data-salto]');
    if (!a) return;
    e.preventDefault();
    const id = a.hash.slice(1);
    const destino = document.getElementById(id);
    if (!destino) return;
    cerrar();
    destino.scrollIntoView({ block: 'start' });
    history.replaceState(history.state, '', `#${id}`);
  };
  principal.addEventListener('click', alSaltar);
  limpiezas.push(() => principal.removeEventListener('click', alSaltar));

  // Marcar en el índice el apartado visible
  const enlaces = [...principal.querySelectorAll('a[data-salto]')];
  const titulos = [...principal.querySelectorAll('.seccion, .texto h3')];
  let ultimo = null;
  const marcar = () => {
    const linea = innerHeight * 0.3;
    let actual = null;
    for (const t of titulos) { if (t.getBoundingClientRect().top <= linea) actual = t; else break; }
    const id = actual?.id || null;
    if (id === ultimo) return;
    ultimo = id;
    const seccion = actual?.closest('.seccion')?.id;
    enlaces.forEach((a) => {
      const h = a.hash.slice(1);
      a.setAttribute('aria-current', h === id ? 'true' : 'false');
      a.classList.toggle('en-seccion', h === seccion);
    });
  };
  let pendiente = false;
  const alDesplazar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; marcar(); });
  };
  addEventListener('scroll', alDesplazar, { passive: true });
  limpiezas.push(() => removeEventListener('scroll', alDesplazar));
  marcar();
}

/* ---------------- Enrutado ---------------- */

let rutaPintada = null;

async function enrutar() {
  cerrarVisor({ desdeHistorial: true });
  limpiar();
  const ruta = location.pathname.replace(/\/+$/, '') || '/';
  rutaPintada = ruta;
  const m = ruta.match(/^\/modulo\/([a-z0-9-]+)$/);
  if (m) await paginaModulo(m[1]);
  else await portada();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-enlace]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
  e.preventDefault();
  if (a.pathname === location.pathname && !a.hash) return;
  history.pushState(null, '', a.href);
  window.scrollTo(0, 0);
  enrutar().then(() => principal.focus({ preventScroll: true }));
});
window.addEventListener('popstate', () => {
  // El "atrás" que hace el propio visor al cerrarse: la página se queda como estaba
  if (consumirAtrasPropio()) return;
  // El botón "atrás" del móvil con el visor abierto: solo se cierra el visor
  if (visorAbierto()) { cerrarVisor({ desdeHistorial: true }); return; }
  // Volver de un salto a una sección (#...) dentro del mismo módulo: no hace falta repintar
  const ruta = location.pathname.replace(/\/+$/, '') || '/';
  if (ruta === rutaPintada) return;
  enrutar();
});

// La portada se coloca bajo la cabecera, que puede ocupar una o dos líneas
const cabecera = document.querySelector('.cabecera');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--alto-cabecera', `${cabecera.offsetHeight}px`);
}).observe(cabecera);

// Tamaño de letra: escala toda la página a la vez, de modo que se mantienen las proporciones
const TAMANOS = [0.875, 1, 1.125, 1.25, 1.4, 1.6, 1.8];
const botonesLetra = document.querySelectorAll('[data-letra]');
const avisoLetra = document.querySelector('.aviso-letra');
let temporizadorAviso = 0;
function letraActual() {
  try { const v = parseFloat(localStorage.getItem('letra')); if (v > 0) return v; } catch (e) { /* nada */ }
  return 1;
}
function aplicarLetra(f, anunciar) {
  const raiz = document.documentElement;
  raiz.style.fontSize = f === 1 ? '' : `${f * 100}%`;
  if (f >= 1.4) raiz.dataset.letraGrande = ''; else delete raiz.dataset.letraGrande;
  try { if (f === 1) localStorage.removeItem('letra'); else localStorage.setItem('letra', String(f)); } catch (e) { /* nada */ }
  const i = TAMANOS.indexOf(f);
  botonesLetra[0].disabled = i <= 0;
  botonesLetra[1].disabled = i >= TAMANOS.length - 1;
  const rep = document.getElementById('reproductor');
  if (!rep.hidden) document.documentElement.style.setProperty('--alto-reproductor', `${rep.offsetHeight}px`);
  window.dispatchEvent(new Event('cambio-letra'));
  if (anunciar) {
    avisoLetra.textContent = `Letra al ${Math.round(f * 100)} %`;
    avisoLetra.classList.add('visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => avisoLetra.classList.remove('visible'), 1400);
  }
}
botonesLetra.forEach((b) => b.addEventListener('click', () => {
  const actual = letraActual();
  let i = TAMANOS.findIndex((t) => Math.abs(t - actual) < 0.01);
  if (i < 0) i = 1;
  const j = Math.min(TAMANOS.length - 1, Math.max(0, i + Number(b.dataset.letra)));
  if (j !== i) aplicarLetra(TAMANOS[j], true);
}));
aplicarLetra((() => { const f = letraActual(); return TAMANOS.find((t) => Math.abs(t - f) < 0.01) || 1; })(), false);

document.querySelector('.boton-tema').addEventListener('click', () => {
  const raiz = document.documentElement;
  const oscuroAhora = raiz.dataset.theme
    ? raiz.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  raiz.dataset.theme = oscuroAhora ? 'light' : 'dark';
  try { localStorage.setItem('tema', raiz.dataset.theme); } catch (e) { /* nada */ }
  window.dispatchEvent(new Event('cambio-tema'));
});

enrutar();
