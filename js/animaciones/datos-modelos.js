// Los cuatro modelos del mundo y qué culturas los usaron. Lo comparten la tabla de los
// cuatro modelos y la línea del tiempo. Debe coincidir con el texto del módulo 1
// («Quién usó cada modelo, por orden cronológico»).

export const MODELOS = {
  'plana-geo': { nombre: 'Tierra plana y geocéntrica', corto: 'Plana, geocéntrica', color: '#e0a458' },
  'esferica-geo': { nombre: 'Tierra esférica y geocéntrica', corto: 'Esférica, geocéntrica', color: '#8fb0e0' },
  'esferica-helio': { nombre: 'Tierra esférica y heliocéntrica', corto: 'Esférica, heliocéntrica', color: '#7cc4a4' },
  'plana-helio': { nombre: 'Tierra plana y heliocéntrica', corto: 'Plana, heliocéntrica', color: '#c9a0dc' },
  'sin-documentar': { nombre: 'Modelo no documentado', corto: 'No documentado', color: '#a9b2c4' },
};

// Cada tramo: [desde, hasta, [modelos]]. Varios modelos en un tramo: convivieron o la lectura está debatida.
export const CULTURAS = [
  { nombre: 'Sumerios y babilonios', tramos: [[-3000, -100, ['plana-geo']]] },
  { nombre: 'Egipcios', tramos: [[-3000, -30, ['plana-geo']]] },
  { nombre: 'Antiguos hebreos', nota: 'forma debatida', tramos: [[-1000, -100, ['plana-geo', 'esferica-geo']]] },
  { nombre: 'India védica', tramos: [[-1500, -500, ['plana-geo']]] },
  { nombre: 'China tradicional', nota: 'varios modelos', tramos: [[-1000, 1600, ['plana-geo', 'esferica-geo']]] },
  { nombre: 'Griegos', tramos: [[-800, -450, ['plana-geo']], [-450, -30, ['esferica-geo']]] },
  { nombre: 'Celtas', tramos: [[-500, 400, ['sin-documentar']]] },
  { nombre: 'Romanos', tramos: [[-200, 476, ['esferica-geo']]] },
  { nombre: 'Mayas', tramos: [[250, 1540, ['plana-geo']]] },
  { nombre: 'Judaísmo rabínico', nota: 'forma debatida hasta Maimónides', tramos: [[200, 1170, ['plana-geo', 'esferica-geo']], [1170, 1750, ['esferica-geo']]] },
  { nombre: 'Cristianos medievales', tramos: [[300, 1550, ['esferica-geo']]] },
  { nombre: 'India purānica y astronómica', nota: 'dos modelos a la vez', tramos: [[300, 1750, ['plana-geo', 'esferica-geo']]] },
  { nombre: 'Islam medieval', tramos: [[750, 1550, ['esferica-geo']]] },
  { nombre: 'Cábala', tramos: [[1150, 1750, ['esferica-geo']]] },
  { nombre: 'Aztecas o mexicas', tramos: [[1325, 1521, ['plana-geo']]] },
  { nombre: 'Incas', tramos: [[1400, 1533, ['sin-documentar']]] },
  { nombre: 'Revolución copernicana', nota: 'incluye el modelo de Tycho Brahe', tramos: [[1543, 1700, ['esferica-helio', 'esferica-geo']]] },
  { nombre: 'Masonería', nota: 'sin modelo propio', tramos: [[1717, 2026, ['sin-documentar']]] },
  { nombre: 'Astronomía moderna', tramos: [[1700, 2026, ['esferica-helio']]] },
  { nombre: 'Tierra plana moderna', tramos: [[1849, 2026, ['plana-geo']]] },
  { nombre: 'Cristianos de hoy', nota: 'mayoría', tramos: [[1800, 2026, ['esferica-helio']]] },
  { nombre: 'Geocentrismo moderno', tramos: [[1970, 2026, ['esferica-geo']]] },
];

export const textoAnio = (a) => (a < 0 ? `${-a} a. C.` : a >= 2026 ? 'hoy' : `${a}`);

export function culturasDe(modelo) {
  return CULTURAS.filter((c) => c.tramos.some((t) => t[2].includes(modelo)));
}
