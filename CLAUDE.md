# Cosmoastrología: dónde se trabaja

- **El curso vive aquí**: este repositorio (alejandrortl/cosmoastrologia), publicado en Vercel en https://cosmoastrologia-xi.vercel.app/ con el contenido en Supabase (proyecto `cosmoastrologia`).
- **No usar documentos ni artefactos de Anthropic** (Claude Docs, artefactos) para el curso. Decisión del autor: todo cambio se hace en este repositorio y en su base de datos.
- Cada cambio que llega a `main` se publica solo en Vercel.

## Al cambiar el contenido

- El texto original está en `contenido/` y `contenido/generar_seed.py` genera `seed.sql` y `bloques.json`. Mantener el generador y la base de datos sincronizados: si se cambia un bloque en Supabase, reflejarlo también en el generador y regenerar los dos archivos.
- Las imágenes se guardan preferiblemente en el almacén público `medios` de Supabase, para no depender de servidores externos.
- La versión `grande` que abre el visor va en `medios/modulo-N/grande/` y no pasa de 2400 px de lado mayor (3600 en mapas con texto pequeño). Las imágenes de 4000–5000 px hacían que el navegador del móvil se quedara sin memoria y recargara la pestaña.
- Cada imagen lleva su tipo (`foto`, `obra`, `esquema`, `ia`). «Fotografía real» solo para tomas directas de cámara; una composición de datos o un render no es una foto real, y el pie debe decir cómo se hizo.

## Audiolibro

- El reproductor (`js/lector.js`) usa primero la **voz grabada**: un MP3 por párrafo en `audio/`, con `audio/indice.json`. Así sigue sonando con la pantalla apagada y se controla desde la pantalla de bloqueo. Si un párrafo no tiene grabación, lo lee la voz del dispositivo (que se para al bloquear la pantalla).
- Cada archivo se llama con los 16 primeros caracteres del SHA-256 del texto del párrafo preparado para la voz. Si cambia el texto, cambia el nombre.
- **Después de cambiar texto, hay que regrabar**: `python3 contenido/generar_audio.py --piper RUTA/piper --modelo RUTA/es_ES-davefx-medium.onnx --limpiar`. Solo graba los párrafos nuevos o cambiados. Si `textoParaVoz()` cambia en `lector.js`, hay que cambiar igual `texto_para_voz()` en el script.
- Voz: Piper `es_ES-davefx-medium` (CC0). El motor Piper se descarga de github.com/rhasspy/piper (versión 2023.11.14-2) y la voz de los modelos de sherpa-onnx en github.com/k2-fsa/sherpa-onnx (etiqueta `tts-models`); a ese modelo hay que bajarle la versión IR de 9 a 8 (segundo byte del archivo) para que lo abra ese Piper.
