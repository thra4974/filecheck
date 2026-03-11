import re

# ── Secret patterns ───────────────────────────────────────────────────────────

PATTERNS = [
    {
        "name": "AWS Access Key",
        "regex": r"AKIA[0-9A-Z]{16}",
        "severity": "high",
    },
    {
        "name": "AWS Secret Key",
        "regex": r"(?i)(aws_secret_access_key|aws_secret)\s*[=:]\s*['\"]?[A-Za-z0-9/+=]{40}['\"]?",
        "severity": "high",
    },
    {
        "name": "OpenAI API Key",
        "regex": r"sk-[a-zA-Z0-9]{48}",
        "severity": "high",
    },
    {
        "name": "Anthropic API Key",
        "regex": r"sk-ant-[a-zA-Z0-9\-]{90,}",
        "severity": "high",
    },
    {
        "name": "GitHub Token",
        "regex": r"ghp_[a-zA-Z0-9]{36}",
        "severity": "high",
    },
    {
        "name": "GitHub OAuth Token",
        "regex": r"gho_[a-zA-Z0-9]{36}",
        "severity": "high",
    },
    {
        "name": "Stripe Live Key",
        "regex": r"sk_live_[0-9a-zA-Z]{24,}",
        "severity": "high",
    },
    {
        "name": "Stripe Test Key",
        "regex": r"sk_test_[0-9a-zA-Z]{24,}",
        "severity": "medium",
    },
    {
        "name": "Google API Key",
        "regex": r"AIza[0-9A-Za-z\-_]{35}",
        "severity": "high",
    },
    {
        "name": "Slack Token",
        "regex": r"xox[baprs]-[0-9a-zA-Z\-]{10,}",
        "severity": "high",
    },
    {
        "name": "Slack Webhook",
        "regex": r"https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9]+",
        "severity": "high",
    },
    {
        "name": "Twilio API Key",
        "regex": r"SK[0-9a-fA-F]{32}",
        "severity": "high",
    },
    {
        "name": "SendGrid API Key",
        "regex": r"SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}",
        "severity": "high",
    },
    {
        "name": "Private RSA Key",
        "regex": r"-----BEGIN RSA PRIVATE KEY-----",
        "severity": "critical",
    },
    {
        "name": "Private SSH Key",
        "regex": r"-----BEGIN OPENSSH PRIVATE KEY-----",
        "severity": "critical",
    },
    {
        "name": "Private EC Key",
        "regex": r"-----BEGIN EC PRIVATE KEY-----",
        "severity": "critical",
    },
    {
        "name": "PGP Private Key",
        "regex": r"-----BEGIN PGP PRIVATE KEY BLOCK-----",
        "severity": "critical",
    },
    {
        "name": "Database URL",
        "regex": r"(?i)(postgres|postgresql|mysql|mongodb|redis|sqlite):\/\/[^:]+:[^@]+@[^\s\"']+",
        "severity": "high",
    },
    {
        "name": "Basic Auth in URL",
        "regex": r"https?:\/\/[^:]+:[^@\s]+@[^\s\"']+",
        "severity": "high",
    },
    {
        "name": "JWT Token",
        "regex": r"eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+",
        "severity": "medium",
    },
    {
        "name": "Generic Secret Assignment",
        "regex": r"(?i)(secret|password|passwd|api_key|apikey|api_secret|access_token|auth_token|private_key)\s*[=:]\s*['\"][a-zA-Z0-9\-_/+=@!#$%^&*]{8,}['\"]",
        "severity": "medium",
    },
    {
        "name": "Generic Bearer Token",
        "regex": r"(?i)bearer\s+[a-zA-Z0-9\-_\.=]{20,}",
        "severity": "medium",
    },
    {
        "name": "Hardcoded IP with Credentials",
        "regex": r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:[0-9]+\/[^\s\"']{5,}",
        "severity": "low",
    },
]

# Lines containing these are likely safe — skip them
SAFE_PATTERNS = [
    r"(?i)example",
    r"(?i)placeholder",
    r"(?i)your[_\-]?api[_\-]?key",
    r"(?i)your[_\-]?secret",
    r"(?i)insert[_\-]?here",
    r"(?i)replace[_\-]?me",
    r"(?i)<[a-z_]+>",        # <your_key_here> style
    r"(?i)xxxx",
    r"(?i)1234567890",
    r"(?i)test_key",
    r"(?i)dummy",
    r"(?i)fake",
    r"#.*",                  # comment lines (checked separately)
]


def is_safe_line(line: str) -> bool:
    """Returns True if the line looks like a placeholder or comment."""
    stripped = line.strip()
    if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("*"):
        return True
    for pattern in SAFE_PATTERNS:
        if re.search(pattern, line):
            return True
    return False


def scan_content(content: str) -> dict:
    """
    Scan file content for secrets.

    Returns:
    {
        "clean": bool,
        "findings": [
            {
                "line": int,
                "name": str,
                "severity": str,
                "preview": str   # redacted preview of the line
            }
        ]
    }
    """
    findings = []
    lines = content.splitlines()

    for line_num, line in enumerate(lines, start=1):
        # Skip obvious safe lines
        if is_safe_line(line):
            continue

        for pattern in PATTERNS:
            if re.search(pattern["regex"], line):
                # Redact the actual secret value for display
                preview = redact_line(line.strip(), pattern["regex"])
                findings.append({
                    "line": line_num,
                    "name": pattern["name"],
                    "severity": pattern["severity"],
                    "preview": preview[:120],  # cap length
                })
                break  # one finding per line max

    return {
        "clean": len(findings) == 0,
        "findings": findings,
    }


def redact_line(line: str, pattern_regex: str) -> str:
    """Replace the matched secret value with [REDACTED]."""
    try:
        return re.sub(pattern_regex, "[REDACTED]", line)
    except Exception:
        return line[:60] + "..." if len(line) > 60 else line


def scan_file(file_path: str) -> dict:
    """Read a file and scan it for secrets."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return scan_content(content)
    except Exception as e:
        return {"clean": True, "findings": [], "error": str(e)}