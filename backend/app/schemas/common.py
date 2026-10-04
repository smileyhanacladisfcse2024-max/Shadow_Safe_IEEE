"""Common shared schema types."""
from __future__ import annotations

from pydantic import BaseModel


class Segment(BaseModel):
    """A text segment with optional bold flag for rich text rendering without innerHTML."""
    t: str
    b: bool = False


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
