"""ステップ2: ディテール撮影のためのガイダンス（Guided Capture）検証。

ステップ1の全体画像解析結果 + SOPを入力に、
各ポイントについて「どんな写真を追加で撮るべきか」の撮影指示を生成する。
"""

import json
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# --- 設定 ---
PROJECT_ROOT = Path(__file__).parent.parent
PLAYGROUND_DIR = Path(__file__).parent
OUTPUT_DIR = PLAYGROUND_DIR / "output"
IMAGE_PATH = PROJECT_ROOT / "data" / "images" / "nike-air-max-gray-black-gold.jpg"
SOP_PATH = PROJECT_ROOT / "data" / "inspection" / "sop.md"

# ステップ1の最新の出力を使う（手動で指定も可）
STEP1_RESULT_PATH = None  # Noneなら output/ 内の最新を自動取得

MODEL = "gemini-3-flash-preview"


def get_latest_step1_result() -> Path:
    """output/ 内の最新の inspect_*.json を取得。"""
    results = sorted(OUTPUT_DIR.glob("inspect_*.json"), reverse=True)
    if not results:
        msg = "ステップ1の結果が見つかりません。先に inspect_sneaker.py を実行してください。"
        raise FileNotFoundError(msg)
    return results[0]


def build_guidance_prompt(sop_md: str, step1_result: dict) -> str:
    step1_json = json.dumps(step1_result, indent=2, ensure_ascii=False)

    return f"""あなたはスニーカーの真贋鑑定の専門家であり、鑑定撮影のディレクターです。

## 背景
ユーザーがスニーカーの全体写真をアップロードし、AIが初期解析を行いました。
初期解析では、SOPに基づく各チェックポイントのおおよその位置を特定しましたが、
全体写真だけでは詳細な鑑定には不十分な箇所があります。

## SOP（鑑定マニュアル）
{sop_md}

## ステップ1の解析結果（全体画像からの初期解析）
{step1_json}

## タスク
各チェックポイントについて、より精密な鑑定のために必要な「追加撮影の指示」を生成してください。

以下を考慮してください：
- SOPの各ポイントで確認すべき具体的な特徴（ステッチ、素材感、間隔など）
- それを撮影するために最適な角度、距離、照明条件
- 全体写真では判断が難しい理由

## 出力形式
以下のJSON形式で出力してください。それ以外のテキストは出力しないでください。

```json
{{
  "capture_guides": [
    {{
      "inspection_point_id": <SOPのInspection Point番号>,
      "label": "チェックポイント名",
      "can_judge_from_overview": <全体写真だけで判定可能か true/false>,
      "reason_for_detail": "なぜ追加撮影が必要なのかの説明",
      "capture_instruction": {{
        "distance": "推奨撮影距離（例: 10cm）",
        "angle": "推奨撮影角度（例: 真横から）",
        "lighting": "推奨照明条件（例: 明るい自然光の下で）",
        "focus_on": "撮影時に特にフォーカスすべき部分",
        "text_instruction": "ユーザーに表示する撮影指示テキスト（日本語・わかりやすく簡潔に）"
      }}
    }}
  ]
}}
```

重要:
- inspection_point_idはSOPの「Inspection Point N」の番号Nと一致させてください
- 全体写真で十分判定できるポイントでも、capture_guideは生成し、can_judge_from_overviewをtrueにしてください
- text_instructionは一般ユーザーが理解できる平易な日本語で記述してください
"""


def main() -> None:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # ステップ1の結果を読み込み
    step1_path = STEP1_RESULT_PATH or get_latest_step1_result()
    step1_result = json.loads(step1_path.read_text(encoding="utf-8"))
    print(f"ステップ1結果: {step1_path.name}")

    # SOP読み込み
    sop_md = SOP_PATH.read_text(encoding="utf-8")

    # 全体画像も送る（AIが画質や角度を評価するため）
    with open(IMAGE_PATH, "rb") as f:
        image_bytes = f.read()

    prompt = build_guidance_prompt(sop_md, step1_result)

    print(f"モデル: {MODEL}")
    print("---")
    print("撮影ガイダンスを生成中...")

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

    # 保存
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    OUTPUT_DIR.mkdir(exist_ok=True)

    json_path = OUTPUT_DIR / f"guidance_{timestamp}.json"
    json_path.write_text(result_text, encoding="utf-8")
    print(f"\nJSON保存先: {json_path}")

    # パース & 表示
    try:
        result = json.loads(result_text)
        print(json.dumps(result, indent=2, ensure_ascii=False))

        print(f"\nガイダンス数: {len(result.get('capture_guides', []))}")
        for guide in result.get("capture_guides", []):
            cap = guide["capture_instruction"]
            overview_ok = "✅ 全体写真で判定可" if guide["can_judge_from_overview"] else "📸 追加撮影必要"
            print(f"\n  [Point {guide['inspection_point_id']}] {guide['label']} — {overview_ok}")
            print(f"    📷 {cap['text_instruction']}")

    except json.JSONDecodeError as e:
        print(f"\nJSON パースエラー: {e}")


if __name__ == "__main__":
    main()
