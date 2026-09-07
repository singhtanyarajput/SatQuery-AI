"""Tests for multimodal image handling in backend API, Ollama client, and trace schema."""

from __future__ import annotations

import asyncio
import io
import struct
import zlib
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import UploadFile

from app.schemas.trace import AuditableTraceLogSchema, InputMetadataSchema, RegistryExecutionSchema
from app.services.models.base import LocalVisionLanguageClient, VLMResult


def _generate_test_png(width: int = 32, height: int = 32) -> bytes:
    """Generate a valid minimal PNG in memory."""
    raw = bytearray()
    for _ in range(height):
        raw.append(0)  # filter type 0
        raw.extend([100, 150, 200] * width)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)

    def _chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", ihdr)
        + _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + _chunk(b"IEND", b"")
    )


def test_ollama_payload_includes_images_base64(monkeypatch):
    """Verify that LocalVisionLanguageClient packages base64 images into the Ollama payload."""
    client = LocalVisionLanguageClient()

    posted_payloads: list[dict] = []

    def mock_http_post(url: str, body: dict, **kwargs):
        posted_payloads.append(body)
        return {"response": "Detected agricultural fields and sparse vegetation."}

    monkeypatch.setattr("app.services.models.base._http_post_json", mock_http_post)

    png_bytes = _generate_test_png(16, 16)
    result = client.generate(
        prompt="Analyze surface features in this scene",
        images=[png_bytes],
        extra_context={"task": "single_vqa"},
    )

    assert result.text == "Detected agricultural fields and sparse vegetation."
    assert len(posted_payloads) > 0
    payload = posted_payloads[0]
    assert "images" in payload
    assert len(payload["images"]) == 1
    # Check that image is a non-empty base64 string
    assert len(payload["images"][0]) > 50
    assert payload["prompt"].endswith("Analyze surface features in this scene")


def test_query_pipeline_with_image_upload_modalities(tmp_path: Path, monkeypatch):
    """Verify that uploading an image via files=@... sets modalities to Vision/Image-Text, NOT Text-Only."""
    import backend.api.routes as routes_mod

    monkeypatch.setattr(routes_mod.settings, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(routes_mod.settings, "ARTIFACT_DIR", tmp_path / "artifacts")
    (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
    (tmp_path / "artifacts").mkdir(parents=True, exist_ok=True)

    png_data = _generate_test_png(32, 32)
    upload = UploadFile(filename="satellite_test.png", file=io.BytesIO(png_data))

    # Mock VLM generation to return deterministic answer
    monkeypatch.setattr(
        "app.services.models.base.LocalVisionLanguageClient.generate",
        lambda self, prompt, **kwargs: VLMResult(
            text="Visual analysis confirms urban residential layout with road networks.",
            confidence=0.91,
            params={"backend": "ollama", "model": "llava", "images_count": 1},
        ),
    )

    async def _run():
        return await routes_mod.query_pipeline(
            query="What infrastructure is visible in this satellite imagery?",
            files=[upload],
            db=None,
        )

    envelope = asyncio.run(_run())
    resp = envelope.model_dump()
    assert resp["status"] == "ok"
    assert resp["task_type"] in ["single_vqa", "single_grounding"]

    # Crucial assertion: input metadata modalities MUST NOT be ["Text-Only"]
    meta = resp["trace"]["input_metadata"]
    assert meta["modalities"] != ["Text-Only"]
    assert any(m in meta["modalities"] for m in ["Vision", "Image-Text", "RGB"])


def test_query_pipeline_zero_files_modalities(tmp_path: Path, monkeypatch):
    """Verify that queries with zero files attached are correctly categorized as domain QA with Text-Only."""
    import backend.api.routes as routes_mod

    monkeypatch.setattr(routes_mod.settings, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(routes_mod.settings, "ARTIFACT_DIR", tmp_path / "artifacts")
    (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
    (tmp_path / "artifacts").mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(
        "app.services.models.base.LocalVisionLanguageClient.generate",
        lambda self, prompt, **kwargs: VLMResult(
            text="Cartosat-2S provides panchromatic and multispectral optical imaging capabilities.",
            confidence=0.95,
            params={"backend": "ollama", "model": "llava"},
        ),
    )

    async def _run():
        return await routes_mod.query_pipeline(
            query="Explain the primary payload of Cartosat-2S satellite",
            files=[],
            db=None,
        )

    envelope = asyncio.run(_run())
    resp = envelope.model_dump()
    assert resp["status"] == "ok"
    assert resp["task_type"] == "domain_knowledge_qa"
    meta = resp["trace"]["input_metadata"]
    assert meta["modalities"] == ["Text-Only"]


def test_query_pipeline_individual_file_upload(tmp_path: Path, monkeypatch):
    """Verify that uploading via individual file parameter correctly detects multimodal vision input."""
    import backend.api.routes as routes_mod

    monkeypatch.setattr(routes_mod.settings, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(routes_mod.settings, "ARTIFACT_DIR", tmp_path / "artifacts")
    (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
    (tmp_path / "artifacts").mkdir(parents=True, exist_ok=True)

    png_data = _generate_test_png(32, 32)
    upload = UploadFile(filename="scene.png", file=io.BytesIO(png_data))

    monkeypatch.setattr(
        "app.services.models.base.LocalVisionLanguageClient.generate",
        lambda self, prompt, **kwargs: VLMResult(
            text="Detected harbor and maritime structures.",
            confidence=0.89,
            params={"backend": "ollama", "model": "llava"},
        ),
    )

    async def _run():
        return await routes_mod.query_pipeline(
            query="Detect maritime facilities",
            files=[],
            file=upload,
            db=None,
        )

    envelope = asyncio.run(_run())
    resp = envelope.model_dump()
    assert resp["status"] == "ok"
    meta = resp["trace"]["input_metadata"]
    assert meta["modalities"] != ["Text-Only"]


def test_starlette_uploadfile_preserves_modalities(tmp_path: Path, monkeypatch):
    """Verify that starlette.datastructures.UploadFile (from curl multipart parser) is preserved."""
    import backend.api.routes as routes_mod
    from starlette.datastructures import UploadFile as StarletteUploadFile

    monkeypatch.setattr(routes_mod.settings, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(routes_mod.settings, "ARTIFACT_DIR", tmp_path / "artifacts")
    (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
    (tmp_path / "artifacts").mkdir(parents=True, exist_ok=True)

    png_data = _generate_test_png(32, 32)
    # Instantiate Starlette UploadFile directly as created by Starlette form parser
    upload = StarletteUploadFile(filename="curl_upload.png", file=io.BytesIO(png_data))

    passed_image_path = []

    def mock_gen(self, prompt, **kwargs):
        passed_image_path.append(kwargs.get("image_path"))
        return VLMResult(
            text="Visual analysis shows infrastructure elements.",
            confidence=0.91,
            params={"backend": "ollama", "model": "llava"},
        )

    monkeypatch.setattr("app.services.models.base.LocalVisionLanguageClient.generate", mock_gen)

    async def _run():
        return await routes_mod.query_pipeline(
            query="Analyze this satellite scene and describe visual features",
            files=[upload],
            db=None,
        )

    envelope = asyncio.run(_run())
    resp = envelope.model_dump()
    assert resp["status"] == "ok"
    assert resp["task_type"] == "single_vqa"

    # Input metadata modalities check
    meta = resp["trace"]["input_metadata"]
    assert meta["modalities"] != ["Text-Only"]
    assert "Image-Text" in meta["modalities"]

    # Audit summary modalities check
    audit = resp["audit_summary"]
    assert audit["modalities"] != ["Text-Only"]
    assert "Image-Text" in audit["modalities"]

    # Verify image path was passed to VLM execution
    assert len(passed_image_path) == 1
    assert passed_image_path[0] is not None


