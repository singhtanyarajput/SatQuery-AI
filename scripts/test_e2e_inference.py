#!/usr/bin/env python3
"""Bypass the UI: POST a dummy image + NL query to /api/v1/query and print JSON.

Starts no server. Expects the FastAPI gateway at http://localhost:8000.

    python scripts/test_e2e_inference.py
    python scripts/test_e2e_inference.py --url http://127.0.0.1:8000 --query "Where is the reservoir"
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_dummy_png(path: Path, size: int = 16) -> None:
    """Tiny RGB PNG so the client does not depend on rasterio or the UI."""
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            row.extend((32 + (x * 8) % 200, 96, 32 + (y * 8) % 200))
        rows.append(bytes(row))
    raw = b"".join(b"\x00" + row for row in rows)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", zlib.compress(raw, 9))
        + _png_chunk(b"IEND", b"")
    )
    path.write_bytes(payload)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SatQuery AI e2e inference probe")
    parser.add_argument("--url", default="http://localhost:8000", help="API origin")
    parser.add_argument(
        "--query",
        default="Highlight industrial rooftops in this scene",
        help="Natural-language EO query",
    )
    parser.add_argument(
        "--image",
        type=Path,
        default=None,
        help="Optional existing image/GeoTIFF (otherwise a dummy PNG is generated)",
    )
    args = parser.parse_args(argv)

    try:
        import requests
    except ImportError:
        print("This script requires the requests package. Install with: pip install requests", file=sys.stderr)
        return 2

    image_path = args.image
    if image_path is None:
        image_path = ROOT / "artifacts" / "e2e" / "dummy_scene.png"
        write_dummy_png(image_path)
    if not image_path.exists():
        print(f"image not found: {image_path}", file=sys.stderr)
        return 2

    endpoint = args.url.rstrip("/") + "/api/v1/query"
    mime = "image/png" if image_path.suffix.lower() == ".png" else "application/octet-stream"
    print(f"POST {endpoint}")
    print(f"image={image_path} query={args.query!r}")

    with image_path.open("rb") as handle:
        response = requests.post(
            endpoint,
            data={"query": args.query},
            files={"files": (image_path.name, handle, mime)},
            timeout=180,
        )

    print(f"status={response.status_code}")
    try:
        payload = response.json()
    except ValueError:
        print(response.text)
        return 1
    print(json.dumps(payload, indent=2, default=str))

    if response.status_code != 200:
        return 1
    missing = [key for key in ("answer", "audit_summary", "bbox", "geojson", "change_mask") if key not in payload]
    if missing:
        print(f"response missing keys: {missing}", file=sys.stderr)
        return 1
    print("e2e_ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
