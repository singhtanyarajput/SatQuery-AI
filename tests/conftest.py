"""Global test configuration and fixtures for SatQuery AI.

Mocks heavy multi-billion-parameter neural network inference during standard
unit test runs while allowing explicit live model and integration testing.
"""

from __future__ import annotations

from typing import Any
import pytest

from app.services.models.base import VLMResult


@pytest.fixture(autouse=True)
def mock_vlm_for_unit_tests(monkeypatch: pytest.MonkeyPatch, request: pytest.FixtureRequest) -> None:
    """Mocks LocalVisionLanguageClient.generate for fast, deterministic unit test runs."""
    # Allow tests that specifically probe the client methods to run unmocked
    if (
        "live_model" in request.keywords
        or "test_vlm_client_candidate_endpoints" in request.node.nodeid
        or "test_ollama_payload" in request.node.nodeid
    ):
        return

    def _mock_generate(
        self: Any,
        prompt: str,
        image_path: Any = None,
        images: Any = None,
        extra_context: Any = None,
        **kwargs: Any,
    ) -> VLMResult:
        ctx = dict(extra_context or {})
        return VLMResult(
            text=f"Satellite observation analysis: '{prompt.strip()[:80]}'. The Sentinel-1 SAR constellation confirms stable surface features.",
            confidence=0.92,
            params={"backend": "ollama", "model": "llava", "mocked": True, **ctx},
        )

    monkeypatch.setattr("app.services.models.base.LocalVisionLanguageClient.generate", _mock_generate)
