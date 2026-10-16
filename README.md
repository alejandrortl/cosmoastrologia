# Cosmoastrología

Curso de astronomía y astrología comparada: lo que se observa en el cielo y cómo lo explica cada cosmovisión. Cada módulo se puede **leer** o **escuchar** como un audiolibro, y lleva **animaciones e interactivos** para ver los fenómenos en movimiento.

## Cómo está hecho

- **Sin paso de compilación.** HTML, CSS y JavaScript puros. Vercel publica la carpeta tal cual.
- **Contenido en Supabase** (proyecto `cosmoastrologia`). La web lo lee con la clave publicable, que solo permite leer los módulos marcados como publicados.
- **Audiolibro** con la voz del propio dispositivo (Web Speech API): resalta el párrafo que lee, recuerda por dónde ibas, permite cambiar velocidad y voz, y saltar a cualquier párrafo tocándolo.

```
index.html                 página única
css/estilos.css            estilos (modo noche y modo día)
js/app.js                  portada, página de módulo y navegación
js/datos.js                lectura de la base de datos
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

Para publicar un módulo nuevo basta con cargar sus secciones y bloques y poner `publicado = true`; no hace falta volver a desplegar la web.

## Publicar en Vercel

1. En vercel.com, **Add New → Project** e importa este repositorio.
2. Framework: **Other**. Sin comando de build ni directorio de salida.
3. Deploy. Cada cambio que llegue a `main` se publica solo.
