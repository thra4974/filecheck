import json
import io
import os
import re
import ast
import subprocess
import requests

import yaml
from ruamel.yaml import YAML
import tomlkit
import xml.dom.minidom
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup


ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


# ── Helpers ───────────────────────────────────────────────────────────────────

def read_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def ai_fix(content: str, file_type: str, errors: list) -> dict:
    """
    Send broken file content to Claude API and ask it to fix it.
    Returns { fixed: str, method: "ai" } or raises on failure.
    """
    if not ANTHROPIC_API_KEY:
        return {"fixed": None, "method": None, "error": "No API key set"}

    error_summary = "\n".join(errors) if errors else "Unknown errors"

    prompt = f"""You are a file repair assistant. Fix the following broken {file_type.upper()} file.

ERRORS DETECTED:
{error_summary}

BROKEN FILE CONTENT:
```{file_type}
{content}
```

Rules:
- Return ONLY the fixed file content, nothing else
- No explanations, no markdown code fences, no preamble
- Fix all syntax errors
- Preserve the original structure and data as much as possible
- Format the output cleanly with consistent indentation
- Do not add or remove data fields unless necessary to fix the file"""

    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-6",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )

    if response.status_code != 200:
        error_detail = response.json().get("error", {}).get("message", "unknown")
        return {"fixed": None, "method": None, "error": f"API error {response.status_code}: {error_detail}"}

    data = response.json()
    fixed_content = data["content"][0]["text"].strip()

    # Strip accidental markdown fences if Claude added them
    if fixed_content.startswith("```"):
        lines = fixed_content.split("\n")
        fixed_content = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])

    return {"fixed": fixed_content, "method": "ai"}


# ── Rule-based fixers per type ─────────────────────────────────────────────

def fix_json(content: str) -> str | None:
    """Try increasingly aggressive JSON fixes."""
    # Attempt 1 — direct parse
    try:
        return json.dumps(json.loads(content), indent=2)
    except Exception:
        pass

    # Attempt 2 — strip trailing commas
    cleaned = re.sub(r",\s*([\]}])", r"\1", content)
    try:
        return json.dumps(json.loads(cleaned), indent=2)
    except Exception:
        pass

    # Attempt 3 — fix single quotes to double quotes
    cleaned = content.replace("'", '"')
    try:
        return json.dumps(json.loads(cleaned), indent=2)
    except Exception:
        pass

    # Attempt 4 — add missing commas between properties
    # Matches: "value" "key" or "value" { or } "key"
    cleaned = re.sub(r'("|\d|true|false|null)(\s*\n?\s*)(")', r'\1,\2\3', content)
    try:
        return json.dumps(json.loads(cleaned), indent=2)
    except Exception:
        pass

    # Attempt 5 — add missing commas + fix single quotes
    cleaned = re.sub(r'("|\d|true|false|null)(\s*\n?\s*)(")', r'\1,\2\3', content)
    cleaned = cleaned.replace("'", '"')
    try:
        return json.dumps(json.loads(cleaned), indent=2)
    except Exception:
        pass

    # Attempt 6 — remove JS-style comments
    cleaned = re.sub(r"//.*?\n", "\n", content)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)
    try:
        return json.dumps(json.loads(cleaned), indent=2)
    except Exception:
        pass

    return None


def fix_yaml(content: str) -> str | None:
    """Try multiple YAML fix strategies."""

    # Attempt 1 — maybe it parses fine as-is
    try:
        data = yaml.safe_load(content)
        if data is not None:
            ryaml = YAML()
            stream = io.StringIO()
            ryaml.dump(data, stream)
            return stream.getvalue()
    except Exception:
        pass

    # Attempt 2 — fix bad colons (bad:key:here → bad_key: here)
    lines = content.splitlines()
    fixed_lines = []
    for line in lines:
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        # Fix lines with multiple colons that aren't quoted or URL-like
        if stripped.count(":") > 1 and "://" not in stripped and '"' not in stripped:
            parts = stripped.split(":")
            # Keep first part as key, join rest as value
            fixed_line = " " * indent + parts[0] + ": " + ":".join(parts[1:]).strip()
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)
    cleaned = "\n".join(fixed_lines)
    try:
        data = yaml.safe_load(cleaned)
        if data is not None:
            ryaml = YAML()
            stream = io.StringIO()
            ryaml.dump(data, stream)
            return stream.getvalue()
    except Exception:
        pass

    # Attempt 3 — fix indentation by normalizing to 2 spaces
    fixed_lines = []
    for line in content.splitlines():
        stripped = line.lstrip()
        if not stripped:
            fixed_lines.append("")
            continue
        original_indent = len(line) - len(stripped)
        # Normalize odd indentation to nearest even number
        normalized_indent = (original_indent // 2) * 2
        fixed_lines.append(" " * normalized_indent + stripped)
    cleaned = "\n".join(fixed_lines)
    try:
        data = yaml.safe_load(cleaned)
        if data is not None:
            ryaml = YAML()
            stream = io.StringIO()
            ryaml.dump(data, stream)
            return stream.getvalue()
    except Exception:
        pass

    # Attempt 4 — strip lines that are clearly malformed (no key-value structure)
    fixed_lines = []
    for line in content.splitlines():
        stripped = line.strip()
        # Keep empty lines, comments, and valid-looking key:value lines
        if not stripped or stripped.startswith("#"):
            fixed_lines.append(line)
            continue
        # Keep lines that have at least one colon or start a list
        if ":" in stripped or stripped.startswith("-"):
            fixed_lines.append(line)
        # Skip lines that look completely malformed
    cleaned = "\n".join(fixed_lines)
    try:
        data = yaml.safe_load(cleaned)
        if data is not None:
            ryaml = YAML()
            stream = io.StringIO()
            ryaml.dump(data, stream)
            return stream.getvalue()
    except Exception:
        pass

    return None


def fix_xml(content: str) -> str | None:
    """Try BeautifulSoup's XML mode for lenient parsing."""
    try:
        soup = BeautifulSoup(content, "xml")
        return soup.prettify()
    except Exception:
        pass
    return None


def fix_html(content: str) -> str | None:
    """BeautifulSoup is very lenient with HTML."""
    try:
        soup = BeautifulSoup(content, "html.parser")
        return soup.prettify()
    except Exception:
        pass
    return None


def fix_csv(content: str) -> str | None:
    """
    Attempt to normalize CSV by detecting the most common column count
    and padding/trimming rows to match.
    """
    import csv, io as _io
    try:
        rows = list(csv.reader(_io.StringIO(content)))
        if not rows:
            return None

        # Use the most common row length as canonical
        lengths = [len(r) for r in rows]
        canonical = max(set(lengths), key=lengths.count)

        fixed_rows = []
        for row in rows:
            if len(row) < canonical:
                row += [""] * (canonical - len(row))
            elif len(row) > canonical:
                row = row[:canonical]
            fixed_rows.append(row)

        out = _io.StringIO()
        writer = csv.writer(out)
        writer.writerows(fixed_rows)
        return out.getvalue()
    except Exception:
        pass
    return None


def fix_toml(content: str) -> str | None:
    """TOML is strict — not much rule-based fixing possible."""
    try:
        return tomlkit.dumps(tomlkit.parse(content))
    except Exception:
        pass
    return None


def fix_env(content: str) -> str | None:
    """Strip invalid lines, normalize keys to UPPER_SNAKE_CASE."""
    clean = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            clean.append(line)
            continue
        if "=" in stripped:
            key, _, val = stripped.partition("=")
            clean.append(f"{key.strip().upper()}={val}")
    return "\n".join(clean)


RULE_FIXERS = {
    "json":     fix_json,
    "yaml":     fix_yaml,
    "xml":      fix_xml,
    "html":     fix_html,
    "csv":      fix_csv,
    "toml":     fix_toml,
    "env":      fix_env,
}


# ── Main fix function ──────────────────────────────────────────────────────

def fix_file(file_path: str, file_type: str, errors: list) -> dict:
    """
    Attempt to fix a file using rule-based logic first,
    then fall back to AI if rule-based fails.

    Returns:
    {
        "fixed": str | None,
        "method": "rule" | "ai" | None,
        "error": str | None
    }
    """
    content = read_file(file_path)

    # Layer 1 — rule-based fix
    rule_fixer = RULE_FIXERS.get(file_type)
    if rule_fixer:
        try:
            result = rule_fixer(content)
            if result:
                return {"fixed": result, "method": "rule", "error": None}
        except Exception:
            pass

    # Layer 2 — AI fix
    ai_result = ai_fix(content, file_type, errors)
    if ai_result.get("fixed"):
        return {"fixed": ai_result["fixed"], "method": "ai", "error": None}

    return {
        "fixed": None,
        "method": None,
        "error": ai_result.get("error", "Could not auto-fix this file")
    }