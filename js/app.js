import { listarModulos, cargarModulo, urlMedio } from './datos.js';
import { Lector } from './lector.js';
import { montarAnimacion } from './animaciones/index.js';
import { arcosPolaris } from './animaciones/arcos-polaris.js';
import { abrirVisor, cerrarVisor, visorAbierto } from './visor.js';

const principal = document.getElementById('principal');
let limpiezas = [];
let lector = null;
let cacheModulos = null;

const icono = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  auriculares: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-1a7 7 0 0 1 14 0v1h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z"/></svg>',
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
          <img src="${esc(urlMedio(c))}" data-grande="${esc(c.grande || '')}" alt="${esc(c.alt || c.pie || '')}" loading="lazy" decoding="async">
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
        <div class="lienzo"></div>
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
        <details${matchMedia('(min-width: 1100px)').matches ? ' open' : ''}>
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
  principal.querySelectorAll('.figura-imagen .ampliar').forEach((b) => {
    b.addEventListener('click', () => {
      const img = b.querySelector('img');
      const fig = b.closest('figure');
      abrirVisor({
        src: img.currentSrc || img.src,
        grande: img.dataset.grande,
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

  // Audiolibro
  const articulo = principal.querySelector('.lectura');
  lector = new Lector(articulo, document.getElementById('reproductor'), {
    clave: slug, titulo: modulo.titulo,
  });
  principal.querySelector('.escuchar-todo').addEventListener('click', () => lector.reproducirDesde(lector.posicionGuardada()));
  principal.querySelectorAll('.escuchar-aqui').forEach((b) => {
    b.addEventListener('click', () => lector.reproducirDesdeElemento(b.closest('.seccion').querySelector('h2')));
  });

  // Índice: marcar la sección visible
  const enlaces = [...principal.querySelectorAll('.indice a')];
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) enlaces.forEach((a) => a.setAttribute('aria-current', a.hash === `#${e.target.id}` ? 'true' : 'false'));
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  principal.querySelectorAll('.seccion').forEach((s) => obs.observe(s));
  limpiezas.push(() => obs.disconnect());

  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

/* ---------------- Enrutado ---------------- */

async function enrutar() {
  cerrarVisor({ desdeHistorial: true });
  limpiar();
  const ruta = location.pathname.replace(/\/+$/, '') || '/';
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
  if (visorAbierto()) { cerrarVisor({ desdeHistorial: true }); return; }
  enrutar();
});

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
