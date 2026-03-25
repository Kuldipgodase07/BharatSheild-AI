import sys
import os
import json
import asyncio
from dotenv import load_dotenv
import logging

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'fraudlens-ai', '.env'))

# Remove the backend directory from sys.path to avoid picking up the Django 'core' package
backend_dir = os.path.abspath(os.path.dirname(__file__))
sys.path = [p for p in sys.path if os.path.abspath(p) != backend_dir]

FRAUDLENS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'fraudlens-ai'))
sys.path.insert(0, FRAUDLENS_DIR)

try:
    from fraudlens import FraudLensAI
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

# Redirect loguru logs to stderr to keep stdout clean for JSON output
try:
    from loguru import logger
    logger.remove()
    logger.add(sys.stderr)
except ImportError:
    pass

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided."}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    doc_type = sys.argv[2] if len(sys.argv) > 2 else "auto_insurance"
    
    try:
        detector = FraudLensAI()
        
        # Dynamically adjust features based on Document Type context
        inc_network = True
        inc_deepfake = True
        if doc_type == "photo_id":
            inc_network = False # ID checks rarely require claim network ring validation
            inc_deepfake = True
        elif doc_type == "medical_doc":
            inc_deepfake = False # Medical docs are text-heavy, typically not deepfaked images
            inc_network = True
            
        result = await detector.analyze(
            file_path, 
            include_network=inc_network, 
            include_deepfake=inc_deepfake
        )
        
        print("FRAUDLENS_JSON_START")
        print(json.dumps(result.to_dict()))
        print("FRAUDLENS_JSON_END")
    except Exception as e:
        err_str = str(e)
        if "NVIDIA" in err_str or "API_KEY" in err_str:
            print("FRAUDLENS_JSON_START")
            print(json.dumps({
              "claim_data": {"narrative": "NVIDIA API KEY Required for dynamic analysis."},
              "fraud_score": 0,
              "risk_level": "Unknown",
              "error": "API Key Missing"
            }))
            print("FRAUDLENS_JSON_END")
        else:
            print("FRAUDLENS_JSON_START")
            print(json.dumps({"error": err_str}))
            print("FRAUDLENS_JSON_END")
        sys.exit(0 if ("NVIDIA" in err_str or "API_KEY" in err_str) else 1)

if __name__ == "__main__":
    asyncio.run(main())
