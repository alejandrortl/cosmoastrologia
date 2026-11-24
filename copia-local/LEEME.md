# Copia local del curso (copia de seguridad)

Para tener el curso entero en tu propio servidor y poder abrirlo en tu red aunque GitHub, Vercel o Supabase dejen de responder.

## Qué se guarda

En `~/cosmoastrologia-copia/` (o la carpeta que pongas en `DESTINO`):

| Carpeta | Qué hay |
|---|---|
| `repositorio/` | El repositorio completo con su historial: código, texto original (`contenido/`), generador del seed y audio grabado. |
| `copias/AAAA-MM-DD_HHMM/` | La web lista para abrir: páginas, módulos, secciones y bloques (`curso/curso.json`), todas las imágenes (`curso/medios/`) y el audio. `VERSION.txt` dice de qué commit sale. |
| `copias/actual` | Enlace a la copia más reciente. |
| `base-de-datos/` | Solo si configuras `SUPABASE_DB_URL`: volcado completo de la base de datos (`.sql.gz`), con lo no publicado. |

Se guardan las últimas 10 copias (`GUARDAR=10`). Los archivos que no cambian se comparten entre copias, así que ocupan poco más que una sola (unos 60 MB hoy).

Si un día no se puede descargar el curso, la copia de ese día no se hace y la anterior se queda intacta.

## Lo que necesita el servidor

- Linux (cualquier distribución) con `git`.
- **Node 18 o más**, o bien **Docker** (si no hay Node, el script usa la imagen `node:22-alpine`).
- Opcional: `rsync`, para que las copias compartan los archivos iguales.

En Debian o Ubuntu: `sudo apt install git rsync nodejs` (comprueba con `node --version` que sea 18 o más).

## 1. Hacer la primera copia

```bash
git clone https://github.com/alejandrortl/cosmoastrologia.git /tmp/cosmo
bash /tmp/cosmo/scripts/copia-local.sh
```

Al terminar dice dónde ha quedado la copia.

## 2. Abrir el curso en tu red

```bash
node ~/cosmoastrologia-copia/repositorio/scripts/servir-local.mjs ~/cosmoastrologia-copia/copias/actual
```

Ábrelo en `http://IP-DEL-SERVIDOR:8080` desde cualquier ordenador o móvil de casa (el puerto se cambia con `PUERTO=9000`). Funciona sin internet; solo las fuentes tipográficas de Google se sustituyen por las del sistema.

Para que arranque solo al encender el servidor, elige una de estas dos:

- **systemd**: edita `copia-local/cosmoastrologia.service` (cambia `TU_USUARIO`) y sigue las instrucciones de su cabecera.
- **Docker**: `docker compose -f ~/cosmoastrologia-copia/repositorio/copia-local/docker-compose.yml up -d`

El servidor siempre muestra `copias/actual`, así que cada copia nueva se ve sin reiniciarlo.

Nota: el botón de «guardar para usar sin conexión» del móvil solo se activa con `https` o en `localhost`. Por `http://IP` la web funciona igual mientras el servidor esté encendido.

## 3. Copia automática cada noche

`crontab -e` y añade esta línea (todas las noches a las 3:30):

```
30 3 * * * bash $HOME/cosmoastrologia-copia/repositorio/scripts/copia-local.sh >> $HOME/cosmoastrologia-copia/registro.txt 2>&1
```

## 4. (Opcional) Volcado completo de la base de datos

La copia normal lee Supabase con la clave pública, que solo ve los módulos publicados. Para guardar también lo no publicado y poder reconstruir la base de datos:

1. En el panel de Supabase, proyecto `cosmoastrologia`, pulsa **Connect** y copia la cadena de conexión **Session pooler** (empieza por `postgresql://postgres.gjkvcdkidjxenhfgxvkc:`), con la contraseña de la base de datos.
2. Guárdala en un archivo que solo lea tu usuario:
   ```bash
   echo 'export SUPABASE_DB_URL="postgresql://…"' > ~/.cosmoastrologia-db && chmod 600 ~/.cosmoastrologia-db
   ```
3. En la línea del cron, carga ese archivo antes: `. $HOME/.cosmoastrologia-db && bash …/copia-local.sh …`

Necesita `pg_dump` (paquete `postgresql-client`, versión 17 o más) o Docker. Para restaurar en otro Postgres: `gunzip -c archivo.sql.gz | psql "CADENA_DE_CONEXIÓN"`.
