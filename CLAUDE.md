# Cosmoastrología: dónde se trabaja

- **El curso vive aquí**: este repositorio (alejandrortl/cosmoastrologia), publicado en Vercel en https://cosmoastrologia-xi.vercel.app/ con el contenido en Supabase (proyecto `cosmoastrologia`).
- **No usar documentos ni artefactos de Anthropic** (Claude Docs, artefactos) para el curso. Decisión del autor: todo cambio se hace en este repositorio y en su base de datos.
- Cada cambio que llega a `main` se publica solo en Vercel.

## Al cambiar el contenido

- El texto original está en `contenido/` y `contenido/generar_seed.py` genera `seed.sql` y `bloques.json`. Mantener el generador y la base de datos sincronizados: si se cambia un bloque en Supabase, reflejarlo también en el generador y regenerar los dos archivos.
- Las imágenes se guardan preferiblemente en el almacén público `medios` de Supabase, para no depender de servidores externos.
- La versión `grande` que abre el visor va en `medios/modulo-N/grande/` y no pasa de 2400 px de lado mayor (3600 en mapas con texto pequeño). Las imágenes de 4000–5000 px hacían que el navegador del móvil se quedara sin memoria y recargara la pestaña.
- Cada imagen lleva su tipo (`foto`, `obra`, `esquema`, `ia`). «Fotografía real» solo para tomas directas de cámara; una composición de datos o un render no es una foto real, y el pie debe decir cómo se hizo.
