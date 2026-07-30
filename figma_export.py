#!/usr/bin/env python3
"""
Массовая выгрузка ассетов из Figma в репозиторий.

Один запуск — все иконки и иллюстрации лежат локально,
Figma MCP для ассетов больше не нужен.

Использование:
    export FIGMA_TOKEN=figd_xxxxx
    python3 figma_export.py
    python3 figma_export.py --out src/assets/figma --dry-run

Токен: Figma → Settings → Security → Personal access tokens.
Если токен со скоупами — включить "File content" (read-only).

Зависимостей нет, только стандартная библиотека.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

FILE_KEY = "jb28AFaMWcumc6iD6MR878"
API = "https://api.figma.com/v1"
CHUNK = 25          # сколько нод просить за один запрос
RETRIES = 3

# node_id -> относительный путь без расширения
MANIFEST = {
    # --- 84px Main icons: боли для секции «С чем мы помогаем» ---
    "384:86":  "icons/problems/destructive-beliefs",
    "384:212": "icons/problems/difficult-education",
    "384:130": "icons/problems/personal-conflicts",
    "384:142": "icons/problems/age-crises",
    "384:154": "icons/problems/low-motivation",
    "384:163": "icons/problems/inattention",
    "384:186": "icons/problems/computer-addiction",
    "384:214": "icons/problems/difficult-behavior",
    "384:216": "icons/problems/relationships-child-parent",
    "385:8":   "icons/problems/adhd",

    # --- 48px Tab icons: блок Features Tab ---
    "387:79":  "icons/tabs/small-groups",
    "387:94":  "icons/tabs/top-methodics",
    "387:96":  "icons/tabs/fast-connection",
    "387:101": "icons/tabs/development-game",

    # --- 24px UI icons ---
    "384:31":   "icons/ui/point",
    "385:29":   "icons/ui/person",
    "385:46":   "icons/ui/envelope",
    "385:48":   "icons/ui/click-hand",
    "385:57":   "icons/ui/plus",
    "385:66":   "icons/ui/further",
    "463:6672": "icons/ui/ui-07",
    "463:6918": "icons/ui/ui-08",
    "463:6928": "icons/ui/ui-09",
    "463:6935": "icons/ui/ui-10",
    "463:7189": "icons/ui/ui-11",

    # --- 40px badges: значки на hero-фото ---
    "384:50": "icons/badges/handshake",
    "384:74": "icons/badges/online-support",

    # --- Логотип ---
    "382:17": "logo/logo-full",
    "382:30": "logo/logo-sign",

    # --- Соцсети ---
    "384:41":  "icons/social/telegram",
    "384:42":  "icons/social/whatsapp",
    "387:156": "icons/social/telegram-white",
    "387:158": "icons/social/whatsapp-white",
    "387:164": "icons/social/vk-white",
    "387:166": "icons/social/ok-white",
    "387:168": "icons/social/dzen-white",
    "387:170": "icons/social/b17-white",

    # --- Illustration pathway: «Путь развития» (пять штук на четыре этапа) ---
    "390:32":  "illustrations/pathway/worker",
    "389:43":  "illustrations/pathway/talk",
    "390:26":  "illustrations/pathway/look-up",
    "389:123": "illustrations/pathway/playground",
    "389:126": "illustrations/pathway/school-set",

    # --- Illustration points: блок квалификации педагога ---
    "389:33": "illustrations/points/draw",
    "389:37": "illustrations/points/degree",
    "389:32": "illustrations/points/specialist",
    "389:26": "illustrations/points/tree",

    # --- tab illustrations: крупные картинки в Features Tab ---
    "487:20561": "illustrations/tabs/small-group",
    "487:20563": "illustrations/tabs/new-methodics",
    "487:20627": "illustrations/tabs/fast-reply",
    "487:20691": "illustrations/tabs/devgame",

    # --- Doodles: декор ---
    "391:378": "illustrations/doodles/question-mark",
    "391:369": "illustrations/doodles/nav-sign",
    "391:364": "illustrations/doodles/cloud",
    "391:376": "illustrations/doodles/arrow",
    "391:377": "illustrations/doodles/paper-clip",
    "391:358": "illustrations/doodles/cloud-large",

    # --- Прочее ---
    "390:233":  "illustrations/price/tree",
    "390:231":  "illustrations/price/tree-small",
    "418:1285": "components/badge-hero",
}


def request(url, token, tries=RETRIES):
    """GET с заголовком токена и простым бэкоффом."""
    for attempt in range(1, tries + 1):
        req = urllib.request.Request(url, headers={"X-Figma-Token": token})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            if e.code == 429 and attempt < tries:
                wait = 5 * attempt
                print(f"    429 rate limit, пауза {wait}s")
                time.sleep(wait)
                continue
            raise SystemExit(f"Figma API {e.code}: {body}")
        except urllib.error.URLError as e:
            if attempt < tries:
                time.sleep(3 * attempt)
                continue
            raise SystemExit(f"Сеть недоступна: {e}")
    return None


def download(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = resp.read()
    with open(path, "wb") as f:
        f.write(data)
    return len(data)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="src/assets/figma",
                   help="куда складывать (по умолчанию src/assets/figma)")
    p.add_argument("--format", default="svg", choices=["svg", "png", "pdf"])
    p.add_argument("--scale", default="2", help="только для png")
    p.add_argument("--dry-run", action="store_true",
                   help="показать план, ничего не качать")
    args = p.parse_args()

    token = os.environ.get("FIGMA_TOKEN")
    if not token and not args.dry_run:
        raise SystemExit(
            "Нет FIGMA_TOKEN.\n"
            "  export FIGMA_TOKEN=figd_xxxxx\n"
            "Создать: Figma → Settings → Security → Personal access tokens\n"
            "Если токен со скоупами — включить File content (read-only)."
        )

    ids = list(MANIFEST.keys())
    print(f"Файл:    {FILE_KEY}")
    print(f"Формат:  {args.format}")
    print(f"Ассетов: {len(ids)}")
    print(f"Каталог: {args.out}\n")

    if args.dry_run:
        for nid, rel in MANIFEST.items():
            print(f"  {nid:12} -> {args.out}/{rel}.{args.format}")
        return

    ok, failed = 0, []

    for start in range(0, len(ids), CHUNK):
        chunk = ids[start:start + CHUNK]
        n = start // CHUNK + 1
        total = (len(ids) + CHUNK - 1) // CHUNK
        print(f"[{n}/{total}] запрашиваю рендеры ({len(chunk)} шт)")

        params = {"ids": ",".join(chunk), "format": args.format}
        if args.format == "png":
            params["scale"] = args.scale

        url = f"{API}/images/{FILE_KEY}?" + urllib.parse.urlencode(params)
        data = request(url, token)

        if data.get("err"):
            print(f"    ошибка: {data['err']}")
            failed.extend(chunk)
            continue

        images = data.get("images", {})
        for nid in chunk:
            link = images.get(nid)
            rel = MANIFEST[nid]
            if not link:
                print(f"    - {rel}: пустой рендер (нода могла быть удалена)")
                failed.append(nid)
                continue
            dest = os.path.join(args.out, f"{rel}.{args.format}")
            try:
                size = download(link, dest)
                print(f"    + {rel}.{args.format}  ({size // 1024 or 1} КБ)")
                ok += 1
            except Exception as e:
                print(f"    - {rel}: {e}")
                failed.append(nid)

        time.sleep(1)  # вежливая пауза между пачками

    print(f"\nГотово: {ok} из {len(ids)}")
    if failed:
        print("Не выгрузились:")
        for nid in failed:
            print(f"  {nid}  ({MANIFEST[nid]})")

    if args.format == "svg" and ok:
        print("\nДальше — оптимизация:")
        print(f"  npx svgo -rf {args.out} --multipass")
        print("Потом проверить, что иконки красятся currentColor:")
        print(f"  grep -rl 'fill=\"#' {args.out}/icons | head")


if __name__ == "__main__":
    main()
