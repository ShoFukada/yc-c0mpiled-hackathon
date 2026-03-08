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
    return f"""あなたはスニーカーの真贋鑑定の専門家です。

以下の「鑑定観点」に基づいて、添付されたスニーカー画像を分析してください。

## 鑑定観点
{inspection_md}

## タスク
1. 画像に写っているスニーカーを分析し、上記の鑑定観点のうち画像から確認できるものを特定してください
2. 各観点について、画像上のどの部分に該当するかをバウンディングボックス(正規化座標0-1000)で示してください
3. 各観点について、鑑定時に具体的に何を確認すべきかの説明を記述してください

## 出力形式
以下のJSON形式で出力してください。それ以外のテキストは出力しないでください。
box_2dは [ymin, xmin, ymax, xmax] の順で、0-1000に正規化した座標です。

```json
{{{{
  "points": [
    {{{{
      "id": <鑑定観点の番号>,
      "label": "観点の名前",
      "description": "この画像における具体的な確認ポイントの説明",
      "box_2d": [ymin, xmin, ymax, xmax]
    }}}}
  ]
}}}}
```

重要:
- box_2dは [ymin, xmin, ymax, xmax] の順で、画像の左上を(0,0)、右下を(1000,1000)とした正規化座標
- 画像から確認できる観点のみを出力してください
- descriptionは鑑定の実用的なアドバイスを含めてください
"""


def _convert_box_2d_to_bbox(box_2d: list[int]) -> BBox:
    """Geminiの box_2d [ymin, xmin, ymax, xmax] → BBox {x1, y1, x2, y2} に変換"""
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

    # MIMEタイプのフォールバック
    resolved_mime = mime_type if mime_type and "/" in mime_type else "image/jpeg"
    if resolved_mime != mime_type:
        logger.warning("mime_type fallback: %s → %s", mime_type, resolved_mime)

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
            "  raw point: id=%s, label=%s, box_2d=%s",
            p.get("id"),
            p.get("label"),
            box_2d,
        )
        points.append(
            InspectionPoint(
                id=p["id"],
                label=p["label"],
                description=p["description"],
                bbox=_convert_box_2d_to_bbox(box_2d),
            )
        )

    result = InspectionResult(points=points)
    logger.info("=== inspect_sneaker done: %d points ===", len(result.points))
    return result
