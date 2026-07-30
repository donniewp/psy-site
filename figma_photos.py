#!/usr/bin/env python3
"""
Выгрузка ОРИГИНАЛЬНЫХ растровых изображений (image fills) из Figma.

В отличие от figma_export.py, который рендерит ноды в SVG/PNG,
этот скрипт достаёт исходные битмапы — ровно те файлы, которые
дизайнер загрузил в макет, в полном разрешении, без кропа и эффектов.

Использование:
    export FIGMA_TOKEN=figd_xxxxx
    python3 figma_photos.py
    python3 figma_photos.py --out src/assets/photos --min-width 1600

Зависимостей нет, размеры читаются из заголовков файлов.
"""

import argparse
import json
import os
import re
import struct
import sys
import time
import urllib.error
import urllib.request

FILE_KEY = "jb28AFaMWcumc6iD6MR878"
API = "https://api.figma.com/v1"


# ---------------------------------------------------------------- сеть

def api_get(path, token, timeout=180):
    req = urllib.request.Request(f"{API}/{path}",
                                 headers={"X-Figma-Token": token})
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            if e.code == 429 and attempt < 3:
                print(f"    429, пауза {5 * attempt}s")
                time.sleep(5 * attempt)
                continue
            raise SystemExit(f"Figma API {e.code}: {body}")
        except urllib.error.URLError as e:
            if attempt < 3:
                time.sleep(3 * attempt)
                continue
            raise SystemExit(f"Сеть недоступна: {e}")


def fetch(url, timeout=180):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


# ------------------------------------------------- размеры без Pillow

def png_size(d):
    if d[:8] == b"\x89PNG\r\n\x1a\n" and d[12:16] == b"IHDR":
        return struct.unpack(">II", d[16:24])
    return None


def jpeg_size(d):
    if d[:2] != b"\xff\xd8":
        return None
    i, n = 2, len(d)
    while i < n - 9:
        if d[i] != 0xFF:
            i += 1
            continue
        m = d[i + 1]
        if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", d[i + 5:i + 9])
            return w, h
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        seg = struct.unpack(">H", d[i + 2:i + 4])[0]
        i += 2 + seg
    return None


def webp_size(d):
    if d[:4] != b"RIFF" or d[8:12] != b"WEBP":
        return None
    c = d[12:16]
    if c == b"VP8X":
        w = int.from_bytes(d[24:27], "little") + 1
        h = int.from_bytes(d[27:30], "little") + 1
        return w, h
    if c == b"VP8 ":
        return struct.unpack("<HH", d[26:30])[0] & 0x3FFF, \
               struct.unpack("<HH", d[26:30])[1] & 0x3FFF
    if c == b"VP8L":
        b = d[21:25]
        n = int.from_bytes(b, "little")
        return (n & 0x3FFF) + 1, ((n >> 14) & 0x3FFF) + 1
    return None


def dimensions(data):
    for fn in (png_size, jpeg_size, webp_size):
        try:
            r = fn(data)
            if r:
                return r
        except Exception:
            pass
    return None


def extension(data, content_type):
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:2] == b"\xff\xd8":
        return "jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if "png" in content_type:
        return "png"
    if "webp" in content_type:
        return "webp"
    return "jpg"


# --------------------------------------------- обход дерева документа

def slug(text):
    text = (text or "").strip().lower()
    table = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
             "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k",
             "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
             "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts",
             "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "",
             "э": "e", "ю": "yu", "я": "ya"}
    text = "".join(table.get(ch, ch) for ch in text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:60] or "image"


def walk(node, trail, out):
    """Собирает imageRef -> список путей до нод, где он используется."""
    name = node.get("name", "")
    here = trail + [name] if name else trail
    for fill in node.get("fills") or []:
        if fill.get("type") == "IMAGE" and fill.get("imageRef"):
            out.setdefault(fill["imageRef"], []).append(here)
    for style in (node.get("styles") or {}).values():
        pass
    for child in node.get("children") or []:
        walk(child, here, out)


# ------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="src/assets/photos")
    p.add_argument("--min-width", type=int, default=1600,
                   help="ниже этой ширины помечать как недостаточное качество")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    token = os.environ.get("FIGMA_TOKEN")
    if not token:
        raise SystemExit(
            "Нет FIGMA_TOKEN.\n"
            "  export FIGMA_TOKEN=figd_xxxxx\n"
            "Figma → Settings → Security → Personal access tokens,\n"
            "скоуп File content (read-only)."
        )

    print("1/3  Запрашиваю список исходных изображений...")
    meta = api_get(f"files/{FILE_KEY}/images", token)
    refs = (meta.get("meta") or {}).get("images") or {}
    if not refs:
        raise SystemExit("В файле нет растровых изображений "
                         "(или у токена нет доступа).")
    print(f"     Найдено: {len(refs)}")

    print("2/3  Загружаю дерево документа для имён "
          "(может занять до минуты)...")
    doc = api_get(f"files/{FILE_KEY}", token)
    usage = {}
    walk(doc.get("document", {}), [], usage)
    print(f"     Сопоставлено имён: {len(usage)}")

    if args.dry_run:
        for ref in refs:
            trail = usage.get(ref, [[]])[0]
            print(f"  {ref[:12]}...  {' / '.join(trail[-3:]) or '(без имени)'}")
        return

    print("3/3  Качаю оригиналы...\n")
    os.makedirs(args.out, exist_ok=True)

    rows, used_names, low = [], set(), []

    for i, (ref, url) in enumerate(refs.items(), 1):
        trail = usage.get(ref)
        if trail:
            parts = [x for x in trail[0] if x]
            base = slug(parts[-1] if parts else ref)
            if len(base) < 4 and len(parts) > 1:
                base = slug(parts[-2] + "-" + parts[-1])
        else:
            base = "unused-" + ref[:8]

        name = base
        k = 2
        while name in used_names:
            name = f"{base}-{k}"
            k += 1
        used_names.add(name)

        try:
            data, ctype = fetch(url)
        except Exception as e:
            print(f"  [{i}/{len(refs)}] - {name}: {e}")
            continue

        ext = extension(data, ctype)
        dim = dimensions(data)
        path = os.path.join(args.out, f"{name}.{ext}")
        with open(path, "wb") as f:
            f.write(data)

        w, h = dim if dim else (0, 0)
        kb = len(data) // 1024
        flag = ""
        if dim and max(w, h) < args.min_width:
            flag = "  <-- мало для web"
            low.append((name, w, h))
        print(f"  [{i}/{len(refs)}] + {name}.{ext}  {w}x{h}  {kb} КБ{flag}")
        rows.append({"file": f"{name}.{ext}", "w": w, "h": h,
                     "kb": kb, "ref": ref,
                     "used_in": [" / ".join(t) for t in (trail or [])[:4]]})

    with open(os.path.join(args.out, "_manifest.json"), "w") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)

    print(f"\nГотово: {len(rows)} файлов -> {args.out}")
    print(f"Карта использования: {args.out}/_manifest.json")

    if low:
        print(f"\nНиже {args.min_width}px по длинной стороне — {len(low)} шт.")
        print("Для hero и карточек программ этого мало, нужна пересъёмка:")
        for n, w, h in low[:12]:
            print(f"  {n}  {w}x{h}")

    print("\nДальше:")
    print("  1. Оригиналы положить в src/assets/ и отдать astro:assets")
    print("     import { Image } from 'astro:assets' — сам сгенерит")
    print("     AVIF/WebP под брейкпоинты. Не вставлять эти файлы напрямую.")
    print("  2. Свериться с _manifest.json: поле used_in показывает,")
    print("     в каком блоке макета каждое фото стоит.")


if __name__ == "__main__":
    main()
