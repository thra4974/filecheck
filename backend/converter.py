import json
import io
import csv

import yaml
from ruamel.yaml import YAML
import tomlkit


# ── Helpers ───────────────────────────────────────────────────────────────────

def read_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


# ── Conversion matrix ─────────────────────────────────────────────────────────

# Defines which conversions are supported per source type
CONVERSION_MAP = {
    "json":     ["yaml", "toml", "csv"],
    "yaml":     ["json", "toml"],
    "toml":     ["json", "yaml"],
    "csv":      ["json"],
}


def get_supported_conversions(file_type: str) -> list:
    """Returns list of valid target formats for a given source type."""
    return CONVERSION_MAP.get(file_type, [])


# ── Individual converters ─────────────────────────────────────────────────────

def json_to_yaml(content: str) -> str:
    data = json.loads(content)
    ryaml = YAML()
    ryaml.default_flow_style = False
    stream = io.StringIO()
    ryaml.dump(data, stream)
    return stream.getvalue()


def json_to_toml(content: str) -> str:
    data = json.loads(content)
    return tomlkit.dumps(tomlkit.item(data))


def json_to_csv(content: str) -> str:
    data = json.loads(content)
    # Handle array of objects
    if isinstance(data, list) and all(isinstance(i, dict) for i in data):
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue()
    # Handle single object
    if isinstance(data, dict):
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data.keys())
        writer.writeheader()
        writer.writerow(data)
        return output.getvalue()
    raise ValueError(
        "JSON must be an array of objects or a single object to convert to CSV"
    )


def yaml_to_json(content: str) -> str:
    data = yaml.safe_load(content)
    return json.dumps(data, indent=2)


def yaml_to_toml(content: str) -> str:
    data = yaml.safe_load(content)
    return tomlkit.dumps(tomlkit.item(data))


def toml_to_json(content: str) -> str:
    data = tomlkit.parse(content)
    return json.dumps(data.unwrap(), indent=2)


def toml_to_yaml(content: str) -> str:
    data = tomlkit.parse(content).unwrap()
    ryaml = YAML()
    ryaml.default_flow_style = False
    stream = io.StringIO()
    ryaml.dump(data, stream)
    return stream.getvalue()


def csv_to_json(content: str) -> str:
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    return json.dumps(rows, indent=2)


# ── Converter router ──────────────────────────────────────────────────────────

CONVERTERS = {
    ("json",  "yaml"): json_to_yaml,
    ("json",  "toml"): json_to_toml,
    ("json",  "csv"):  json_to_csv,
    ("yaml",  "json"): yaml_to_json,
    ("yaml",  "toml"): yaml_to_toml,
    ("toml",  "json"): toml_to_json,
    ("toml",  "yaml"): toml_to_yaml,
    ("csv",   "json"): csv_to_json,
}


def convert(content: str, from_type: str, to_type: str) -> dict:
    """
    Convert file content from one format to another.

    Returns:
    {
        "success": bool,
        "output": str | None,
        "from_type": str,
        "to_type": str,
        "error": str | None
    }
    """
    if from_type == to_type:
        return {
            "success": False,
            "output": None,
            "from_type": from_type,
            "to_type": to_type,
            "error": "Source and target formats are the same",
        }

    converter_fn = CONVERTERS.get((from_type, to_type))

    if not converter_fn:
        return {
            "success": False,
            "output": None,
            "from_type": from_type,
            "to_type": to_type,
            "error": f"Conversion from {from_type} to {to_type} is not supported",
        }

    try:
        output = converter_fn(content)
        return {
            "success": True,
            "output": output,
            "from_type": from_type,
            "to_type": to_type,
            "error": None,
        }
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "from_type": from_type,
            "to_type": to_type,
            "error": str(e),
        }