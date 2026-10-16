// Registro de animaciones e interactivos. El campo "componente" de un bloque
// de la base de datos elige cuál se monta.

import { arcosPolaris } from './arcos-polaris.js';
import { precesion } from './precesion.js';
import { puertasEnoc } from './puertas-enoc.js';
import { fasesLuna } from './fases-luna.js';
import { retrogrado } from './retrogrado.js';
import { solDosModelos } from './sol-dos-modelos.js';
import { tiposEclipse } from './tipos-eclipse.js';
import { zodiaco } from './zodiaco.js';

const REGISTRO = {
  'arcos-polaris': (el) => {
    const c = document.createElement('canvas');
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', 'Animación: las estrellas trazan arcos alrededor de Polaris a lo largo de la noche.');
    el.append(c);
    return arcosPolaris(c, { conControles: true });
  },
  precesion,
  'puertas-enoc': puertasEnoc,
  'fases-luna': fasesLuna,
  retrogrado,
  'sol-dos-modelos': solDosModelos,
  'tipos-eclipse': tiposEclipse,
  zodiaco,
};

// Devuelve una función para desmontarla, o null si el componente no existe.
export function montarAnimacion(nombre, contenedor) {
  const crear = REGISTRO[nombre];
  if (!crear) {
    contenedor.closest('figure')?.remove();
    return null;
  }
  try {
    const inst = crear(contenedor);
    return () => inst?.destruir?.();
  } catch (e) {
    console.error(`No se pudo montar «${nombre}»`, e);
    contenedor.closest('figure')?.remove();
    return null;
  }
}
