"""スニーカー鑑定AIの検証スクリプト。

画像 + 鑑定観点md をGemini APIに投げて、
各観点の構造化データ（ラベル・説明・バウンディングボックス）を取得し、
画像にオーバーレイして出力する。
"""

import json
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFont

load_dotenv()

# --- 設定 ---
PROJECT_ROOT = Path(__file__).parent.parent
PLAYGROUND_DIR = Path(__file__).parent
OUTPUT_DIR = PLAYGROUND_DIR / "output"
IMAGE_PATH = PROJECT_ROOT / "data" / "images" / "nike-air-max-gray-black-gold.jpg"
INSPECTION_MD_PATH = PROJECT_ROOT / "data" / "inspection" / "sop.md"

MODEL = "gemini-3-flash-preview"

# bbox描画用の色（観点ごとに色分け）
COLORS = [
    (255, 59, 48),    # 赤
    (0, 122, 255),    # 青
    (52, 199, 89),    # 緑
    (255, 149, 0),    # オレンジ
    (175, 82, 222),   # 紫
    (255, 45, 85),    # ピンク
    (90, 200, 250),   # 水色
    (255, 204, 0),    # 黄
]


def load_image(path: Path) -> bytes:
    with open(path, "rb") as f:
        return f.read()


def load_inspection_md(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_prompt(inspection_md: str) -> str:
    return f"""あなたはスニーカーの真贋鑑定の専門家です。

以下の「鑑定観点」に基づいて、添付されたスニーカー画像を分析してください。

## 鑑定観点
{inspection_md}

## タスク
1. 画像に写っているスニーカーを分析し、上記の鑑定観点のうち画像から確認できるものを特定してください
2. 各観点について、画像上のどの部分に該当するかをバウンディングボックス（正規化座標0〜1000）で示してください
3. 各観点について、鑑定時に具体的に何を確認すべきかの説明を記述してください

## 出力形式
以下のJSON形式で出力してください。それ以外のテキストは出力しないでください。
box_2dは [ymin, xmin, ymax, xmax] の順で、0-1000に正規化した座標です。

```json
{{
  "points": [
    {{
      "id": <鑑定観点のInspection Point番号と一致させる>,
      "label": "観点の名前",
      "description": "この画像における具体的な確認ポイントの説明",
      "box_2d": [ymin, xmin, ymax, xmax]
    }}
  ]
}}
```

重要:
- idは鑑定観点の「Inspection Point N」の番号Nと必ず一致させてください
- box_2dは [ymin, xmin, ymax, xmax] の順で、画像の左上を(0,0)、右下を(1000,1000)とした正規化座標
- 画像から確認できる観点のみを出力してください
- descriptionは鑑定の実用的なアドバイスを含めてください
"""


def draw_overlay(image_path: Path, points: list[dict], output_path: Path) -> None:
    """画像にbboxとラベルをオーバーレイして保存する。"""
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size

    # フォント（システムフォントにフォールバック）
    font_size = max(16, min(w, h) // 40)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc", font_size)
    except OSError:
        font = ImageFont.load_default(size=font_size)

    for point in points:
        idx = point["id"] - 1
        color = COLORS[idx % len(COLORS)]

        # box_2d: [ymin, xmin, ymax, xmax] (0-1000正規化) → ピクセル座標
        box = point["box_2d"]
        x1 = int(box[1] / 1000 * w)
        y1 = int(box[0] / 1000 * h)
        x2 = int(box[3] / 1000 * w)
        y2 = int(box[2] / 1000 * h)

        # 半透明の塗りつぶし
        overlay_color = (*color, 40)
        draw.rectangle([x1, y1, x2, y2], fill=overlay_color)

        # 枠線（太め）
        line_width = max(2, min(w, h) // 300)
        draw.rectangle([x1, y1, x2, y2], outline=color, width=line_width)

        # ラベル背景 + テキスト
        label = f"{point['id']}. {point['label']}"
        text_bbox = draw.textbbox((0, 0), label, font=font)
        text_w = text_bbox[2] - text_bbox[0]
        text_h = text_bbox[3] - text_bbox[1]
        padding = 4

        # ラベルをbboxの上に配置（はみ出す場合は内側に）
        label_y = y1 - text_h - padding * 2 if y1 - text_h - padding * 2 > 0 else y1
        draw.rectangle(
            [x1, label_y, x1 + text_w + padding * 2, label_y + text_h + padding * 2],
            fill=(*color, 200),
        )
        draw.text((x1 + padding, label_y + padding), label, fill=(255, 255, 255), font=font)

    img.save(output_path, quality=95)
    print(f"オーバーレイ画像: {output_path}")


def main() -> None:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    image_bytes = load_image(IMAGE_PATH)
    inspection_md = load_inspection_md(INSPECTION_MD_PATH)
    prompt = build_prompt(inspection_md)

    print(f"モデル: {MODEL}")
    print(f"画像: {IMAGE_PATH.name}")
    print(f"鑑定観点: {INSPECTION_MD_PATH.name}")
    print("---")
    print("Gemini APIに送信中...")

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    result_text = response.text

    # outputディレクトリにタイムスタンプ付きで保存
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    OUTPUT_DIR.mkdir(exist_ok=True)

    json_path = OUTPUT_DIR / f"inspect_{timestamp}.json"
    json_path.write_text(result_text, encoding="utf-8")
    print(f"\nJSON保存先: {json_path}")

    # JSONパース & オーバーレイ描画
    try:
        result = json.loads(result_text)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print(f"\n検出された観点数: {len(result.get('points', []))}")

        for point in result.get("points", []):
            box = point.get("box_2d", [])
            print(
                f"  [{point['id']}] {point['label']}: "
                f"box_2d=[{', '.join(str(v) for v in box)}]"
            )

        # オーバーレイ画像を生成
        overlay_path = OUTPUT_DIR / f"overlay_{timestamp}.jpg"
        draw_overlay(IMAGE_PATH, result["points"], overlay_path)

    except json.JSONDecodeError as e:
        print(f"\nJSON パースエラー: {e}")


if __name__ == "__main__":
    main()
