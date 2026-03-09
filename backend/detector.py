import os
import json
import magic

# Maps MIME types to our internal file type labels
MIME_TYPE_MAP = {
    "application/json":        "json",
    "text/x-python":           "python",
    "text/x-script.python":    "python",
    "text/yaml":               "yaml",
    "application/x-yaml":      "yaml",
    "text/xml":                "xml",
    "application/xml":         "xml",
    "text/csv":                "csv",
    "text/html":               "html",
    "text/x-sql":              "sql",
    "application/sql":         "sql",
    "text/x-shellscript":      "bash",
    "application/toml":        "toml",
    "text/x-toml":             "toml",
    "text/markdown":           "markdown",
    "text/x-markdown":         "markdown",
    "text/plain":              "plaintext",
}

# Maps file extensions as a reliable fallback
EXTENSION_MAP = {
    "json":       "json",
    "yaml":       "yaml",
    "yml":        "yaml",
    "py":         "python",
    "sql":        "sql",
    "xml":        "xml",
    "html":       "html",
    "htm":        "html",
    "csv":        "csv",
    "toml":       "toml",
    "md":         "markdown",
    "markdown":   "markdown",
    "sh":         "bash",
    "bash":       "bash",
    "txt":        "plaintext",
    "env":        "env",
    "dockerfile": "dockerfile",
}

# File types we currently support validation for
SUPPORTED_TYPES = {
    "json", "yaml", "python", "sql",
    "xml", "html", "csv", "toml",
    "markdown", "bash", "env", "dockerfile"
}


def get_extension(filename: str) -> str:
    """Extract the file extension from a filename."""
    _, ext = os.path.splitext(filename)
    return ext.lstrip(".").lower()


def detect_by_content(file_path: str) -> str | None:
    """
    Use python-magic to detect MIME type from file content (magic bytes).
    This catches files with wrong or missing extensions.
    """
    try:
        mime = magic.from_file(file_path, mime=True)
        return MIME_TYPE_MAP.get(mime)
    except Exception:
        return None


def detect_by_extension(filename: str) -> str | None:
    """Detect file type purely from the extension."""
    ext = get_extension(filename)
    return EXTENSION_MAP.get(ext)


def sniff_content(file_path: str) -> str | None:
    """
    Last resort — read the first few lines and make an educated guess.
    Useful for files with no extension and ambiguous MIME type.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            head = f.read(500).strip()

        if head.startswith("{") or head.startswith("["):
            # Could be JSON — try parsing it
            try:
                json.loads(head)
                return "json"
            except Exception:
                pass

        if head.startswith("---") or ": " in head[:100]:
            return "yaml"

        if head.startswith("<!DOCTYPE") or head.startswith("<html"):
            return "html"

        if head.startswith("<") and ">" in head:
            return "xml"

        if any(kw in head.upper() for kw in ["SELECT ", "INSERT ", "UPDATE ", "DELETE ", "CREATE "]):
            return "sql"

        if head.startswith("def ") or head.startswith("import ") or head.startswith("class "):
            return "python"

        if head.startswith("FROM ") or head.startswith("RUN ") or head.startswith("COPY "):
            return "dockerfile"

        if head.startswith("#!/bin/bash") or head.startswith("#!/bin/sh"):
            return "bash"

    except Exception:
        pass

    return None


def is_extension_mismatch(detected_type: str, filename: str) -> bool:
    """
    Checks if the file's actual content type doesn't match its extension.
    This is how we catch renamed or spoofed files.
    """
    ext_type = detect_by_extension(filename)
    if ext_type and detected_type and ext_type != detected_type:
        return True
    return False


def detect(file_path: str) -> dict:
    """
    Main detection function. Returns a full detection result dict.

    Priority order:
      1. Content-based detection — only if specific (not plaintext)
      2. Extension-based detection
      3. Content sniffing
      4. plaintext as last resort fallback
    """
    filename = os.path.basename(file_path)
    extension = get_extension(filename)

    # Run all three detection methods
    content_type   = detect_by_content(file_path)
    extension_type = detect_by_extension(filename)
    sniffed_type   = sniff_content(file_path)

    # If content detection returns something generic (plaintext),
    # don't let it override a more specific extension or sniff match
    is_generic = content_type in ("plaintext", None)

    if not is_generic:
        # Content detection was specific — trust it
        detected_type = content_type
    else:
        # Fall through to extension, then sniff, then plaintext
        detected_type = extension_type or sniffed_type or content_type or "unknown"

    # Only flag mismatch if content detection was specific
    mismatch = (
        is_extension_mismatch(detected_type, filename)
        if not is_generic
        else False
    )

    return {
        "filename":           filename,
        "extension":          extension or "none",
        "detected_type":      detected_type,
        "mime_detected":      content_type,
        "extension_match":    extension_type,
        "is_supported":       detected_type in SUPPORTED_TYPES,
        "extension_mismatch": mismatch,
    }