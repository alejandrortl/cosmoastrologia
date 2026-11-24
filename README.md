# Cosmoastrología

Curso de astronomía y astrología comparada: lo que se observa en el cielo y cómo lo explica cada cosmovisión. Cada módulo se puede **leer** o **escuchar** como un audiolibro, y lleva **animaciones e interactivos** para ver los fenómenos en movimiento.

## Cómo está hecho

- **HTML, CSS y JavaScript puros.** El único paso al publicar es `scripts/copiar-curso.mjs`, que no necesita instalar nada.
- **Contenido en Supabase** (proyecto `cosmoastrologia`), que sigue siendo la fuente. Al publicar, Vercel copia el curso y sus imágenes dentro de la web (`/curso/curso.json` y `/curso/medios/`), así que la web se muestra aunque Supabase esté pausado. El script monta la web en `public/` (lo que publica Vercel). Si al publicar Supabase no responde, se copia el curso de la web ya publicada; si tampoco, se publica sin copia y la web lee de Supabase como antes. Sin la copia (por ejemplo, en local), la web lee de Supabase con la clave publicable.
- **Funciona sin conexión** (`sw.js`, `manifest.webmanifest`, `js/sin-conexion.js`): se instala como app y guarda la web, los textos y las imágenes la primera vez que se abre. El audiolibro se guarda al escucharlo, o entero con el botón de la portada.
- **Audiolibro** con la voz del propio dispositivo (Web Speech API): resalta el párrafo que lee, recuerda por dónde ibas, permite cambiar velocidad y voz, y saltar a cualquier párrafo tocándolo.

```
index.html                 página única
css/estilos.css            estilos (modo noche y modo día)
js/app.js                  portada, página de módulo y navegación
js/datos.js                lectura del curso (copia local o Supabase)
js/sin-conexion.js         registro del modo sin conexión y botón del audiolibro
sw.js                      service worker del modo sin conexión
scripts/copiar-curso.mjs   copia el curso de Supabase a la web al publicar
js/lector.js               audiolibro
js/animaciones/            un archivo por animación o interactivo
contenido/                 texto original de los módulos y script de carga
vercel.json                rutas /modulo/... hacia index.html
```

## Base de datos

| Tabla | Qué guarda |
|---|---|
| `modulos` | número, slug, título, resumen y si está `publicado` |
| `secciones` | cada apartado de un módulo, en orden |
| `bloques` | el contenido de cada sección, en orden, de uno de estos tipos |

Tipos de bloque y su campo `contenido` (JSON):

- `texto`: `{"html": "<h3>…</h3><p>…</p>"}`
- `imagen`: `{"ruta": "modulo-1/nut.jpg", "pie": "…", "credito": "…", "licencia": "…", "alt": "…"}` (la imagen se sube al almacén público `medios`; también vale `"url"`)
- `audio`: `{"ruta": "modulo-1/intro.mp3", "titulo": "…"}`
- `animacion` / `interactivo`: `{"componente": "precesion", "pie": "…"}`
- `fuente`: `{"cita": "…", "url": "…"}`

Componentes disponibles: `arcos-polaris`, `precesion`, `puertas-enoc`, `fases-luna`, `retrogrado`. Para crear uno nuevo, añade un archivo en `js/animaciones/` y regístralo en `js/animaciones/index.js`.

Para publicar un módulo nuevo se cargan sus secciones y bloques, se pone `publicado = true` y se vuelve a publicar la web (un cambio que llegue a `main`, o **Redeploy** en Vercel), porque la web muestra la copia que se hizo al publicar.

## Publicar en Vercel

1. En vercel.com, **Add New → Project** e importa este repositorio.
2. Framework: **Other**. El comando de build y el directorio de salida (`public`) están en `vercel.json`.
3. Deploy. Cada cambio que llegue a `main` se publica solo.

## Copia de seguridad en un servidor propio

`scripts/copia-local.sh` guarda el repositorio y una copia fechada de la web con todo el curso (bloques, imágenes y audio), y `scripts/servir-local.mjs` la sirve en tu red sin internet. Instrucciones en [`copia-local/LEEME.md`](copia-local/LEEME.md).
