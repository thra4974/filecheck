import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from detector import detect
from validators import validate
from fixer import fix_file

app = FastAPI(title="FileCheck API", version="1.0.0")

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
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

        # Detect + validate first
        detection = detect(temp_path)
        detection["filename"] = file.filename
        validation = validate(temp_path, detection["detected_type"])

        # Attempt fix
        fix_result = fix_file(
            temp_path,
            detection["detected_type"],
            validation["errors"]
        )

        return JSONResponse({
            "detection": detection,
            "validation": {
                "valid":     validation["valid"],
                "errors":    validation["errors"],
                "formatted": validation["formatted"],
            },
            "fix": {
                "fixed":   fix_result["fixed"],
                "method":  fix_result["method"],
                "error":   fix_result["error"],
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)