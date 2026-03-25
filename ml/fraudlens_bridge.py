import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add fraudlens-ai to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
FRAUDLENS_DIR = BASE_DIR / "fraudlens-ai"

# Load FraudLens env vars
load_dotenv(FRAUDLENS_DIR / ".env")

if str(FRAUDLENS_DIR) not in sys.path:
    sys.path.append(str(FRAUDLENS_DIR))

try:
    from fraudlens import FraudLensAI, analyze_claim
    from ai_detect import ContentScanAI
    HAS_FRAUDLENS = True
except ImportError as e:
    print(f"Warning: Could not import FraudLens AI components: {e}")
    HAS_FRAUDLENS = False

async def analyze_document_comprehensive(document_path: str, image_paths: list = None):
    if not HAS_FRAUDLENS:
        return {"error": "FraudLens AI components not available"}
    
    detector = FraudLensAI()
    result = await detector.analyze(document_path, image_paths=image_paths)
    return result.to_dict()

async def detect_ai_content(text: str = "", image_paths: list = None):
    if not HAS_FRAUDLENS:
        return {"error": "FraudLens AI components not available"}
    
    detector = ContentScanAI()
    result = await detector.analyze(text=text, image_paths=image_paths)
    return result.to_dict()
