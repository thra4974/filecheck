import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from detector import detect
from validators import validate
from fixer import fix_file
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from scanner import scan_file, scan_content

app = FastAPI(title="FileCheck API", version="1.0.0")

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://filelint.vercel.app",
        "https://filelint.com",
        "https://www.filelint.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Temp folder for uploaded files
UPLOAD_DIR = "/tmp/filecheck_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/validate")
async def validate_file(file: UploadFile = File(...)):
    # Give the file a unique name to avoid collisions
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, unique_name)

    try:
        # Save uploaded file to temp location
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run detection
        detection = detect(temp_path)

        # Override filename in detection result to use original name
        detection["filename"] = file.filename

        # Run validation
        validation = validate(temp_path, detection["detected_type"])

        return JSONResponse({
            "detection": detection,
            "validation": {
                "valid":     validation["valid"],
                "errors":    validation["errors"],
                "formatted": validation["formatted"],
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
@app.post("/fix")
async def fix_file_endpoint(file: UploadFile = File(...)):
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, unique_name)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        detection = detect(temp_path)
        detection["filename"] = file.filename
        validation = validate(temp_path, detection["detected_type"])
        fix_result = fix_file(temp_path, detection["detected_type"], validation["errors"])

        # Run secrets scan
        scan_result = scan_file(temp_path)

        return JSONResponse({
            "detection": detection,
            "validation": {
                "valid": validation["valid"],
                "errors": validation["errors"],
                "formatted": validation["formatted"],
            },
            "fix": {
                "fixed": fix_result["fixed"],
                "method": fix_result["method"],
                "error": fix_result["error"],
            },
            "scan": scan_result,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/validate-text")
async def validate_text(request: Request):
    body = await request.json()
    content = body.get("content", "")
    file_type = body.get("file_type", "auto")

    if not content.strip():
        return JSONResponse({
            "detection": {"detected_type": file_type, "is_supported": True, "extension_mismatch": False},
            "validation": {"valid": False, "errors": ["No content provided"], "formatted": None},
            "fix": {"fixed": None, "method": None, "error": None}
        })

    # Write content to a temp file so we can reuse existing logic
    suffix = f".{file_type}" if file_type != "auto" else ".txt"
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(content)
        temp_path = f.name

    try:
        # Detect type
        detection = detect(temp_path)

        # If user specified a type manually, use that instead
        if file_type != "auto":
            detection["detected_type"] = file_type
            detection["is_supported"] = file_type in [
                "json", "yaml", "python", "xml", "html",
                "csv", "toml", "sql", "markdown", "env"
            ]

        detection["filename"] = f"pasted.{detection['detected_type']}"

        # Validate
        validation = validate(temp_path, detection["detected_type"])

        # Fix if needed
        fix_result = fix_file(temp_path, detection["detected_type"], validation["errors"])

        return JSONResponse({
            "detection": detection,
            "validation": {
                "valid": validation["valid"],
                "errors": validation["errors"],
                "formatted": validation["formatted"],
        },
        "fix": {
            "fixed": fix_result["fixed"],
            "method": fix_result["method"],
            "error": fix_result["error"],
        },
        "scan": scan_result,
        })

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)