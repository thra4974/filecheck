from detector import detect
import json

# Test with a sample file — update the path to any file you have
result = detect("test_files/sample.json")
print(json.dumps(result, indent=2))