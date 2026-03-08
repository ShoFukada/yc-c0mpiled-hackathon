"""ディテール写真のAI真贋判定。

SOPの該当セクションとディテール画像をGeminiに投げて真贋判定を行う。
"""

import json
import re
import time

from google import genai
from google.genai import types
from yc_hackathon_shared import get_logger

from yc_hackathon_ai_core.schemas import DetailAnalysisResult

logger = get_logger("ai_core.analyzer")

MODEL = "gemini-3-flash-preview"


def extract_inspection_section(sop_md: str, point_id: int) -> str:
    """SOPから ## Inspection Point N ~ 次の ## Inspection Point の間を抽出。"""
    pattern = (
        rf"(## Inspection Point {point_id}:.*?)"
        r"(?=\n## Inspection Point \d+|\Z)"
    )
    match = re.search(pattern, sop_md, re.DOTALL)
    if not match:
        msg = f"Inspection Point {point_id} not found in SOP"
        raise ValueError(msg)
    return match.group(1).strip()


def _build_analysis_prompt(inspection_section: str) -> str:
    return f"""You are a professional sneaker authenticator.

You will be given:
1. A close-up image of a sneaker.
2. A description of an inspection point with authentic characteristics \
and known counterfeit patterns.

Your task is to visually inspect the provided image and determine \
whether the observed details are closer to authentic characteristics \
or counterfeit patterns.

Follow this reasoning process:

1. Carefully observe the specified focus area in the image.
2. Compare what you see with the "Authentic characteristics" \
and "Counterfeit patterns".
3. Explain which characteristics are visible.
4. Determine whether the shoe appears more likely authentic or \
counterfeit based only on the visible evidence.

Important rules:
- If the image is unclear or insufficient, reduce your confidence.
- Do not hallucinate details that are not visible.
- Base your reasoning only on visual evidence and the provided \
inspection hints.
- The final decision must be probabilistic, not absolute.

Return your answer in the following JSON format:

```json
{{{{
  "observation": "Describe what is visually observable in the focus area.",
  "comparison": "Explain how the observed features compare with \
authentic vs counterfeit characteristics.",
  "verdict": "authentic_like | counterfeit_like | inconclusive",
  "confidence": 0-100,
  "reasoning": "Short explanation for the decision."
}}}}
```

---

{inspection_section}

---

Analyze the image now."""


async def analyze_detail(
    *,
    image_bytes: bytes,
    mime_type: str,
    sop_md: str,
    point_id: int,
    api_key: str,
) -> DetailAnalysisResult:
    """ディテール画像を解析して真贋判定結果を返す。"""
    logger.info(
        "=== analyze_detail start: point=%d ===",
        point_id,
    )

    section = extract_inspection_section(sop_md, point_id)
    prompt = _build_analysis_prompt(section)

    resolved_mime = mime_type if mime_type and "/" in mime_type else "image/jpeg"

    client = genai.Client(api_key=api_key)

    logger.info("calling Gemini API for detail analysis...")
    api_start = time.monotonic()

    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "observation": types.Schema(type=types.Type.STRING),
            "comparison": types.Schema(type=types.Type.STRING),
            "verdict": types.Schema(type=types.Type.STRING),
            "confidence": types.Schema(type=types.Type.INTEGER),
            "reasoning": types.Schema(type=types.Type.STRING),
        },
        required=[
            "observation",
            "comparison",
            "verdict",
            "confidence",
            "reasoning",
        ],
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=resolved_mime,
            ),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
        ),
    )

    api_elapsed = time.monotonic() - api_start
    logger.info("Gemini API responded in %.2fs", api_elapsed)

    raw = json.loads(response.text)
    logger.info(
        "analysis result: verdict=%s, confidence=%d",
        raw["verdict"],
        raw["confidence"],
    )

    sop_reference = f"AUTH-AMSC-002 / Inspection Point {point_id}"

    return DetailAnalysisResult(
        point_id=point_id,
        observation=raw["observation"],
        comparison=raw["comparison"],
        verdict=raw["verdict"],
        confidence=raw["confidence"],
        reasoning=raw["reasoning"],
        sop_reference=sop_reference,
    )
