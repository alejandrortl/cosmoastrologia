// Posiciones del Sol, la Luna y los planetas, y paso de coordenadas del cielo a la altura y
// la dirección vistas desde un lugar. Método de Paul Schlyter, «How to compute planetary
// positions» (stjarnhimlen.se/comp/ppcomp.html), basado en van Flandern y Pulkkinen (1980).
// Precisión: alrededor de un minuto de arco, más que suficiente para orientarse a simple vista.
// Las posiciones se devuelven referidas al equinoccio del año 2000, como el catálogo de estrellas.

const PI = Math.PI;
const rad = (g) => (g * PI) / 180;
const deg = (r) => (r * 180) / PI;
const rev = (x) => ((x % 360) + 360) % 360;
const sind = (g) => Math.sin(rad(g));
const cosd = (g) => Math.cos(rad(g));

// Días desde el 31 de diciembre de 1999 a las 0:00 UT (el «día 0» de Schlyter)
export function diaJ(fecha) {
  return (fecha.getTime() - Date.UTC(1999, 11, 31, 0, 0, 0)) / 86400000;
}

const ELEMENTOS = {
  Mercurio: (d) => ({ N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d }),
  Venus: (d) => ({ N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d }),
  Marte: (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d }),
  Júpiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d }),
  Saturno: (d) => ({ N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d }),
};
export const PLANETAS = Object.keys(ELEMENTOS);

function kepler(M, e) {
  let E = M + e * (180 / PI) * sind(M) * (1 + e * cosd(M));
  for (let k = 0; k < 8; k++) {
    const dE = (E - e * (180 / PI) * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

// Posición en su órbita, en coordenadas eclípticas rectangulares
function enOrbita({ N, i, w, a, e, M }) {
  const E = kepler(rev(M), e);
  const xv = a * (cosd(E) - e), yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = deg(Math.atan2(yv, xv)), r = Math.hypot(xv, yv);
  const vw = v + w;
  return {
    x: r * (cosd(N) * cosd(vw) - sind(N) * sind(vw) * cosd(i)),
    y: r * (sind(N) * cosd(vw) + cosd(N) * sind(vw) * cosd(i)),
    z: r * sind(vw) * sind(i),
    r,
  };
}

const oblicuidad = (d) => 23.4393 - 3.563e-7 * d;
// Paso del equinoccio de la fecha al del año 2000 (rotación a lo largo de la eclíptica)
const aJ2000 = (d) => -3.82394e-5 * d;

function eclipticaAEcuatorial(lon, lat, r, d) {
  const ecl = oblicuidad(d);
  const x = r * cosd(lon) * cosd(lat), y = r * sind(lon) * cosd(lat), z = r * sind(lat);
  const ye = y * cosd(ecl) - z * sind(ecl), ze = y * sind(ecl) + z * cosd(ecl);
  return { ra: rev(deg(Math.atan2(ye, x))), dec: deg(Math.atan2(ze, Math.hypot(x, ye))) };
}

export function sol(d) {
  const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = rev(356.047 + 0.9856002585 * d);
  const E = M + e * (180 / PI) * sind(M) * (1 + e * cosd(M));
  const xv = cosd(E) - e, yv = Math.sqrt(1 - e * e) * sind(E);
  const v = deg(Math.atan2(yv, xv)), r = Math.hypot(xv, yv);
  const lon = rev(v + w);
  return { lon, r, Ls: rev(M + w), M, ...eclipticaAEcuatorial(lon + aJ2000(d), 0, r, d) };
}

export function luna(d) {
  const N = 125.1228 - 0.0529538083 * d, i = 5.1454, w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666, e = 0.0549, M = rev(115.3654 + 13.0649929509 * d);
  const p = enOrbita({ N, i, w, a, e, M });
  let lon = rev(deg(Math.atan2(p.y, p.x))), lat = deg(Math.atan2(p.z, Math.hypot(p.x, p.y)));
  let r = p.r;
  // Perturbaciones principales
  const s = sol(d);
  const Ms = s.M, Mm = M, Ls = s.Ls, Lm = rev(M + w + N), D = Lm - Ls, F = Lm - N;
  lon += -1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms) - 0.059 * sind(2 * Mm - 2 * D)
    - 0.057 * sind(Mm - 2 * D + Ms) + 0.053 * sind(Mm + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms)
    - 0.035 * sind(D) - 0.031 * sind(Mm + Ms) - 0.015 * sind(2 * F - 2 * D) + 0.011 * sind(Mm - 4 * D);
  lat += -0.173 * sind(F - 2 * D) - 0.055 * sind(Mm - F - 2 * D) - 0.046 * sind(Mm + F - 2 * D)
    + 0.033 * sind(F + 2 * D) + 0.017 * sind(2 * Mm + F);
  r += -0.58 * cosd(Mm - 2 * D) - 0.46 * cosd(2 * D);
  // Fase: elongación respecto al Sol y fracción iluminada
  const elong = deg(Math.acos(cosd(s.lon - lon) * cosd(lat)));
  const iluminada = (1 - cosd(elong)) / 2;
  const creciente = rev(lon - s.lon) < 180;
  return { lon, lat, r, elong, iluminada, creciente, ...eclipticaAEcuatorial(lon + aJ2000(d), lat, r, d) };
}

export function planeta(nombre, d) {
  const el = ELEMENTOS[nombre](d);
  const p = enOrbita(el);
  let lon = deg(Math.atan2(p.y, p.x)), lat = deg(Math.atan2(p.z, Math.hypot(p.x, p.y)));
  if (nombre === 'Júpiter' || nombre === 'Saturno') {
    const Mj = rev(ELEMENTOS.Júpiter(d).M), Ms = rev(ELEMENTOS.Saturno(d).M);
    if (nombre === 'Júpiter') {
      lon += -0.332 * sind(2 * Mj - 5 * Ms - 67.6) - 0.056 * sind(2 * Mj - 2 * Ms + 21) + 0.042 * sind(3 * Mj - 5 * Ms + 21)
        - 0.036 * sind(Mj - 2 * Ms) + 0.022 * cosd(Mj - Ms) + 0.023 * sind(2 * Mj - 3 * Ms + 52) - 0.016 * sind(Mj - 5 * Ms - 69);
    } else {
      lon += 0.812 * sind(2 * Mj - 5 * Ms - 67.6) - 0.229 * cosd(2 * Mj - 4 * Ms - 2) + 0.119 * sind(Mj - 2 * Ms - 3)
        + 0.046 * sind(2 * Mj - 6 * Ms - 69) + 0.014 * sind(Mj - 3 * Ms + 32);
      lat += -0.02 * cosd(2 * Mj - 4 * Ms - 2) + 0.018 * sind(2 * Mj - 6 * Ms - 49);
    }
  }
  // Heliocéntrica corregida, luego geocéntrica sumando la posición del Sol vista desde la Tierra
  const xh = p.r * cosd(lon) * cosd(lat), yh = p.r * sind(lon) * cosd(lat), zh = p.r * sind(lat);
  const s = sol(d);
  const xg = xh + s.r * cosd(s.lon), yg = yh + s.r * sind(s.lon), zg = zh;
  const lonG = rev(deg(Math.atan2(yg, xg))), latG = deg(Math.atan2(zg, Math.hypot(xg, yg)));
  return { nombre, lon: lonG, lat: latG, ...eclipticaAEcuatorial(lonG + aJ2000(d), latG, Math.hypot(xg, yg, zg), d) };
}

// Tiempo sidéreo local, en grados
export function sidereoLocal(fecha, lonLugar) {
  const d = diaJ(fecha);
  const ut = fecha.getUTCHours() + fecha.getUTCMinutes() / 60 + fecha.getUTCSeconds() / 3600;
  return rev(sol(d).Ls + 180 + ut * 15 + lonLugar);
}

// De ascensión recta y declinación a altura y acimut (0° = norte, 90° = este)
export function horizontales(ra, dec, lst, latLugar) {
  const H = lst - ra;
  const sa = sind(latLugar) * sind(dec) + cosd(latLugar) * cosd(dec) * cosd(H);
  const alt = deg(Math.asin(Math.max(-1, Math.min(1, sa))));
  const az = rev(deg(Math.atan2(-cosd(dec) * sind(H), sind(dec) * cosd(latLugar) - cosd(dec) * cosd(H) * sind(latLugar))));
  return { alt, az };
}

const PUNTOS = ['norte', 'nornoreste', 'noreste', 'estenoreste', 'este', 'estesureste', 'sureste', 'sursureste',
  'sur', 'sursuroeste', 'suroeste', 'oestesuroeste', 'oeste', 'oestenoroeste', 'noroeste', 'nornoroeste'];
const OCHO = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
export function rumbo(az, fino = false) {
  return fino ? PUNTOS[Math.round(rev(az) / 22.5) % 16] : OCHO[Math.round(rev(az) / 45) % 8];
}

// Hora local de un lugar con zona horaria IANA: diferencia en minutos respecto a UT
export function desfase(fecha, zona) {
  try {
    const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(fecha).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
    const comoUT = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour % 24, +partes.minute);
    return Math.round((comoUT - fecha.getTime()) / 60000);
  } catch (e) {
    return -fecha.getTimezoneOffset();
  }
}
