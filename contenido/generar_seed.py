"""Genera el SQL que carga el plan del curso y el contenido de los módulos en Supabase.

Uso: python3 contenido/generar_seed.py > contenido/seed.sql
     python3 contenido/generar_seed.py --json > contenido/bloques.json
Cada <h2> del HTML de un módulo es una sección; cada <h3> dentro de ella, un bloque de texto.
Las fotos, animaciones e interactivos se insertan después del bloque cuyo título se indica en EXTRAS.
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

# Versiones para el visor guardadas en el almacén propio, limitadas a 2400 px de lado mayor
# (3600 en el mapa de Gleason) para que el móvil no se quede sin memoria al ampliarlas.
GRANDE = "https://gjkvcdkidjxenhfgxvkc.supabase.co/storage/v1/object/public/medios/modulo-1/grande/"

# Fotos y obras de archivo libre. Las de Wikimedia Commons se enlazan por su nombre de archivo.
def commons(nombre, ancho=1280):
    """Devuelve (url para la página, enlace a la ficha, url grande para el visor con zoom)."""
    from urllib.parse import quote
    n = quote(nombre.replace(' ', '_'))
    base = f"https://commons.wikimedia.org/wiki/Special:FilePath/{n}"
    return (f"{base}?width={ancho}", f"https://commons.wikimedia.org/wiki/File:{n}", f"{base}?width=2400")


def imagen(tipo, url, enlace, pie, credito, licencia, fecha=None, alt=None, grande=None, iiif=None, tam=None):
    c = {"tipo": tipo, "url": url, "enlace": enlace, "pie": pie, "credito": credito, "licencia": licencia}
    if grande:
        c["grande"] = grande
    if iiif:
        c["iiif"] = iiif  # servidor de teselas: el visor permite zoom profundo
    if tam:
        c["tam"] = tam    # ancho y alto en píxeles del original, por si no se puede leer su ficha
    if fecha:
        c["fecha"] = fecha
    if alt:
        c["alt"] = alt
    return ("imagen", c)


def widget(tipo, componente, etiqueta, modelo, pie):
    return (tipo, {"componente": componente, "etiqueta": etiqueta, "modelo": modelo, "pie": pie})


FOTO_NORTE = imagen(
    "foto", "https://noirlab.edu/public/media/archives/images/screen/iotw2033a.jpg",
    "https://kpno.noirlab.edu/images/iotw2033a/",
    "Hemisferio norte: fotografía de larga exposición en el observatorio de Kitt Peak (Arizona). Las estrellas trazan arcos en torno a Polaris.",
    "KPNO/NOIRLab/NSF/AURA", "CC BY 4.0",
    grande=GRANDE + "kitt-peak-arcos.jpg")
FOTO_SUR = imagen(
    "foto", "https://cdn.eso.org/images/screen/171109-cc.jpg",
    "https://www.eso.org/public/images/171109-cc/",
    "Hemisferio sur: fotografía de larga exposición con objetivo de ojo de pez en el observatorio Paranal (Chile). Los arcos giran en torno a otro punto del cielo, sin estrella brillante en el centro.",
    "ESO/A. Santerne", "CC BY 4.0", grande=GRANDE + "paranal-arcos.jpg")
FOTO_TIERRA = imagen(
    "foto", "https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~medium.jpg",
    "https://images.nasa.gov/details/as17-148-22727",
    "La NASA la publica como una fotografía tomada por la tripulación del Apolo 17 en 1972, de camino a la Luna. El modelo moderno la presenta entre sus pruebas; los defensores de la Tierra plana cuestionan la autenticidad de este tipo de imágenes.",
    "NASA", "Dominio público", fecha="1972",
    grande=GRANDE + "apolo17-as17-148-22727.jpg")
_lev = "https://iiif.digitalcommonwealth.org/iiif/2/commonwealth:7h149v867"
# Copias en el almacén propio (medios/modulo-1/) para no depender del servidor externo,
# sacadas de su servidor IIIF (_lev). El zoom profundo desde ese servidor fallaba en el móvil.
_medios = "https://gjkvcdkidjxenhfgxvkc.supabase.co/storage/v1/object/public/medios/modulo-1"
MAPA_GLEASON = imagen(
    "obra", _medios + "/gleason-1892-1400.jpg", "https://collections.leventhalmap.org/search/commonwealth:7h149v85z",
    "Mapa del mundo de Alexander Gleason (1892), con el polo norte en el centro y el borde del sur alrededor. Es la disposición que suele usarse para representar el modelo plano de un solo centro. Amplíalo para leer sus anotaciones.",
    "Alexander Gleason, 1892. Leventhal Map & Education Center (Biblioteca Pública de Boston)",
    "Sin restricciones de uso conocidas", fecha="1892", grande=GRANDE + "gleason-1892.jpg")
# Explicación que va justo debajo de la foto del Apolo 17
TEXTO_FOTO_TIERRA = ("texto", {"html": (
    "<h3>Fotografía directa frente a composición: cómo leer una imagen de la Tierra</h3>\n"
    "<p>No todas las imágenes famosas de la Tierra vistas desde el espacio son fotografías en el mismo sentido. "
    "Conviene distinguir tres tipos: la <strong>fotografía directa</strong> (una sola toma de cámara), "
    "la <strong>composición de datos</strong> (muchas observaciones unidas por ordenador) y la "
    "<strong>ilustración o render</strong> (una recreación).</p>\n"
    "<p><strong>La foto del Apolo 17 (1972).</strong> Fue tomada el 7 de diciembre de 1972 por Ron Evans o Harrison Schmitt "
    "durante el viaje a la Luna, a unos 29.400 km de la superficie, con una cámara Hasselblad de 70 mm y objetivo de 80 mm. "
    "Su nombre oficial en el archivo de NASA es AS17-148-22727, y es la tercera de una serie de tomas casi idénticas hechas justo antes. "
    "Es una fotografía de una sola vez. Pero la versión que todos conocemos no es exactamente el original: se distribuyó recortada, "
    "girada para poner el sur abajo y con el color ajustado. En el fotograma original el polo sur aparece arriba, y la imagen abarca "
    "desde el Mediterráneo hasta la Antártida.</p>\n"
    "<p><strong>La «Blue Marble» de 2002.</strong> Pese al nombre, es otra cosa. Según la propia NASA, científicos y visualizadores "
    "unieron meses de observaciones de tierra, océanos, hielo marino y nubes en un mosaico continuo. La superficie procede de "
    "observaciones sin nubes tomadas entre junio y septiembre de 2001, el relieve se sombreó con datos de elevación del Servicio "
    "Geológico de EE. UU. y las nubes son una composición de dos días de imágenes. Su autor, Robert Simmon, explicó que renderizó "
    "por separado tierra y océano, brillos, nubes, máscaras de día y noche y la neblina atmosférica. Es decir: está hecha con datos "
    "reales, pero la imagen final es una construcción por ordenador, no una vista que alguien pudiera haber fotografiado.</p>\n"
    "<p><strong>Por qué importa.</strong> Llamar «foto real» a una composición es una afirmación sin matizar. La regla del curso es "
    "atribuir cada imagen a quien la produjo y decir cómo se hizo: quién, con qué instrumento, y si es una toma única, un montaje o "
    "una recreación.</p>\n"
    "<p class=\"fuentes\">Fuentes: <a href=\"https://en.wikipedia.org/wiki/The_Blue_Marble\" target=\"_blank\" rel=\"noopener\">Wikipedia, «The Blue Marble»</a> · "
    "<a href=\"https://earthobservatory.nasa.gov/Features/BlueMarble/BlueMarble_2002.php\" target=\"_blank\" rel=\"noopener\">NASA Earth Observatory, Blue Marble 2002</a> · "
    "<a href=\"https://svs.gsfc.nasa.gov/30614\" target=\"_blank\" rel=\"noopener\">NASA SVS, Blue Marble 2002</a> · "
    "<a href=\"https://earthobservatory.nasa.gov/blogs/elegantfigures/2011/10/\" target=\"_blank\" rel=\"noopener\">Robert Simmon, «Crafting the Blue Marble»</a></p>"
)})
_u, _e, _g = commons("Flammarion.jpg")
GRABADO_FLAMMARION = imagen(
    "obra", _u, _e,
    "Grabado publicado por Camille Flammarion en «L'atmosphère» (París, 1888): un viajero asoma la cabeza más allá de la bóveda del cielo. Aunque a menudo se presenta como medieval, es del siglo XIX.",
    "Autor desconocido, en C. Flammarion, 1888", "Dominio público", fecha="1888", grande=GRANDE + "flammarion.jpg")
_u, _e, _g = commons("Cellarius Harmonia Macrocosmica - Scenographia Systematis mundani Ptolemaici.jpg")
CELLARIUS_PTOLOMEO = imagen(
    "obra", _u, _e,
    "El sistema de Ptolomeo en el atlas «Harmonia Macrocosmica» de Andreas Cellarius (1660): la Tierra en el centro, rodeada por las esferas de los astros.",
    "Andreas Cellarius", "Dominio público", fecha="1660", grande=GRANDE + "cellarius-ptolomeo.jpg")
_u, _e, _g = commons("WorldMapCosmasIndicopleustes.jpg")
MAPA_COSMAS = imagen(
    "obra", _u, _e,
    "Mapa del mundo de la «Topografía cristiana» de Cosmas Indicopleustes (siglo VI), tal como se conserva en copias manuscritas: la tierra habitada rodeada por el océano.",
    "Cosmas Indicopleustes (copia manuscrita)", "Dominio público", fecha="Siglo VI", grande=GRANDE + "cosmas.jpg")
_u, _e, _g = commons("Cellarius Harmonia Macrocosmica - Solis circa Orbem Terrarum Spiralis Revolutio.jpg")
CELLARIUS_ESPIRAL = imagen(
    "obra", _u, _e,
    "Cellarius (1660): el recorrido en espiral del Sol alrededor de la Tierra a lo largo del año, según el modelo geocéntrico.",
    "Andreas Cellarius", "Dominio público", fecha="1660", grande=GRANDE + "cellarius-espiral.jpg")
FOTO_LUNA = imagen(
    "foto", "https://cdn.eso.org/images/screen/eso1210a.jpg",
    "https://www.eso.org/public/images/eso1210a/",
    "Luna creciente sobre el observatorio Paranal (Chile), el 27 de octubre de 2011. La parte oscura brilla débilmente: es la llamada luz cenicienta.",
    "ESO/B. Tafreshi (twanight.org)", "CC BY 4.0", fecha="2011", grande=GRANDE + "paranal-luna.jpg")
FOTO_CORONA = imagen(
    "foto", "https://www.nasa.gov/wp-content/uploads/2023/03/36329608000_2e0f627e4b_o.jpg",
    "https://www.nasa.gov/image-article/suns-corona-seen-during-2017-solar-eclipse/",
    "Eclipse total de Sol del 21 de agosto de 2017, fotografiado desde un avión sobre Oregón (Estados Unidos): durante la totalidad se ve la corona.",
    "NASA/Carla Thomas", "Dominio público", fecha="2017")
FOTO_LUNA_ROJA = imagen(
    "foto", "https://cdn.eso.org/images/screen/potw2221a.jpg",
    "https://www.eso.org/public/images/potw2221a/",
    "Eclipse total de Luna del 15 de mayo de 2022, visto desde el observatorio Paranal (Chile): durante la totalidad la Luna toma un tono rojizo.",
    "F. Aedo, F. Durán/ESO", "CC BY 4.0", fecha="2022", grande=GRANDE + "paranal-eclipse-luna.jpg")
_u, _e, _g = commons("Description of Egypt. 2nd edition. 1822. Vol. 4. Pl. 21 (Dendera Circular Zodiac).jpg")
DENDERA = imagen(
    "obra", _u, _e,
    "El zodiaco circular de Dendera dibujado para la «Description de l'Égypte» (edición de 1822). El original, un relieve de época ptolemaica, se conserva hoy en el Museo del Louvre.",
    "Description de l'Égypte", "Dominio público", fecha="1822", grande=GRANDE + "dendera.jpg")

SEC_POLARIS = "El movimiento de las estrellas y el misterio de Polaris"
SEC_SOL = "El Sol, las estaciones y la eclíptica"
SEC_LUNA = "La Luna y sus fases"
SEC_ECLIPSES = "Los eclipses"
SEC_PLANETAS = "Los planetas: los astros errantes"
SEC_ZODIACO = "El zodiaco y las constelaciones"
OBS = "Lo que se observa"
MOD = "La explicación moderna"
PLANO = "La explicación terraplanista"
OTRAS = "Cómo lo entendían otras cosmovisiones"

# (módulo, sección h2, h3 tras el que van) -> bloques que se insertan después
SEC_PALABRAS = "Las palabras básicas para mirar el cielo"
SEC_MODELOS = "Los grandes modelos del mundo y quién los usó"
SEC_ORIENTARSE = "Orientarse en el cielo"
SEC_PRACTICAR = "Practicar bajo el cielo: calendario y misiones"

EXTRAS = {
    (1, SEC_ORIENTARSE, "El cielo de esta noche"): [
        widget("interactivo", "cielo-esta-noche", "Interactivo", "Observación: el cielo de cualquier noche",
               "El cielo calculado para la fecha, la hora y el lugar elegidos. Estrellas y constelaciones: d3-celestial de Olaf Frohn (catálogo Hipparcos). Sol, Luna y planetas: método de cálculo de Paul Schlyter.")],
    (1, SEC_ORIENTARSE, "Saltos de estrella: de una estrella conocida a otra"): [
        widget("interactivo", "saltos-estrella", "Interactivo", "Observación",
               "Elige una ruta y avanza paso a paso. El mapa tiene el norte arriba y el este a la izquierda, como el cielo al mirar hacia arriba.")],
    (1, SEC_ORIENTARSE, "Practica la regla de la mano"): [
        widget("interactivo", "medir-mano", "Interactivo", "Observación",
               "Elige cuánto crees que hay entre las dos estrellas y compruébalo. Las distancias se calculan con las posiciones del catálogo Hipparcos (d3-celestial).")],
    (1, SEC_ORIENTARSE, "Las constelaciones de cada estación"): [
        widget("interactivo", "cielo-estaciones", "Interactivo", "Observación",
               "El cielo hacia las 22:00 de mediados de cada mes, desde 40° N o 34° S, con las figuras de la estación resaltadas. Estrellas y constelaciones: d3-celestial de Olaf Frohn (catálogo Hipparcos).")],
    (1, SEC_PRACTICAR, "Calendario del cielo"): [
        widget("interactivo", "calendario-cielo", "Interactivo", "Observación",
               "Calculado en tu dispositivo para los doce meses siguientes. Sol, Luna y planetas: método de Paul Schlyter. Eclipses: NASA (Fred Espenak). Lluvias de estrellas: Organización Internacional de Meteoros.")],
    (1, SEC_PRACTICAR, "Misiones de observación"): [
        widget("interactivo", "misiones", "Interactivo", "Tu cuaderno de observación",
               "Marca las misiones que vayas haciendo y apunta tus notas. Se guardan solo en este navegador.")],
    (1, SEC_ORIENTARSE, "Encontrar los puntos cardinales sin brújula"): [
        widget("interactivo", "sombra-palo", "Interactivo", "Observación",
               "Un palo visto desde arriba y el recorrido de la punta de su sombra a lo largo del día. Mueve la hora de la primera marca y cambia de lugar y de estación.")],
    (1, SEC_PALABRAS, "Lo que ves desde donde estás: horizonte, cenit y puntos cardinales"): [
        widget("interactivo", "cielo-local", "Interactivo", "Observación",
               "Mueve la altura del astro y mira cuántos puños hay desde el horizonte.")],
    (1, SEC_PALABRAS, "Hemisferios, ecuador, latitud y longitud"): [
        widget("interactivo", "mapa-dos-modelos", "Interactivo", "Dos modelos: globo y plano",
               "El mismo mundo dibujado por los dos modelos. Elige un lugar o mueve la latitud y la longitud: en dorado, su paralelo y su meridiano. Continentes: Natural Earth, simplificados.")],
    (1, SEC_PALABRAS, "El cielo como una cúpula: polos celestes y ecuador celeste"): [
        widget("interactivo", "donde-apuntar", "Interactivo", "Observación y dos modelos: globo y plano",
               "Arriba, lo que ves y hacia dónde apuntar la cámara según la latitud. Abajo, cómo dibuja esa misma situación cada modelo. Esquemas, no a escala.")],
    (1, SEC_MODELOS, "Dos preguntas, cuatro respuestas"): [
        widget("interactivo", "cuatro-modelos", "Interactivo", "Los cuatro modelos",
               "Las dos preguntas combinadas. Toca un modelo para ver qué culturas lo usaron."),
        widget("interactivo", "linea-tiempo", "Interactivo", "Línea del tiempo",
               "Qué modelo usó cada cultura, de la más antigua a hoy. Dos franjas en una barra: convivieron dos modelos o su lectura se debate. El detalle está en el texto que sigue.")],
    (1, SEC_POLARIS, OBS): [
        widget("animacion", "arcos-polaris", "Animación", "Observación",
               "Una noche mirando al polo celeste, en el hemisferio norte y en el sur: las estrellas dejan arcos en torno a cada polo. Cambia de hemisferio con los botones."),
        FOTO_NORTE, FOTO_SUR],
    (1, SEC_POLARIS, MOD): [FOTO_TIERRA, TEXTO_FOTO_TIERRA],
    (1, SEC_POLARIS, PLANO): [
        widget("interactivo", "sur-plano", "Interactivo", "Según el modelo plano: tres propuestas",
               "Las tres propuestas que recoge la wiki de la Flat Earth Society para el giro del cielo del sur. Esquemas simplificados."),
        MAPA_GLEASON],
    (1, SEC_POLARIS, "Un dato que cambia todo: la estrella polar no siempre fue Polaris"): [
        widget("interactivo", "precesion", "Interactivo", "Observación, con el cálculo moderno de la precesión",
               "Mueve el año y observa cómo el polo celeste pasa de Thuban a Polaris y a Vega.")],
    (1, SEC_POLARIS, OTRAS): [CELLARIUS_PTOLOMEO, GRABADO_FLAMMARION, MAPA_COSMAS],
    (1, SEC_SOL, PLANO): [
        widget("interactivo", "sol-dos-modelos", "Interactivo", "Dos modelos: moderno y plano",
               "El mismo año explicado por los dos modelos. Arriba, la Tierra inclinada alrededor del Sol; abajo, el Sol girando sobre el plano entre los trópicos. Esquemas, no a escala.")],
    (1, SEC_SOL, OTRAS): [
        CELLARIUS_ESPIRAL,
        widget("interactivo", "puertas-enoc", "Interactivo", "Según el Libro de Enoc",
               "Libro de Enoc, cap. 72: el Sol sale cada mes por una de las seis puertas del este.")],
    (1, SEC_LUNA, OBS): [
        widget("interactivo", "fases-luna", "Interactivo", "Observación",
               "Arrastra para recorrer un mes lunar de unos 29,5 días. El botón muestra, además, el esquema con el que lo explica el modelo moderno."),
        FOTO_LUNA],
    (1, SEC_ECLIPSES, "Los tipos de eclipse"): [
        widget("interactivo", "tipos-eclipse", "Interactivo", "Observación",
               "Cómo se ve cada tipo de eclipse desde el suelo. Esquema, no a escala."),
        FOTO_CORONA, FOTO_LUNA_ROJA],
    (1, SEC_PLANETAS, MOD): [
        widget("animacion", "retrogrado", "Animación", "Tres modelos comparados",
               "Un mismo bucle de Marte con tres disposiciones: la heliocéntrica de Copérnico y Kepler, la geocéntrica de Ptolomeo con epiciclos y la de la Flat Earth Society, con los planetas girando alrededor de un Sol que da vueltas sobre el centro del plano. Esquemas simplificados.")],
    (1, SEC_ZODIACO, MOD): [
        widget("interactivo", "zodiaco", "Interactivo", "Constelaciones y signos",
               "Fuera, las constelaciones por las que pasa el Sol; dentro, los doce signos del zodiaco tropical, que empiezan en el equinoccio. Mueve el año para ver cómo se separan.")],
    (1, SEC_ZODIACO, OTRAS): [DENDERA],
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


def bloques_json():
    """Lista plana de bloques, para que la base de datos la lea con pg_net desde GitHub."""
    filas = []
    for num, *_ in MODULOS:
        archivo = ARCHIVOS.get(num)
        if not archivo:
            continue
        html = (AQUI / archivo).read_text(encoding="utf-8")
        for orden_s, (tit_s, cuerpo) in enumerate(secciones(html), start=1):
            orden_b = 0
            for tit_h3, trozo in bloques_de_texto(cuerpo):
                for tipo, contenido in [("texto", {"html": trozo})] + EXTRAS.get((num, tit_s, tit_h3), []):
                    orden_b += 1
                    filas.append({"modulo": num, "seccion": orden_s, "orden": orden_b, "tipo": tipo, "contenido": contenido})
    return filas


def main():
    if "--json" in sys.argv:
        print(json.dumps(bloques_json(), ensure_ascii=False, indent=1))
        return
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
                lista = [("texto", {"html": trozo})] + EXTRAS.get((num, tit_s, tit_h3), [])
                for tipo, contenido in lista:
                    orden_b += 1
                    out.append(
                        f"insert into public.bloques (seccion_id, orden, tipo, contenido) select s.id, {orden_b}, "
                        f"'{tipo}', {q(json.dumps(contenido, ensure_ascii=False))}::jsonb from public.secciones s "
                        f"join public.modulos m on m.id = s.modulo_id where m.numero = {num} and s.orden = {orden_s};")
    # Comprobar que todos los extras encontraron su sitio
    usados = "\n".join(out)
    for clave, bloques in EXTRAS.items():
        for _, c in bloques:
            marca = c.get("componente") or c.get("enlace")
            if json.dumps(marca)[1:-1] not in usados:
                sys.exit(f"Bloque sin colocar: {clave}")
    out.append("commit;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
