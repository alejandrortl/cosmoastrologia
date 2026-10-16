"""Genera el SQL que carga el plan del curso y el contenido de los módulos en Supabase.

Uso: python3 contenido/generar_seed.py > contenido/seed.sql
Cada <h2> del HTML de un módulo es una sección; cada <h3> dentro de ella, un bloque de texto.
Las animaciones e interactivos se insertan después del bloque cuyo título se indica en ANIMACIONES.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

AQUI = Path(__file__).parent

MODULOS = [
    (0, "introduccion", "Introducción y principios del curso",
     "De qué trata el curso, cómo está organizado y los criterios que guían todos los módulos.", True),
    (1, "mirar-el-cielo", "Mirar el cielo",
     "Qué vemos realmente a simple vista: estrellas, Sol, Luna, eclipses, planetas y zodiaco, explicados desde cada cosmovisión.", True),
    (2, "la-vision-moderna", "La visión moderna",
     "El modelo de la NASA y la física del cosmos.", False),
    (3, "cosmologias-antiguas", "Cosmologías antiguas",
     "La cosmogonía sumeria (el Enuma Elish y los mitos de creación más antiguos documentados), Babilonia, Egipto, Grecia y Roma.", False),
    (4, "otras-tradiciones", "Otras tradiciones",
     "China, Mesoamérica (maya) y la India védica.", False),
    (5, "tierra-plana-y-geocentrismo", "Tierra plana y modelos geocéntricos",
     "Qué proponían y por qué.", False),
    (6, "comparativa", "Comparativa",
     "Las diferencias clave entre todas las visiones.", False),
    (7, "astrologia", "Astrología",
     "El lado simbólico y cómo leer una carta natal.", False),
    (8, "esoterismo", "Astronomía y astrología esotéricas",
     "La masonería y su simbolismo astral, la cábala judía (el Árbol de la Vida y las correspondencias planetarias) y el misticismo cristiano.", False),
    (9, "cronologias-en-disputa", "Cronologías en disputa",
     "La cronología estándar académica frente a la «Nueva Cronología» de Anatoli Fomenko, atribuida a él y contrastada. Ninguna se da por sentada.", False),
]

ARCHIVOS = {0: "modulo-00-introduccion.html", 1: "modulo-01-mirar-el-cielo.html"}

# (módulo, título de la sección h2, título del h3 tras el que va) -> bloque
ANIMACIONES = {
    (1, "El movimiento de las estrellas y el misterio de Polaris", "Lo que se observa"): (
        "animacion", {"componente": "arcos-polaris",
                      "pie": "El cielo del norte durante una noche: las estrellas dejan arcos en torno a Polaris."}),
    (1, "El movimiento de las estrellas y el misterio de Polaris", "Un dato que cambia todo: la estrella polar no siempre fue Polaris"): (
        "interactivo", {"componente": "precesion",
                        "pie": "Mueve el año y observa cómo el polo celeste pasa de Thuban a Polaris y a Vega."}),
    (1, "El Sol, las estaciones y la eclíptica", "Cómo lo entendían otras cosmovisiones"): (
        "interactivo", {"componente": "puertas-enoc",
                        "pie": "Libro de Enoc, cap. 72: el Sol sale cada mes por una de las seis puertas del este."}),
    (1, "La Luna y sus fases", "Lo que se observa"): (
        "interactivo", {"componente": "fases-luna",
                        "pie": "Arrastra para recorrer un mes lunar de unos 29,5 días."}),
    (1, "Los planetas: los astros errantes", "La explicación moderna"): (
        "animacion", {"componente": "retrogrado",
                      "pie": "Según el modelo moderno: la Tierra adelanta a Marte y, visto desde aquí, Marte parece retroceder."}),
}


def slugify(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def q(s):
    return "'" + s.replace("'", "''") + "'"


def secciones(html):
    partes = re.split(r"<h2[^>]*>(.*?)</h2>", html)
    for i in range(1, len(partes), 2):
        yield partes[i].strip(), partes[i + 1].strip()


def bloques_de_texto(cuerpo):
    """Divide una sección en bloques por <h3>, devolviendo (titulo_h3 o None, html)."""
    trozos = re.split(r"(?=<h3)", cuerpo)
    for trozo in trozos:
        trozo = trozo.strip()
        if not trozo:
            continue
        m = re.match(r"<h3[^>]*>(.*?)</h3>", trozo)
        yield (m.group(1).strip() if m else None), trozo


def main():
    out = ["begin;", "delete from public.bloques; delete from public.secciones; delete from public.modulos;"]
    for num, slug, titulo, resumen, publicado in MODULOS:
        out.append(
            f"insert into public.modulos (numero, slug, titulo, resumen, publicado) values "
            f"({num}, {q(slug)}, {q(titulo)}, {q(resumen)}, {str(publicado).lower()});")
        archivo = ARCHIVOS.get(num)
        if not archivo:
            continue
        html = (AQUI / archivo).read_text(encoding="utf-8")
        for orden_s, (tit_s, cuerpo) in enumerate(secciones(html), start=1):
            out.append(
                f"insert into public.secciones (modulo_id, orden, slug, titulo) select id, {orden_s}, "
                f"{q(slugify(tit_s))}, {q(tit_s)} from public.modulos where numero = {num};")
            orden_b = 0
            for tit_h3, trozo in bloques_de_texto(cuerpo):
                anim = ANIMACIONES.get((num, tit_s, tit_h3))
                lista = [("texto", {"html": trozo})] + ([anim] if anim else [])
                for tipo, contenido in lista:
                    orden_b += 1
                    out.append(
                        f"insert into public.bloques (seccion_id, orden, tipo, contenido) select s.id, {orden_b}, "
                        f"'{tipo}', {q(json.dumps(contenido, ensure_ascii=False))}::jsonb from public.secciones s "
                        f"join public.modulos m on m.id = s.modulo_id where m.numero = {num} and s.orden = {orden_s};")
    # Comprobar que todas las animaciones encontraron su sitio
    usados = "\n".join(out)
    for clave, (_, c) in ANIMACIONES.items():
        if c["componente"] not in usados:
            sys.exit(f"Animación sin colocar: {clave}")
    out.append("commit;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
