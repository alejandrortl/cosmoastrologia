#!/usr/bin/env bash
# Copia de seguridad del curso en tu propio servidor, para usarlo en local sin depender de
# GitHub, Vercel ni Supabase.
#
# Cada vez que se ejecuta:
#   1. Trae la última versión del repositorio (rama main). El repositorio entero, con su
#      historial, ya es una copia del código, del texto original y del audio.
#   2. Monta la web con scripts/copiar-curso.mjs: copia los módulos, secciones y bloques de
#      Supabase y descarga todas las imágenes que usan.
#   3. Guarda esa web en copias/AAAA-MM-DD_HHMM/ y apunta copias/actual a ella. Si algo falla,
#      la última copia buena se queda como estaba.
#   4. Si defines SUPABASE_DB_URL, hace además un volcado completo de la base de datos con
#      pg_dump (incluye lo no publicado).
#   5. Borra las copias más viejas y deja las últimas GUARDAR (por defecto 10).
#
# Uso:   scripts/copia-local.sh            (o: bash copia-local.sh, sin tener aún el repositorio)
# Variables opcionales:
#   DESTINO          carpeta de las copias (por defecto ~/cosmoastrologia-copia)
#   GUARDAR          cuántas copias fechadas guardar (por defecto 10)
#   SUPABASE_DB_URL  cadena de conexión de Postgres para el volcado completo (ver LEEME)
#
# Necesita git y Node 18 o más. Si no hay Node pero sí Docker, usa la imagen node:22-alpine.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/alejandrortl/cosmoastrologia.git}"
RAMA="${RAMA:-main}"
DESTINO="${DESTINO:-$HOME/cosmoastrologia-copia}"
GUARDAR="${GUARDAR:-10}"
REPO="$DESTINO/repositorio"
COPIAS="$DESTINO/copias"
FECHA="$(date +%Y-%m-%d_%H%M)"

aviso() { printf '%s %s\n' "$(date '+%F %T')" "$*"; }

mkdir -p "$DESTINO" "$COPIAS"

# Un solo proceso a la vez (por si el cron se solapa con una ejecución a mano)
exec 9>"$DESTINO/.bloqueo"
if command -v flock >/dev/null 2>&1 && ! flock -n 9; then
  aviso "Ya hay otra copia en marcha; salgo."
  exit 0
fi

# 1. Repositorio
if [ -d "$REPO/.git" ]; then
  aviso "Actualizando el repositorio…"
  git -C "$REPO" fetch --quiet origin "$RAMA"
  git -C "$REPO" checkout --quiet -B "$RAMA" FETCH_HEAD
else
  aviso "Descargando el repositorio…"
  git clone --quiet --branch "$RAMA" "$REPO_URL" "$REPO"
fi
aviso "Repositorio en $(git -C "$REPO" log -1 --format='%h (%cd)' --date=short)."

# 2. Montar la web con la copia del curso
node_ok() {
  command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ]
}
aviso "Copiando el curso…"
if node_ok; then
  (cd "$REPO" && node scripts/copiar-curso.mjs)
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -u "$(id -u):$(id -g)" -v "$REPO:/repo" -w /repo node:22-alpine node scripts/copiar-curso.mjs
else
  aviso "ERROR: hace falta Node 18 o más (o Docker). Instala Node y vuelve a probar."
  exit 1
fi

if [ ! -s "$REPO/public/curso/curso.json" ]; then
  aviso "ERROR: no se ha podido copiar el contenido del curso (Supabase y la web publicada no responden)."
  aviso "La última copia buena sigue en $COPIAS/actual."
  exit 1
fi

# 3. Guardar la copia fechada. Los archivos que no cambian se enlazan a la copia anterior
#    (enlaces duros), así diez copias no ocupan diez veces más.
NUEVA="$COPIAS/$FECHA"
rm -rf "$NUEVA.tmp"
if [ -d "$COPIAS/actual/" ] && command -v rsync >/dev/null 2>&1; then
  rsync -a --link-dest="$(readlink -f "$COPIAS/actual")" "$REPO/public/" "$NUEVA.tmp/"
else
  cp -a "$REPO/public" "$NUEVA.tmp"
fi
git -C "$REPO" log -1 --format='commit %H%nfecha %cI%n%s' > "$NUEVA.tmp/VERSION.txt"
rm -rf "$NUEVA"
mv "$NUEVA.tmp" "$NUEVA"
ln -sfn "$FECHA" "$COPIAS/actual"
aviso "Copia guardada en $NUEVA ($(du -sh "$NUEVA" | cut -f1))."

# 4. Volcado completo de la base de datos (opcional)
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  mkdir -p "$DESTINO/base-de-datos"
  VOLCADO="$DESTINO/base-de-datos/cosmoastrologia_$FECHA.sql.gz"
  aviso "Volcando la base de datos…"
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump --no-owner --no-privileges --schema=public "$SUPABASE_DB_URL" | gzip > "$VOLCADO"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm -e URL="$SUPABASE_DB_URL" postgres:17-alpine \
      sh -c 'pg_dump --no-owner --no-privileges --schema=public "$URL"' | gzip > "$VOLCADO"
  else
    aviso "AVISO: no hay pg_dump ni Docker; me salto el volcado de la base de datos."
    rm -f "$VOLCADO"
  fi
  [ -s "${VOLCADO:-/nonexistent}" ] && aviso "Base de datos en $VOLCADO."
  ls -1t "$DESTINO"/base-de-datos/*.sql.gz 2>/dev/null | tail -n +"$((GUARDAR + 1))" | xargs -r rm -f
fi

# 5. Borrar copias viejas
ls -1d "$COPIAS"/20*/ 2>/dev/null | sort | head -n -"$GUARDAR" | xargs -r rm -rf
aviso "Listo. Para verlo: node $REPO/scripts/servir-local.mjs $COPIAS/actual"
