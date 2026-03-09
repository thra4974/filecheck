import json
import ast
import csv
import io
import subprocess
import xml.etree.ElementTree as ET

import yaml
from ruamel.yaml import YAML
from bs4 import BeautifulSoup
import tomlkit


# ── Helpers ──────────────────────────────────────────────────────────────────

def read_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def success(formatted: str = None) -> dict:
    return {"valid": True, "errors": [], "formatted": formatted}

def failure(errors: list, formatted: str = None) -> dict:
    return {"valid": False, "errors": errors, "formatted": formatted}


# ── JSON ─────────────────────────────────────────────────────────────────────

def validate_json(file_path: str) -> dict:
    content = read_file(file_path)
    try:
        parsed = json.loads(content)
        formatted = json.dumps(parsed, indent=2)
        return success(formatted)
    except json.JSONDecodeError as e:
        return failure([f"Line {e.lineno}: {e.msg}"])


# ── YAML ─────────────────────────────────────────────────────────────────────

def validate_yaml(file_path: str) -> dict:
    content = read_file(file_path)
    errors = []

    try:
        # First pass — basic syntax check
        yaml.safe_load(content)
    except yaml.YAMLError as e:
        if hasattr(e, "problem_mark"):
            mark = e.problem_mark
            errors.append(f"Line {mark.line + 1}: {e.problem}")
        else:
            errors.append(str(e))
        return failure(errors)

    # Second pass — reformat cleanly with ruamel
    try:
        ryaml = YAML()
        ryaml.preserve_quotes = True
        stream = io.StringIO()
        ryaml.dump(yaml.safe_load(content), stream)
        formatted = stream.getvalue()
        return success(formatted)
    except Exception as e:
        # Valid but couldn't reformat — still a pass
        return success(content)


# ── Python ───────────────────────────────────────────────────────────────────

def validate_python(file_path: str) -> dict:
    content = read_file(file_path)
    errors = []

    # Syntax check via AST
    try:
        ast.parse(content)
    except SyntaxError as e:
        errors.append(f"Line {e.lineno}: {e.msg}")
        return failure(errors)

    # Auto-format with black
    try:
        result = subprocess.run(
            ["black", "--quiet", "--code", content],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return success(result.stdout)
        else:
            # Black failed but syntax was fine — return original
            return success(content)
    except FileNotFoundError:
        # Black not installed — return original
        return success(content)


# ── XML ──────────────────────────────────────────────────────────────────────

def validate_xml(file_path: str) -> dict:
    content = read_file(file_path)
    try:
        ET.fromstring(content)
        # Pretty print manually
        import xml.dom.minidom
        dom = xml.dom.minidom.parseString(content)
        formatted = dom.toprettyxml(indent="  ")
        # Remove the extra XML declaration minidom adds if original didn't have one
        lines = formatted.split("\n")
        if not content.strip().startswith("<?xml"):
            lines = lines[1:]
        formatted = "\n".join(lines).strip()
        return success(formatted)
    except ET.ParseError as e:
        return failure([str(e)])


# ── HTML ─────────────────────────────────────────────────────────────────────

def validate_html(file_path: str) -> dict:
    content = read_file(file_path)
    try:
        soup = BeautifulSoup(content, "html.parser")
        formatted = soup.prettify()
        return success(formatted)
    except Exception as e:
        return failure([str(e)])


# ── CSV ──────────────────────────────────────────────────────────────────────

def validate_csv(file_path: str) -> dict:
    content = read_file(file_path)
    errors = []

    try:
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)

        if not rows:
            return failure(["File is empty"])

        # Check for inconsistent column counts
        expected_cols = len(rows[0])
        for i, row in enumerate(rows[1:], start=2):
            if len(row) != expected_cols:
                errors.append(
                    f"Line {i}: expected {expected_cols} columns, got {len(row)}"
                )

        if errors:
            return failure(errors)

        # Reformat cleanly
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(rows)
        return success(output.getvalue())

    except csv.Error as e:
        return failure([str(e)])


# ── TOML ─────────────────────────────────────────────────────────────────────

def validate_toml(file_path: str) -> dict:
    content = read_file(file_path)
    try:
        parsed = tomlkit.parse(content)
        formatted = tomlkit.dumps(parsed)
        return success(formatted)
    except Exception as e:
        return failure([str(e)])


# ── SQL ──────────────────────────────────────────────────────────────────────

def validate_sql(file_path: str) -> dict:
    content = read_file(file_path)
    try:
        result = subprocess.run(
            ["sqlfluff", "fix", "--dialect", "ansi", "-"],
            input=content,
            capture_output=True,
            text=True
        )
        # sqlfluff returns formatted SQL on stdout
        formatted = result.stdout.strip() if result.stdout.strip() else content
        
        # Check for lint errors
        lint_result = subprocess.run(
            ["sqlfluff", "lint", "--dialect", "ansi", "--format", "json", "-"],
            input=content,
            capture_output=True,
            text=True
        )
        errors = []
        if lint_result.stdout:
            try:
                lint_output = json.loads(lint_result.stdout)
                for file_result in lint_output:
                    for violation in file_result.get("violations", []):
                        errors.append(
                            f"Line {violation['line_no']}: {violation['description']}"
                        )
            except Exception:
                pass

        if errors:
            return failure(errors, formatted)
        return success(formatted)

    except FileNotFoundError:
        return failure(["sqlfluff not installed — run: pip install sqlfluff"])


# ── Markdown ─────────────────────────────────────────────────────────────────

def validate_markdown(file_path: str) -> dict:
    """
    Markdown has no strict syntax — we just check it's readable
    and return it cleaned up (normalized line endings, trimmed whitespace).
    """
    content = read_file(file_path)
    try:
        # Normalize line endings and strip trailing whitespace per line
        lines = content.splitlines()
        cleaned = "\n".join(line.rstrip() for line in lines).strip()
        return success(cleaned)
    except Exception as e:
        return failure([str(e)])


# ── ENV ──────────────────────────────────────────────────────────────────────

def validate_env(file_path: str) -> dict:
    content = read_file(file_path)
    errors = []
    clean_lines = []

    for i, line in enumerate(content.splitlines(), start=1):
        stripped = line.strip()

        # Skip empty lines and comments
        if not stripped or stripped.startswith("#"):
            clean_lines.append(line)
            continue

        # Every non-comment line must be KEY=VALUE
        if "=" not in stripped:
            errors.append(f"Line {i}: missing '=' in '{stripped}'")
            continue

        key, _, value = stripped.partition("=")
        key = key.strip()

        # Keys should be uppercase alphanumeric + underscore
        if not key.replace("_", "").isalnum():
            errors.append(f"Line {i}: invalid key '{key}' — use UPPER_SNAKE_CASE")
        elif not key[0].isalpha() and key[0] != "_":
            errors.append(f"Line {i}: key '{key}' must start with a letter or underscore")
        else:
            clean_lines.append(f"{key.upper()}={value}")

    if errors:
        return failure(errors, "\n".join(clean_lines))
    return success("\n".join(clean_lines))


# ── Router ───────────────────────────────────────────────────────────────────

VALIDATOR_MAP = {
    "json":     validate_json,
    "yaml":     validate_yaml,
    "python":   validate_python,
    "xml":      validate_xml,
    "html":     validate_html,
    "csv":      validate_csv,
    "toml":     validate_toml,
    "sql":      validate_sql,
    "markdown": validate_markdown,
    "env":      validate_env,
}


def validate(file_path: str, file_type: str) -> dict:
    """
    Main validation router.
    Takes a file path and detected type, returns validation result.
    """
    validator = VALIDATOR_MAP.get(file_type)

    if not validator:
        return {
            "valid": False,
            "errors": [f"No validator available for type: {file_type}"],
            "formatted": None
        }

    return validator(file_path)