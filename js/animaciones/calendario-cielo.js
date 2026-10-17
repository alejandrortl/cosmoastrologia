// Interactivo: calendario del cielo para los próximos doce meses.
// Calculado en el navegador con el método de Paul Schlyter (js/astro.js): fases de la Luna,
// equinoccios y solsticios, planetas en oposición, máximas elongaciones de Venus y Mercurio,
// encuentros entre planetas y de la Luna con los planetas.
// Eclipses: NASA, «Five Millennium Canon» de Fred Espenak (eclipse.gsfc.nasa.gov), de 2026 a 2030.
// Lluvias de estrellas: fechas típicas del máximo según la Organización Internacional de Meteoros (imo.net).

import { boton, barraControles } from './comun.js';
import { sol, luna, planeta, diaJ } from '../astro.js';

const rev = (x) => ((x % 360) + 360) % 360;
const envolver = (x) => { const r = rev(x); return r > 180 ? r - 360 : r; };
const rad = (g) => (g * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const DIA = 86400000;
const desdeD = (d) => new Date(Date.UTC(1999, 11, 31) + d * DIA);

const ECLIPSES = [
  ['2026-02-17', 'sol', 'anular', 'Sur de Argentina y de Chile, sur de África y la Antártida; anillo solo en la Antártida'],
  ['2026-03-03', 'luna', 'total', 'Este de Asia, Australia, el Pacífico y América'],
  ['2026-08-12', 'sol', 'total', 'Norte de América, oeste de África y Europa; total en Groenlandia, Islandia y España'],
  ['2026-08-28', 'luna', 'parcial', 'Este del Pacífico, América, Europa y África'],
  ['2027-02-06', 'sol', 'anular', 'Sudamérica, la Antártida y el oeste y sur de África; anillo en Chile, Argentina y el Atlántico'],
  ['2027-02-20', 'luna', 'penumbral', 'América, Europa, África y Asia'],
  ['2027-07-18', 'luna', 'penumbral', 'Este de África, Asia, Australia y el Pacífico'],
  ['2027-08-02', 'sol', 'total', 'África, Europa, Oriente Medio y Asia; total en Marruecos, el sur de España, Argelia, Libia, Egipto, Arabia Saudí, Yemen y Somalia'],
  ['2027-08-17', 'luna', 'penumbral', 'El Pacífico y América'],
  ['2028-01-12', 'luna', 'parcial', 'América, Europa y África'],
  ['2028-01-26', 'sol', 'anular', 'Este de Norteamérica, Centroamérica, Sudamérica, oeste de Europa y noroeste de África; anillo en Ecuador, Perú, Brasil, Surinam, España y Portugal'],
  ['2028-07-06', 'luna', 'parcial', 'Europa, África, Asia y Australia'],
  ['2028-07-22', 'sol', 'total', 'Sudeste de Asia, Indonesia, Australia y Nueva Zelanda; total en Australia y Nueva Zelanda'],
  ['2028-12-31', 'luna', 'total', 'Europa, África, Asia, Australia y el Pacífico'],
  ['2029-01-14', 'sol', 'parcial', 'Norteamérica y Centroamérica'],
  ['2029-06-12', 'sol', 'parcial', 'El Ártico, Escandinavia, Alaska, el norte de Asia y el norte de Canadá'],
  ['2029-06-26', 'luna', 'total', 'América, Europa, África y Oriente Medio'],
  ['2029-07-11', 'sol', 'parcial', 'Sur de Chile y sur de Argentina'],
  ['2029-12-05', 'sol', 'parcial', 'Sur de Argentina, sur de Chile y la Antártida'],
  ['2029-12-20', 'luna', 'total', 'América, Europa, África y Asia'],
  ['2030-06-01', 'sol', 'anular', 'Europa, norte de África, Oriente Medio, Asia, el Ártico y Alaska; anillo en Argelia, Túnez, Grecia, Turquía, Rusia, el norte de China y Japón'],
  ['2030-06-15', 'luna', 'parcial', 'Europa, África, Asia y Australia'],
  ['2030-11-25', 'sol', 'total', 'Sur de África, el sur del Índico, Indonesia, Australia y la Antártida; total en Botsuana, Sudáfrica y Australia'],
  ['2030-12-09', 'luna', 'penumbral', 'América, Europa, África y Asia'],
];

// [mes (1-12), día, nombre, tasa por hora en condiciones ideales, nota]
const LLUVIAS = [
  [1, 3, 'Cuadrántidas', 80, 'Mejor desde el hemisferio norte, en la madrugada. Parecen salir de cerca del Boyero.'],
  [4, 22, 'Líridas', 18, 'Mejor desde el norte, después de medianoche. Parecen salir de cerca de Vega.'],
  [5, 6, 'Eta Acuáridas', 50, 'Mejor desde el hemisferio sur y los trópicos, antes del amanecer.'],
  [7, 30, 'Delta Acuáridas del sur', 25, 'Mejor desde el hemisferio sur, de madrugada.'],
  [8, 12, 'Perseidas', 100, 'Las más famosas del norte, en noches cálidas. Parecen salir de Perseo, y se ven mejor de madrugada.'],
  [10, 21, 'Oriónidas', 20, 'Desde los dos hemisferios, de madrugada. Parecen salir de Orión.'],
  [11, 17, 'Leónidas', 15, 'Desde los dos hemisferios, de madrugada. Parecen salir de Leo.'],
  [12, 14, 'Gemínidas', 150, 'La lluvia más intensa del año, desde los dos hemisferios. Parecen salir de Géminis, y se ven desde antes de medianoche.'],
];

const TIPOS = {
  luna: 'Fases de la Luna',
  sol: 'Equinoccios y solsticios',
  eclipse: 'Eclipses',
  planeta: 'Planetas',
  encuentro: 'Luna y planetas juntos',
  lluvia: 'Lluvias de estrellas',
};

const separacion = (l1, b1, l2, b2) => deg(Math.acos(Math.max(-1, Math.min(1,
  Math.sin(rad(b1)) * Math.sin(rad(b2)) + Math.cos(rad(b1)) * Math.cos(rad(b2)) * Math.cos(rad(l1 - l2))))));

// Busca los instantes en que f(d) cruza «objetivo» (en grados), entre d0 y d1
function cruces(f, objetivo, d0, d1, paso) {
  const res = [];
  let a = d0, ga = envolver(f(a) - objetivo);
  for (let b = d0 + paso; b <= d1; b += paso) {
    const gb = envolver(f(b) - objetivo);
    // Cruce en cualquier sentido (la diferencia de longitudes puede crecer o menguar)
    if ((ga < 0) !== (gb < 0) && Math.abs(gb - ga) < 90) {
      let x0 = a, x1 = b;
      const s0 = ga < 0;
      for (let k = 0; k < 30; k++) {
        const m = (x0 + x1) / 2;
        if ((envolver(f(m) - objetivo) < 0) === s0) x0 = m; else x1 = m;
      }
      res.push((x0 + x1) / 2);
    }
    a = b; ga = gb;
  }
  return res;
}

// Mínimos (o máximos, con signo -1) de una función muestreada
function extremos(f, d0, d1, paso, signo = 1) {
  const res = [];
  let p = f(d0 - paso), c = f(d0);
  for (let d = d0 + paso; d <= d1 + paso; d += paso) {
    const n = f(d);
    if (signo * c < signo * p && signo * c <= signo * n) {
      // Afinar con una parábola por los tres puntos
      const den = p - 2 * c + n;
      const off = den ? (0.5 * (p - n)) / den : 0;
      res.push({ d: d - paso + off * paso, v: c });
    }
    p = c; c = n;
  }
  return res;
}

export function calcularEventos(inicio, meses = 12) {
  const d0 = diaJ(inicio);
  const fin = new Date(inicio); fin.setUTCMonth(fin.getUTCMonth() + meses);
  const d1 = diaJ(fin);
  const ev = [];
  const elongLuna = (d) => rev(luna(d).lon - sol(d).lon);

  // Fases de la Luna
  const FASES = [
    [0, 'Luna nueva', 'La Luna está junto al Sol y no se ve. Buenas noches para ver estrellas débiles.'],
    [90, 'Cuarto creciente', 'Media Luna iluminada por el lado del oeste. Se ve por la tarde y la primera mitad de la noche.'],
    [180, 'Luna llena', 'La Luna sale cuando se pone el Sol y está en el cielo toda la noche. Su luz oculta las estrellas débiles.'],
    [270, 'Cuarto menguante', 'Media Luna iluminada por el lado del este. Sale hacia medianoche y se ve hasta la mañana.'],
  ];
  for (const [ang, nombre, texto] of FASES) {
    for (const d of cruces(elongLuna, ang, d0, d1, 0.5)) ev.push({ tipo: 'luna', d, hora: true, titulo: nombre, texto });
  }

  // Equinoccios y solsticios
  const SOL = [
    [0, 'Equinoccio de marzo', 'El Sol sale justo por el este y se pone justo por el oeste; el día y la noche duran casi lo mismo en todas partes. Empieza la primavera en el hemisferio norte y el otoño en el sur.'],
    [90, 'Solsticio de junio', 'El Sol alcanza su punto más al norte. Es el día más largo del año en el hemisferio norte y el más corto en el sur. Empieza el verano en el norte y el invierno en el sur.'],
    [180, 'Equinoccio de septiembre', 'El Sol vuelve a salir justo por el este y a ponerse por el oeste. Empieza el otoño en el hemisferio norte y la primavera en el sur.'],
    [270, 'Solsticio de diciembre', 'El Sol alcanza su punto más al sur. Es el día más corto del año en el hemisferio norte y el más largo en el sur. Empieza el invierno en el norte y el verano en el sur.'],
  ];
  for (const [ang, nombre, texto] of SOL) {
    for (const d of cruces((x) => sol(x).lon, ang, d0, d1, 2)) ev.push({ tipo: 'sol', d, hora: true, titulo: nombre, texto });
  }

  // Planetas en oposición: en el lado del cielo opuesto al Sol
  for (const n of ['Marte', 'Júpiter', 'Saturno']) {
    for (const d of cruces((x) => rev(planeta(n, x).lon - sol(x).lon), 180, d0, d1, 2)) {
      ev.push({ tipo: 'planeta', d, titulo: `${n} en oposición`, texto: `${n} queda en el lado del cielo opuesto al Sol: sale al atardecer, se ve toda la noche y está en su momento más brillante del año. Buena fecha para encontrarlo.` });
    }
  }
  // Máxima separación de Venus y Mercurio respecto al Sol
  const elong = (n) => (x) => { const p = planeta(n, x), s = sol(x); return separacion(p.lon, p.lat, s.lon, 0); };
  for (const n of ['Venus', 'Mercurio']) {
    for (const { d, v } of extremos(elong(n), d0, d1, 1, -1)) {
      const tarde = rev(planeta(n, d).lon - sol(d).lon) < 180;
      ev.push({ tipo: 'planeta', d, titulo: `${n}, en su máxima separación del Sol${tarde ? ' (al anochecer)' : ' (al amanecer)'}`, texto: `${n} se ve a ${Math.round(v)}° del Sol, lo más lejos que llega. ${tarde ? 'Búscalo después de la puesta de Sol, bajo por el oeste.' : 'Búscalo antes de la salida del Sol, bajo por el este.'}${n === 'Mercurio' ? ' Mercurio es difícil de ver: en los días cercanos a esta fecha es cuando hay más posibilidades.' : ' Es el «lucero» del ' + (tarde ? 'atardecer' : 'alba') + '.'}` });
    }
  }
  // Encuentros entre planetas (a menos de 2°, lejos del resplandor del Sol)
  const visibles = ['Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno'];
  for (let i = 0; i < visibles.length; i++) {
    for (let j = i + 1; j < visibles.length; j++) {
      const a = visibles[i], b = visibles[j];
      const sep = (x) => { const p = planeta(a, x), q = planeta(b, x); return separacion(p.lon, p.lat, q.lon, q.lat); };
      for (const { d, v } of extremos(sep, d0, d1, 1)) {
        if (v > 2 || elong(a)(d) < 15 || elong(b)(d) < 15) continue;
        ev.push({ tipo: 'planeta', d, titulo: `${a} y ${b}, muy juntos`, texto: `Los dos planetas se ven a solo ${v.toFixed(1).replace('.', ',')}° el uno del otro${v < 1.5 ? ', menos que el grosor de un dedo meñique con el brazo estirado' : ''}.` });
      }
    }
  }
  // La Luna junto a los planetas brillantes
  for (const n of ['Venus', 'Marte', 'Júpiter', 'Saturno']) {
    const sep = (x) => { const p = planeta(n, x), m = luna(x); return separacion(p.lon, p.lat, m.lon, m.lat); };
    for (const { d, v } of extremos(sep, d0, d1, 0.25)) {
      if (v > 3.5 || elong(n)(d) < 18) continue;
      ev.push({ tipo: 'encuentro', d, titulo: `La Luna junto a ${n}`, texto: `La Luna pasa ${v < 1.5 ? 'a apenas un grado' : `a unos ${Math.round(v)}°`} de ${n}. Es una ocasión fácil de encontrar el planeta: búscalo al lado de la Luna esa noche o la siguiente. La distancia exacta cambia un poco según desde dónde se mire.` });
    }
  }

  // Eclipses
  const desc = {
    sol: {
      total: 'La Luna se ve pasar por delante del Sol y lo tapa por completo en una franja estrecha; alrededor se ve parcial.',
      anular: 'La Luna se ve pasar por delante del Sol sin taparlo del todo: en una franja estrecha queda un anillo de luz; alrededor se ve parcial.',
      parcial: 'La Luna tapa solo una parte del Sol.',
    },
    luna: {
      total: 'La Luna llena se oscurece por completo y suele volverse rojiza.',
      parcial: 'Una parte de la Luna llena se oscurece.',
      penumbral: 'La Luna llena se oscurece solo un poco; cuesta notarlo.',
    },
  };
  for (const [f, astro, clase, donde] of ECLIPSES) {
    const d = diaJ(new Date(`${f}T12:00:00Z`));
    if (d < d0 - 0.5 || d > d1) continue;
    ev.push({
      tipo: 'eclipse', d, soloDia: true, titulo: `Eclipse ${clase} de ${astro === 'sol' ? 'Sol' : 'Luna'}`,
      texto: `${desc[astro][clase]} Se ve desde: ${donde}.${astro === 'sol' ? ' Nunca mires al Sol sin gafas de eclipse homologadas (norma ISO 12312-2): ni con gafas de sol, ni con radiografías.' : ' Se puede mirar sin ninguna protección.'}`,
    });
  }

  // Lluvias de estrellas
  for (let y = inicio.getUTCFullYear(); y <= fin.getUTCFullYear(); y++) {
    for (const [m, dia, nombre, tasa, nota] of LLUVIAS) {
      const d = diaJ(new Date(Date.UTC(y, m - 1, dia, 12)));
      if (d < d0 - 0.5 || d > d1) continue;
      const ilum = luna(d).iluminada;
      const lunaTxt = ilum > 0.6 ? ' Este año la Luna estará muy iluminada esas noches y se verán bastantes menos.' : ilum < 0.3 ? ' Este año la Luna apenas molestará: buen año para verlas.' : '';
      ev.push({ tipo: 'lluvia', d, soloDia: true, titulo: `Lluvia de estrellas: ${nombre}`, texto: `Máximo hacia esta fecha. En un cielo muy oscuro pueden verse hasta unas ${tasa} por hora; desde una ciudad, muchas menos. ${nota}${lunaTxt}` });
    }
  }
  return ev.sort((a, b) => a.d - b.d);
}

function ics(eventos) {
  const fmt = (dt) => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const dia = (dt) => dt.toISOString().slice(0, 10).replace(/-/g, '');
  const esc = (t) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cosmoastrologia//Calendario del cielo//ES', 'CALSCALE:GREGORIAN'];
  const ahora = fmt(new Date());
  eventos.forEach((e, i) => {
    const dt = desdeD(e.d);
    lineas.push('BEGIN:VEVENT', `UID:${dia(dt)}-${i}-${e.titulo.replace(/[^A-Za-z0-9]/g, '')}@cosmoastrologia`, `DTSTAMP:${ahora}`);
    if (e.hora) lineas.push(`DTSTART:${fmt(dt)}`, `DTEND:${fmt(new Date(dt.getTime() + 3600000))}`);
    else {
      const sig = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate() + 1));
      lineas.push(`DTSTART;VALUE=DATE:${dia(dt)}`, `DTEND;VALUE=DATE:${dia(sig)}`);
    }
    lineas.push(`SUMMARY:${esc(e.titulo)}`, `DESCRIPTION:${esc(e.texto)}`, 'END:VEVENT');
  });
  lineas.push('END:VCALENDAR');
  return lineas.join('\r\n');
}

function descargar(nombre, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function calendarioCielo(contenedor) {
  const raiz = document.createElement('div');
  raiz.className = 'calendario-cielo';
  contenedor.append(raiz);

  const zona = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; } })();
  const fFecha = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const fFechaUT = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const fHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

  const activos = new Set(['luna', 'sol', 'eclipse', 'planeta', 'lluvia']);
  let inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  let eventos = [], mesesVisibles = 3;

  const barra = barraControles(contenedor);
  const dato = document.createElement('p');
  dato.className = 'lectura-dato';
  dato.setAttribute('aria-live', 'polite');
  const fTipos = document.createElement('div');
  fTipos.className = 'grupo-botones';
  fTipos.setAttribute('role', 'group');
  fTipos.setAttribute('aria-label', 'Qué mostrar');
  const bTipos = Object.entries(TIPOS).map(([t, n]) => {
    const b = boton(n, () => { activos.has(t) ? activos.delete(t) : activos.add(t); pintar(); }, { 'aria-pressed': String(activos.has(t)) });
    b.dataset.t = t;
    return b;
  });
  fTipos.append(...bTipos);
  const fOtros = document.createElement('div');
  fOtros.className = 'grupo-botones';
  const etDesde = document.createElement('span'); etDesde.textContent = 'Desde:';
  const iDesde = document.createElement('input');
  iDesde.type = 'date'; iDesde.className = 'control'; iDesde.setAttribute('aria-label', 'Fecha de inicio');
  const dos = (n) => String(n).padStart(2, '0');
  iDesde.value = `${inicio.getFullYear()}-${dos(inicio.getMonth() + 1)}-${dos(inicio.getDate())}`;
  iDesde.addEventListener('change', () => {
    if (!iDesde.value) return;
    const [y, m, d] = iDesde.value.split('-').map(Number);
    inicio = new Date(y, m - 1, d); calcular();
  });
  const bTodo = boton('Añadir todo a mi calendario', () => {
    const lista = eventos.filter((e) => activos.has(e.tipo));
    descargar('calendario-del-cielo.ics', ics(lista));
  });
  fOtros.append(etDesde, iDesde, bTodo);
  barra.append(dato, fTipos, fOtros);
  // Los filtros van encima de la lista, que es larga
  barra.classList.add('arriba');
  contenedor.before(barra);

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ev]');
    if (b) { const ev = eventos[+b.dataset.ev]; descargar(`${ev.titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}.ics`, ics([ev])); return; }
    if (e.target.closest('.cal-mas')) { mesesVisibles += 3; pintar(); }
  });

  function calcular() {
    raiz.innerHTML = '<p class="cal-cargando">Calculando…</p>';
    setTimeout(() => { eventos = calcularEventos(inicio, 12); mesesVisibles = 3; pintar(); }, 20);
  }

  function pintar() {
    bTipos.forEach((b) => b.setAttribute('aria-pressed', String(activos.has(b.dataset.t))));
    const lista = eventos.map((e, i) => ({ ...e, i })).filter((e) => activos.has(e.tipo));
    const grupos = new Map();
    for (const e of lista) {
      const dt = desdeD(e.d);
      const clave = e.soloDia ? `${dt.getUTCFullYear()}-${dos(dt.getUTCMonth() + 1)}` : `${dt.getFullYear()}-${dos(dt.getMonth() + 1)}`;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(e);
    }
    const claves = [...grupos.keys()];
    const html = claves.slice(0, mesesVisibles).map((k) => {
      const [y, m] = k.split('-').map(Number);
      const titulo = fMes.format(new Date(y, m - 1, 15));
      return `<section class="cal-mes"><h4>${titulo[0].toUpperCase() + titulo.slice(1)}</h4><ul>${grupos.get(k).map((e) => {
        const dt = desdeD(e.d);
        const cuando = e.soloDia ? fFechaUT.format(dt) : `${fFecha.format(dt)}${e.hora ? `, ${fHora.format(dt)}` : ''}`;
        return `<li class="cal-ev cal-${e.tipo}"><div class="cal-cuando">${cuando}</div><div><strong>${e.titulo}</strong><p>${e.texto}</p>
          <button type="button" class="cal-anadir" data-ev="${e.i}">Añadir a mi calendario</button></div></li>`;
      }).join('')}</ul></section>`;
    }).join('');
    raiz.innerHTML = (html || '<p class="cal-cargando">No hay nada con estos filtros.</p>')
      + (claves.length > mesesVisibles ? '<button type="button" class="control cal-mas">Ver tres meses más</button>' : '');
    dato.innerHTML = `<strong>${lista.length} fenómenos</strong> en los doce meses que empiezan el ${fFecha.format(inicio)}. Las horas son las de tu dispositivo (${zona}). Los eclipses y las lluvias de estrellas van por días, según el tiempo universal.`;
  }

  calcular();
  return { destruir() {} };
}
