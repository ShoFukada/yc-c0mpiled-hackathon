"""スニーカー鑑定AIコアロジック。

Gemini Vision APIを使って画像を解析し、鑑定ポイントを構造化データで返す。
"""

import json
import time

from google import genai
from google.genai import types
from yc_hackathon_shared import get_logger

from yc_hackathon_ai_core.schemas import BBox, InspectionPoint, InspectionResult

logger = get_logger("ai_core.inspector")

MODEL = "gemini-3-flash-preview"


def _build_prompt(inspection_md: str) -> str:
    return f"""You are an expert in sneaker authentication (legit check).

Analyze the attached sneaker image based on the following inspection criteria.

## Inspection Criteria
{inspection_md}

## Task
1. Analyze the sneaker in the image and identify which of the above inspection criteria are visible.
2. For each criterion, indicate the corresponding region in the image \
with a bounding box (normalized coordinates 0-1000).
3. For each criterion, provide a description of what specifically to check during authentication.
4. For each criterion, provide close-up photography instructions for more detailed authentication.

## Output Format
Output in the following JSON format only. Do not output any other text.
box_2d uses [ymin, xmin, ymax, xmax] order, with coordinates normalized to 0-1000.

```json
{{{{
  "points": [
    {{{{
      "id": <inspection criterion number>,
      "label": "Name of the criterion",
      "description": "Specific checkpoints to examine in this image",
      "capture_guide": "Photography instructions for closer authentication. \
Include distance, angle, and lighting conditions.",
      "box_2d": [ymin, xmin, ymax, xmax]
    }}}}
  ]
}}}}
```

Important:
- box_2d uses [ymin, xmin, ymax, xmax] order, normalized to 0-1000 \
(top-left is (0,0), bottom-right is (1000,1000)).
- Only output criteria that are visible in the image.
- Include practical authentication advice in the description.
- In capture_guide, describe specifically from what angle, at what distance, and what to focus on when photographing.
"""


def _convert_box_2d_to_bbox(box_2d: list[int]) -> BBox:
    """Geminiの box_2d [ymin, xmin, ymax, xmax] -> BBox {{x1, y1, x2, y2}} に変換"""
    ymin, xmin, ymax, xmax = box_2d
    return BBox(x1=xmin, y1=ymin, x2=xmax, y2=ymax)


async def inspect_sneaker(
    *,
    image_bytes: bytes,
    mime_type: str,
    inspection_md: str,
    api_key: str,
) -> InspectionResult:
    """スニーカー画像を鑑定し、構造化された鑑定ポイントを返す。"""
    logger.info("=== inspect_sneaker start ===")
    logger.info("model=%s, image_size=%d bytes, mime_type=%s", MODEL, len(image_bytes), mime_type)
    logger.debug("inspection_md length: %d chars", len(inspection_md))

    client = genai.Client(api_key=api_key)
    prompt = _build_prompt(inspection_md)
    logger.debug("prompt length: %d chars", len(prompt))

    resolved_mime = mime_type if mime_type and "/" in mime_type else "image/jpeg"
    if resolved_mime != mime_type:
        logger.warning("mime_type fallback: %s -> %s", mime_type, resolved_mime)

    logger.info("calling Gemini API...")
    api_start = time.monotonic()

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=resolved_mime),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    api_elapsed = time.monotonic() - api_start
    logger.info("Gemini API responded in %.2fs", api_elapsed)

    raw_text = response.text
    logger.debug("raw response length: %d chars", len(raw_text))
    logger.debug("raw response: %s", raw_text[:2000])

    try:
        raw = json.loads(raw_text)
    except json.JSONDecodeError:
        logger.exception("failed to parse Gemini response as JSON")
        logger.exception("raw response (full): %s", raw_text)
        raise

    raw_points = raw.get("points", [])
    logger.info("parsed %d points from response", len(raw_points))

    points = []
    for p in raw_points:
        box_2d = p.get("box_2d", [])
        logger.debug(
            "  raw point: id=%s, label=%s, box_2d=%s, capture_guide=%s",
            p.get("id"),
            p.get("label"),
            box_2d,
            p.get("capture_guide", "")[:80],
        )
        points.append(
            InspectionPoint(
                id=p["id"],
                label=p["label"],
                description=p["description"],
                capture_guide=p.get("capture_guide", ""),
                bbox=_convert_box_2d_to_bbox(box_2d),
            )
        )

    result = InspectionResult(points=points)
    logger.info("=== inspect_sneaker done: %d points ===", len(result.points))
    return result
