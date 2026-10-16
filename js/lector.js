// Audiolibro: lee el módulo en voz alta con la voz del propio dispositivo
// (Web Speech API), resaltando el párrafo que se está leyendo.

const VELOCIDADES = [0.8, 0.9, 1, 1.15, 1.3, 1.5];

const ic = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  ant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5.5v13L9.5 12z"/></svg>',
  sig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5.5v13L14.5 12z"/></svg>',
};

function leerAlmacen(k, def) {
  try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; }
}
function guardarAlmacen(k, v) {
  try { localStorage.setItem(k, v); } catch (e) { /* nada */ }
}

const ROMANOS = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function romanoAEntero(r) {
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    const a = ROMANOS[r[i]], b = ROMANOS[r[i + 1]] || 0;
    total += a < b ? -a : a;
  }
  return total;
}

// Ajusta el texto para que la voz lo pronuncie bien.
export function textoParaVoz(t) {
  return t
    .replace(/\s+/g, ' ')
    .replace(/\b(siglos?) ([IVXLC]+)(?:-([IVXLC]+))?/g, (_, s, a, b) =>
      `${s} ${romanoAEntero(a)}${b ? ` y ${romanoAEntero(b)}` : ''}`)
    .replace(/\ba\. ?C\./g, 'antes de Cristo')
    .replace(/\bd\. ?C\./g, 'después de Cristo')
    .replace(/\bcaps\. /g, 'capítulos ')
    .replace(/\bcap\. /g, 'capítulo ')
    .replace(/\b1 Enoc\b/g, 'Primer libro de Enoc')
    .replace(/MUL\.APIN/g, 'Mul Apín')
    .replace(/(\d+):(\d+)-(\d+)/g, '$1, versículos $2 a $3')
    .replace(/(\d+):(\d+)/g, '$1, versículo $2')
    .replace(/(\d+)-(\d+)/g, '$1 a $2')
    .replace(/°/g, ' grados')
    .replace(/ — /g, ', ')
    .replace(/[«»"]/g, '')
    .trim();
}

// Divide un párrafo largo en trozos cortos: algunos navegadores cortan las frases largas.
function trocear(t, max = 220) {
  const frases = t.match(/[^.!?;:]+[.!?;:]*\s*/g) || [t];
  const trozos = [];
  let actual = '';
  for (const f of frases) {
    if ((actual + f).length > max && actual) { trozos.push(actual.trim()); actual = ''; }
    if (f.length > max) {
      f.split(/,\s*/).forEach((p) => {
        if ((actual + p).length > max && actual) { trozos.push(actual.trim()); actual = ''; }
        actual += p + ', ';
      });
      actual = actual.replace(/, $/, ' ');
    } else actual += f;
  }
  if (actual.trim()) trozos.push(actual.trim());
  return trozos;
}

export class Lector {
  constructor(articulo, contenedor, { clave, titulo }) {
    this.articulo = articulo;
    this.contenedor = contenedor;
    this.clave = `lector:${clave}`;
    this.titulo = titulo;
    this.voz = window.speechSynthesis || null;
    this.indice = 0;
    this.leyendo = false;
    this.generacion = 0;
    this.velocidad = parseFloat(leerAlmacen('lector:velocidad', '1')) || 1;
    this.nombreVoz = leerAlmacen('lector:voz', '');

    this.pasajes = [...articulo.querySelectorAll('.seccion h2, .texto h3, .texto p')];
    this.pasajes.forEach((el, i) => { el.dataset.pasaje = i; });

    this.alPulsarPasaje = (e) => {
      if (!this.contenedor.hidden) {
        const el = e.target.closest('[data-pasaje]');
        if (el && !e.target.closest('a, button')) this.reproducirDesde(+el.dataset.pasaje);
      }
    };
    articulo.addEventListener('click', this.alPulsarPasaje);

    this.alCambiarVoces = () => this.pintarVoces();
    if (this.voz) this.voz.addEventListener?.('voiceschanged', this.alCambiarVoces);

    this.alSalir = () => this.voz?.cancel();
    window.addEventListener('pagehide', this.alSalir);
  }

  posicionGuardada() {
    const p = parseInt(leerAlmacen(this.clave, '0'), 10);
    return Number.isFinite(p) && p < this.pasajes.length ? p : 0;
  }

  voces() {
    if (!this.voz) return [];
    return this.voz.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
  }

  vozElegida() {
    const vs = this.voces();
    return vs.find((v) => v.name === this.nombreVoz)
      || vs.find((v) => /es[-_]ES/i.test(v.lang) && v.localService)
      || vs.find((v) => /es[-_]ES/i.test(v.lang))
      || vs[0] || null;
  }

  reproducirDesdeElemento(el) {
    this.reproducirDesde(+el.dataset.pasaje);
  }

  reproducirDesde(i) {
    this.mostrar();
    if (!this.voz) return;
    this.indice = Math.max(0, Math.min(i, this.pasajes.length - 1));
    this.leyendo = true;
    this.articulo.classList.add('leyendo-activo');
    this.leerPasaje();
  }

  leerPasaje() {
    const gen = ++this.generacion;
    this.voz.cancel();
    const el = this.pasajes[this.indice];
    if (!el) { this.terminar(); return; }
    this.resaltar(el);
    guardarAlmacen(this.clave, String(this.indice));
    this.actualizar();

    const trozos = trocear(textoParaVoz(el.textContent));
    const voz = this.vozElegida();
    let k = 0;
    const hablar = () => {
      if (gen !== this.generacion || !this.leyendo) return;
      if (k >= trozos.length) {
        this.indice++;
        if (this.indice >= this.pasajes.length) this.terminar();
        else this.leerPasaje();
        return;
      }
      const u = new SpeechSynthesisUtterance(trozos[k++]);
      u.lang = voz?.lang || 'es-ES';
      if (voz) u.voice = voz;
      u.rate = this.velocidad;
      u.onend = () => { if (gen === this.generacion) hablar(); };
      u.onerror = (ev) => {
        if (gen !== this.generacion) return;
        if (ev.error === 'interrupted' || ev.error === 'canceled') return;
        this.leyendo = false; this.actualizar();
        this.aviso('La voz se ha detenido. Pulsa reproducir para continuar.');
      };
      this.voz.speak(u);
    };
    // Pequeña pausa entre párrafos; también evita un fallo de Chrome al encadenar cancel() y speak().
    setTimeout(hablar, el.tagName === 'H2' ? 350 : 120);
  }

  pausar() {
    this.leyendo = false;
    this.generacion++;
    this.voz?.cancel();
    this.actualizar();
  }

  alternar() {
    if (this.leyendo) this.pausar();
    else this.reproducirDesde(this.indice);
  }

  saltar(delta) {
    const i = Math.max(0, Math.min(this.indice + delta, this.pasajes.length - 1));
    if (this.leyendo) this.reproducirDesde(i);
    else { this.indice = i; this.resaltar(this.pasajes[i]); guardarAlmacen(this.clave, String(i)); this.actualizar(); }
  }

  terminar() {
    this.leyendo = false;
    this.indice = 0;
    guardarAlmacen(this.clave, '0');
    this.pasajes.forEach((p) => p.classList.remove('pasaje-actual'));
    this.actualizar();
    this.aviso('Has llegado al final del módulo.');
  }

  resaltar(el) {
    this.pasajes.forEach((p) => p.classList.toggle('pasaje-actual', p === el));
    const r = el.getBoundingClientRect();
    const alto = window.innerHeight - (this.contenedor.offsetHeight || 0);
    if (r.top < 60 || r.bottom > alto - 20) {
      const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: window.scrollY + r.top - alto * 0.3, behavior: suave ? 'smooth' : 'auto' });
    }
  }

  seccionActual() {
    const el = this.pasajes[this.indice];
    return el?.closest('.seccion')?.querySelector('h2')?.textContent || this.titulo;
  }

  mostrar() {
    if (!this.contenedor.hidden && this.contenedor.dataset.dueno === this.clave) return;
    this.contenedor.dataset.dueno = this.clave;
    this.contenedor.hidden = false;
    this.contenedor.innerHTML = `
      <div class="rep" role="region" aria-label="Audiolibro">
        <div class="rep-info">
          <div class="rep-titulo"></div>
          <div class="rep-progreso" aria-live="polite"></div>
        </div>
        <div class="rep-botones">
          <button class="rep-boton" data-accion="ant" type="button" aria-label="Párrafo anterior">${ic.ant}</button>
          <button class="rep-boton principal" data-accion="alternar" type="button" aria-label="Reproducir">${ic.play}</button>
          <button class="rep-boton" data-accion="sig" type="button" aria-label="Párrafo siguiente">${ic.sig}</button>
        </div>
        <div class="rep-barra" aria-hidden="true"><i></i></div>
        <div class="rep-ajustes">
          <button type="button" data-accion="velocidad" aria-label="Cambiar velocidad de lectura"></button>
          <label class="visualmente-oculto" for="rep-voz">Voz</label>
          <select id="rep-voz"></select>
          <button type="button" class="rep-cerrar" data-accion="cerrar">Cerrar</button>
        </div>
        <p class="rep-aviso" hidden></p>
      </div>`;
    this.contenedor.onclick = (e) => {
      const a = e.target.closest('[data-accion]')?.dataset.accion;
      if (a === 'alternar') this.alternar();
      else if (a === 'ant') this.saltar(-1);
      else if (a === 'sig') this.saltar(1);
      else if (a === 'velocidad') this.cambiarVelocidad();
      else if (a === 'cerrar') this.cerrar();
    };
    this.contenedor.querySelector('select').onchange = (e) => {
      this.nombreVoz = e.target.value;
      guardarAlmacen('lector:voz', this.nombreVoz);
      if (this.leyendo) this.reproducirDesde(this.indice);
    };
    this.pintarVoces();
    this.ajustarHueco();
    if (!this.voz) this.aviso('Este navegador no puede leer en voz alta. Prueba con Chrome, Safari o Edge actualizados.');
    this.actualizar();
  }

  pintarVoces() {
    const sel = this.contenedor.querySelector('select');
    if (!sel) return;
    const vs = this.voces();
    const elegida = this.vozElegida();
    sel.hidden = vs.length < 2;
    sel.innerHTML = vs.map((v) =>
      `<option value="${v.name.replace(/"/g, '&quot;')}"${v === elegida ? ' selected' : ''}>${v.name.replace(/</g, '&lt;')} (${v.lang})</option>`).join('');
    if (this.voz && this.voz.getVoices().length && !vs.length) {
      this.aviso('No hay ninguna voz en español instalada en este dispositivo; se usará la voz por defecto.');
    }
  }

  cambiarVelocidad() {
    const i = VELOCIDADES.indexOf(this.velocidad);
    this.velocidad = VELOCIDADES[(i + 1) % VELOCIDADES.length];
    guardarAlmacen('lector:velocidad', String(this.velocidad));
    this.actualizar();
    if (this.leyendo) this.reproducirDesde(this.indice);
  }

  actualizar() {
    const c = this.contenedor;
    if (c.hidden || !c.querySelector('.rep')) return;
    c.querySelector('.rep-titulo').textContent = this.seccionActual();
    c.querySelector('.rep-progreso').textContent =
      `Párrafo ${this.indice + 1} de ${this.pasajes.length}${this.leyendo ? '' : ', en pausa'}`;
    c.querySelector('.rep-barra i').style.width = `${((this.indice + 1) / this.pasajes.length) * 100}%`;
    const b = c.querySelector('[data-accion="alternar"]');
    b.innerHTML = this.leyendo ? ic.pausa : ic.play;
    b.setAttribute('aria-label', this.leyendo ? 'Pausar' : 'Reproducir');
    c.querySelector('[data-accion="velocidad"]').textContent =
      `Velocidad ${String(this.velocidad).replace('.', ',')}×`;
  }

  aviso(t) {
    const p = this.contenedor.querySelector('.rep-aviso');
    if (!p) return;
    p.textContent = t;
    p.hidden = !t;
    this.ajustarHueco();
  }

  ajustarHueco() {
    requestAnimationFrame(() => {
      const alto = this.contenedor.hidden ? 0 : this.contenedor.offsetHeight;
      document.documentElement.style.setProperty('--alto-reproductor', `${alto}px`);
    });
  }

  cerrar() {
    this.pausar();
    this.pasajes.forEach((p) => p.classList.remove('pasaje-actual'));
    this.articulo.classList.remove('leyendo-activo');
    this.contenedor.hidden = true;
    this.contenedor.innerHTML = '';
    delete this.contenedor.dataset.dueno;
    this.ajustarHueco();
  }

  destruir() {
    this.cerrar();
    this.articulo.removeEventListener('click', this.alPulsarPasaje);
    this.voz?.removeEventListener?.('voiceschanged', this.alCambiarVoces);
    window.removeEventListener('pagehide', this.alSalir);
  }
}
