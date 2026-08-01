#!/usr/bin/env python3
"""Build no-label floor-plan backgrounds for the interactive room overlay.

The source PDFs contain outlined glyphs, so PDF text extraction cannot remove
their labels. The 8-building plans use a distinct gray stroke for architecture,
which can be retained exactly. The international-dorm exports use black for
both labels and architecture, so their main connected plan is isolated and the
room-label bands are cleared using the calibrated rectangles in
``src/lib/planOverlayData.ts``.

The script extracts only the required PDFs from the source archives, writes the
final assets, and removes its temporary extraction directory automatically::

    python scripts/clean-plan-backgrounds.py
    python scripts/clean-plan-backgrounds.py --inter-only C1 D1
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

import cv2
import fitz
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
TEMP_SOURCE_ROOT = ROOT / "tmp" / "pdfs" / "clean-plan-sources"
EIGHT_SOURCE = TEMP_SOURCE_ROOT / "8lang"
INTER_SOURCE = TEMP_SOURCE_ROOT / "inter"
EIGHT_ARCHIVE = ROOT / "reference" / "plans" / "แปลนผัง8 หลัง.rar"
INTER_ARCHIVE = ROOT / "reference" / "plans" / "ผังหออินเตอร์.rar"
OVERLAY_DATA = ROOT / "src" / "lib" / "planOverlayData.ts"
EIGHT_OUTPUT = ROOT / "public" / "plans" / "overlay" / "8lang"
INTER_OUTPUT = ROOT / "public" / "plans" / "overlay" / "inter"

EIGHT_PLANS = ("102", "103", "104", "201", "202", "203", "204")
INTER_PLANS = (
    *tuple(f"{building}{floor}" for building in ("A", "B") for floor in range(1, 8)),
    "C1",
    "D1",
)

ROOM_RE = re.compile(
    r"\{ number: '([^']+)', x: (\d+), y: (\d+), w: (\d+), h: (\d+) \}",
)


def seven_zip_executable() -> Path:
    discovered = shutil.which("7z") or shutil.which("7z.exe")
    candidates = [
        Path(discovered) if discovered else None,
        Path(r"C:\Program Files\7-Zip\7z.exe"),
    ]
    for candidate in candidates:
        if candidate is not None and candidate.exists():
            return candidate
    raise FileNotFoundError("7-Zip is required to extract the source PDF archives")


def extract_source_plans(
    eight_plans: tuple[str, ...],
    inter_plans: tuple[str, ...],
) -> None:
    extractor = seven_zip_executable()
    jobs = (
        (EIGHT_ARCHIVE, EIGHT_SOURCE, eight_plans),
        (INTER_ARCHIVE, INTER_SOURCE, inter_plans),
    )
    for archive, destination, plans in jobs:
        if not plans:
            continue
        if not archive.exists():
            raise FileNotFoundError(f"Missing source archive: {archive}")
        destination.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                str(extractor),
                "x",
                "-y",
                f"-o{destination}",
                str(archive),
                *(f"{plan}.pdf" for plan in plans),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )


def remove_temporary_sources() -> None:
    shutil.rmtree(TEMP_SOURCE_ROOT, ignore_errors=True)
    # Remove only empty parents created by this script. Existing temp content
    # owned by another task is left untouched.
    for parent in (TEMP_SOURCE_ROOT.parent, TEMP_SOURCE_ROOT.parent.parent):
        try:
            parent.rmdir()
        except OSError:
            pass


def overlay_rooms(source: str, key: str) -> list[tuple[str, int, int, int, int]]:
    marker = f"'{key}'"
    start = source.index(marker)
    next_entry = source.find("\n '", start + len(marker))
    chunk = source[start : next_entry if next_entry != -1 else len(source)]
    return [
        (number, int(x), int(y), int(width), int(height))
        for number, x, y, width, height in ROOM_RE.findall(chunk)
    ]


def is_definition(element: ET.Element, parent_map: dict[ET.Element, ET.Element]) -> bool:
    current = parent_map.get(element)
    while current is not None:
        tag = current.tag.rsplit("}", 1)[-1]
        if tag in {"defs", "clipPath"}:
            return True
        current = parent_map.get(current)
    return False


def clean_eight_building_plan(plan: str) -> None:
    source_path = EIGHT_SOURCE / f"{plan}.pdf"
    destination = EIGHT_OUTPUT / f"{plan}.png"
    if not source_path.exists():
        raise FileNotFoundError(f"Missing extracted source PDF: {source_path}")

    with fitz.open(source_path) as document:
        svg_root = ET.fromstring(document[0].get_svg_image(text_as_path=True))

    parent_map = {child: parent for parent in svg_root.iter() for child in parent}
    for element in list(svg_root.iter()):
        if element.tag.rsplit("}", 1)[-1] != "path" or is_definition(element, parent_map):
            continue
        # Architectural linework is the only #666666 stroke in these PDFs.
        # Black paths are outlined room labels, titles, and annotations.
        if element.attrib.get("stroke") != "#666666":
            parent = parent_map.get(element)
            if parent is not None:
                parent.remove(element)

    clean_svg = ET.tostring(svg_root, encoding="utf-8", xml_declaration=True)
    with fitz.open(stream=clean_svg, filetype="svg") as svg_document:
        pixmap = svg_document[0].get_pixmap(
            matrix=fitz.Matrix(2, 2),
            colorspace=fitz.csGRAY,
            alpha=False,
        )
        pixmap.save(destination)


def clean_international_plan(plan: str, overlay_source: str) -> None:
    source_path = INTER_SOURCE / f"{plan}.pdf"
    destination = INTER_OUTPUT / f"{plan}.png"
    if not source_path.exists():
        raise FileNotFoundError(f"Missing extracted source PDF: {source_path}")
    with fitz.open(source_path) as document:
        pixmap = document[0].get_pixmap(
            matrix=fitz.Matrix(2, 2),
            colorspace=fitz.csGRAY,
            alpha=False,
        )
        gray = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
            pixmap.height,
            pixmap.width,
        )

    # The building linework is one connected component. Detached title,
    # key-plan, dimensions, and outlined labels are intentionally discarded.
    dark_core = (gray < 180).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(dark_core, 8)
    if count <= 1:
        raise RuntimeError(f"Could not identify plan linework in {source_path}")
    largest_label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    plan_mask = (labels == largest_label).astype(np.uint8)

    key = f"dorm-wor-inter:{plan[0]}:{plan[1:]}"
    rooms = overlay_rooms(overlay_source, key)
    if not rooms:
        raise RuntimeError(f"No calibrated room rectangles found for {key}")

    # Remove the two-line original room label while preserving the perimeter,
    # bathroom fixtures, and door swing near each room edge.
    for _, x, y, width, height in rooms:
        x1 = x + 5
        x2 = x + width - 5
        y1 = round(y + height * 0.18)
        y2 = round(y + height * 0.82)
        plan_mask[y1:y2, x1:x2] = 0

    # Restore the antialiased edge pixels around the retained CAD linework.
    plan_mask = cv2.dilate(plan_mask, np.ones((3, 3), np.uint8), iterations=1)
    cleaned = np.full_like(gray, 255)
    keep = (plan_mask > 0) & (gray < 254)
    cleaned[keep] = gray[keep]
    encoded_ok, encoded_png = cv2.imencode(
        ".png",
        cleaned,
        [cv2.IMWRITE_PNG_COMPRESSION, 9],
    )
    if not encoded_ok:
        raise RuntimeError(f"Could not write {destination}")
    encoded_png.tofile(destination)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inter-only",
        nargs="+",
        choices=INTER_PLANS,
        metavar="PLAN",
        help="สร้างเฉพาะผังวรอินเตอร์ที่ระบุ เช่น C1 D1",
    )
    args = parser.parse_args()
    eight_plans: tuple[str, ...] = () if args.inter_only else EIGHT_PLANS
    inter_plans: tuple[str, ...] = tuple(args.inter_only) if args.inter_only else INTER_PLANS

    EIGHT_OUTPUT.mkdir(parents=True, exist_ok=True)
    INTER_OUTPUT.mkdir(parents=True, exist_ok=True)
    overlay_source = OVERLAY_DATA.read_text(encoding="utf-8")

    remove_temporary_sources()
    try:
        extract_source_plans(eight_plans, inter_plans)
        for plan in eight_plans:
            clean_eight_building_plan(plan)
        for plan in inter_plans:
            clean_international_plan(plan, overlay_source)
    finally:
        remove_temporary_sources()

    print(f"Generated {len(eight_plans) + len(inter_plans)} cleaned plan backgrounds")


if __name__ == "__main__":
    main()
