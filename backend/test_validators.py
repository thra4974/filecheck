from detector import detect
from validators import validate
import json

test_files = [
    "test_files/valid.json",
    "test_files/broken.json",
    "test_files/valid.yaml",
    "test_files/broken.yaml",
    "test_files/valid.csv",
    "test_files/broken.csv",
]

for path in test_files:
    detection = detect(path)
    result = validate(path, detection["detected_type"])

    print(f"\n{'='*50}")
    print(f"File    : {detection['filename']}")
    print(f"Type    : {detection['detected_type']}")
    print(f"Valid   : {result['valid']}")
    if result["errors"]:
        print(f"Errors  : {result['errors']}")
    if result["formatted"]:
        print(f"Formatted Preview:\n{result['formatted'][:100]}")