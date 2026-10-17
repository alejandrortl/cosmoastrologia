"""Genera el audiolibro grabado: un MP3 por cada párrafo que lee el reproductor.

Por qué: la voz del propio dispositivo (Web Speech API) se calla cuando se apaga la pantalla.
Un archivo de audio normal, en cambio, sigue sonando en segundo plano.

Cada pasaje (título de sección, subtítulo o párrafo) se identifica por un resumen SHA-256 de su
texto ya preparado para la voz, igual que hace js/lector.js en el navegador. Si se cambia un
párrafo, cambia su clave: el reproductor usará la voz del dispositivo para ese párrafo hasta
que se vuelva a ejecutar este script.

Uso:
    python3 contenido/generar_audio.py --piper RUTA/piper --modelo RUTA/voz.onnx [--hablante N] [--limpiar]
    python3 contenido/generar_audio.py --listar        # solo muestra los pasajes y sus claves

Necesita ffmpeg. La voz por defecto del curso es es_ES-davefx-medium de Piper (licencia CC0).
Los archivos van a audio/ (Vercel los sirve junto a la web) y audio/indice.json dice cuáles hay.
"""

import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI))
import generar_seed as gs  # noqa: E402

SALIDA = AQUI.parent / "audio"

# --- Texto para la voz: copia exacta de textoParaVoz() de js/lector.js ---------------------
# En JavaScript, \b y \d solo conocen letras y cifras ASCII; aquí se escriben a mano para que
# las dos versiones den siempre el mismo resultado.
P = r"(?<![A-Za-z0-9_])"   # \b delante de una letra
F = r"(?![A-Za-z0-9_])"    # \b detrás de una letra
ROMANOS = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}


def romano_a_entero(r):
    total = 0
    for i, ch in enumerate(r):
        a, b = ROMANOS[ch], ROMANOS.get(r[i + 1], 0) if i + 1 < len(r) else 0
        total += -a if a < b else a
    return total


def texto_para_voz(t):
    t = re.sub(r"\s+", " ", t)
    t = re.sub(P + r"(siglos?) ([IVXLC]+)(?:-([IVXLC]+))?",
               lambda m: f"{m[1]} {romano_a_entero(m[2])}" + (f" y {romano_a_entero(m[3])}" if m[3] else ""), t)
    t = re.sub(P + r"a\. ?C\.", "antes de Cristo", t)
    t = re.sub(P + r"d\. ?C\.", "después de Cristo", t)
    t = re.sub(P + r"caps\. ", "capítulos ", t)
    t = re.sub(P + r"cap\. ", "capítulo ", t)
    t = re.sub(P + r"1 Enoc" + F, "Primer libro de Enoc", t)
    t = t.replace("MUL.APIN", "Mul Apín")
    t = re.sub(r"([0-9]+):([0-9]+)-([0-9]+)", r"\1, versículos \2 a \3", t)
    t = re.sub(r"([0-9]+):([0-9]+)", r"\1, versículo \2", t)
    t = re.sub(r"([0-9]+)-([0-9]+)", r"\1 a \2", t)
    t = t.replace("°", " grados").replace(" — ", ", ")
    t = re.sub(r"[«»\"]", "", t)
    return t.strip()


def clave(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()[:16]


# --- Pasajes en el mismo orden que el reproductor: .seccion h2, .texto h3, .texto p:not(.fuentes)
class Pasajes(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.abiertos = []  # [etiqueta, textos] de los h3/p que se están leyendo
        self.pila = []
        self.salida = []

    def handle_starttag(self, tag, attrs):
        if tag in ("br", "img", "hr", "wbr", "input", "source"):
            return
        self.pila.append(tag)
        clases = (dict(attrs).get("class") or "").split()
        if tag == "h3" or (tag == "p" and "fuentes" not in clases):
            item = [tag, []]
            self.salida.append(item)
            self.abiertos.append((len(self.pila), item))

    def handle_endtag(self, tag):
        if tag not in self.pila:
            return
        while self.pila:
            t = self.pila.pop()
            while self.abiertos and self.abiertos[-1][0] > len(self.pila):
                self.abiertos.pop()
            if t == tag:
                break

    def handle_data(self, data):
        for _, item in self.abiertos:
            item[1].append(data)


def pasajes():
    """Lista de (módulo, tipo, texto para la voz) en el orden en que se leen."""
    lista = []
    for num, *_ in gs.MODULOS:
        archivo = gs.ARCHIVOS.get(num)
        if not archivo:
            continue
        doc = (AQUI / archivo).read_text(encoding="utf-8")
        for tit_s, cuerpo in gs.secciones(doc):
            lista.append((num, "h2", texto_para_voz(html.unescape(re.sub(r"<[^>]+>", "", tit_s)))))
            for tit_h3, trozo in gs.bloques_de_texto(cuerpo):
                # El trozo del archivo y, detrás, los bloques de texto añadidos en EXTRAS
                htmls = [trozo] + [c["html"] for tipo, c in gs.EXTRAS.get((num, tit_s, tit_h3), []) if tipo == "texto"]
                for h in htmls:
                    p = Pasajes()
                    p.feed(h)
                    p.close()
                    for tag, partes in p.salida:
                        lista.append((num, tag, texto_para_voz("".join(partes))))
    return [x for x in lista if x[2]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--piper")
    ap.add_argument("--modelo")
    ap.add_argument("--hablante", type=int)
    ap.add_argument("--voz", default="es_ES-davefx-medium (Piper, CC0)")
    ap.add_argument("--limpiar", action="store_true", help="borra los MP3 que ya no usa ningún pasaje")
    ap.add_argument("--rehacer", action="store_true", help="vuelve a grabar todos los pasajes")
    ap.add_argument("--listar", action="store_true")
    a = ap.parse_args()

    todos = pasajes()
    if a.listar:
        for num, tag, t in todos:
            print(num, tag, clave(t), t[:80])
        return

    SALIDA.mkdir(exist_ok=True)
    ruta_indice = SALIDA / "indice.json"
    indice = json.loads(ruta_indice.read_text()) if ruta_indice.exists() else {"pasajes": {}}
    if a.rehacer or indice.get("voz") != a.voz:
        indice["pasajes"] = {}
    hechos = indice["pasajes"]

    pendientes = {}
    for _, tag, t in todos:
        k = clave(t)
        if k not in hechos or not (SALIDA / f"{k}.mp3").exists():
            pendientes[k] = (tag, t)
    print(f"{len(todos)} pasajes, {len(pendientes)} por grabar", file=sys.stderr)

    if pendientes:
        if not (a.piper and a.modelo):
            sys.exit("Faltan --piper y --modelo para grabar los pasajes nuevos.")
        with tempfile.TemporaryDirectory() as tmp:
            entrada = "".join(json.dumps({"text": t, "output_file": f"{tmp}/{k}.wav"}, ensure_ascii=False) + "\n"
                              for k, (_, t) in pendientes.items())
            orden = [a.piper, "-m", a.modelo, "--json-input", "-q"]
            if a.hablante is not None:
                orden += ["-s", str(a.hablante)]
            subprocess.run(orden, input=entrada.encode("utf-8"), check=True, stdout=subprocess.DEVNULL)
            for k, (tag, _) in pendientes.items():
                # Un respiro al final de cada pasaje, y uno más largo antes de cada sección nueva.
                antes, despues = (0.5, 0.45) if tag == "h2" else (0.0, 0.3)
                filtro = f"adelay={int(antes * 1000)}:all=1,apad=pad_dur={despues}"
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{tmp}/{k}.wav", "-af", filtro,
                                "-ac", "1", "-ar", "22050", "-b:a", "48k", str(SALIDA / f"{k}.mp3")], check=True)
                dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                      str(SALIDA / f"{k}.mp3")], capture_output=True, text=True).stdout.strip()
                hechos[k] = round(float(dur), 2)

    usadas = {clave(t) for _, _, t in todos}
    if a.limpiar:
        for f in SALIDA.glob("*.mp3"):
            if f.stem not in usadas:
                f.unlink()
        indice["pasajes"] = {k: v for k, v in hechos.items() if k in usadas}
    indice["voz"] = a.voz
    indice["pasajes"] = dict(sorted(indice["pasajes"].items()))
    ruta_indice.write_text(json.dumps(indice, ensure_ascii=False, indent=0) + "\n")
    total = sum(v for k, v in indice["pasajes"].items() if k in usadas)
    print(f"Listo: {len(usadas)} pasajes, {total / 60:.1f} minutos de audio", file=sys.stderr)


if __name__ == "__main__":
    main()
