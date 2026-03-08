"""ステップ3: ディテール写真 × SOP照合による真贋判定（Analysis & Reporting）検証。

original/ と fake/ の各ディテール画像に対して、
SOPの該当セクションをGeminiに投げて真贋判定レポートを生成する。
"""

import json
import os
import re
import time
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
SOP_PATH = PROJECT_ROOT / "data" / "inspection" / "sop.md"
IMAGE_DIR = PROJECT_ROOT / "data" / "images"

MODEL = "gemini-3-flash-preview"

# zoom_N → Inspection Point N のマッピング（original / fake 共通）
POINT_IMAGES = [
	{"point_id": 1, "original": "original/zoom_1_original.jpeg", "fake": "fake/zoom_1_fake.png"},
	# {"point_id": 2, "original": "original/zoom_2_original.jpeg", "fake": "fake/zoom_2_fake.png"},
	# {"point_id": 3, "original": "original/zoom_3_original.jpeg", "fake": "fake/zoom_3_fake.png"},
]


def extract_inspection_section(sop_md: str, point_id: int) -> str:
	"""SOPから ## Inspection Point N ~ 次の ## Inspection Point の間を抽出。"""
	pattern = rf"(## Inspection Point {point_id}:.*?)(?=\n## Inspection Point \d+|\Z)"
	match = re.search(pattern, sop_md, re.DOTALL)
	if not match:
		msg = f"Inspection Point {point_id} がSOPに見つかりません"
		raise ValueError(msg)
	return match.group(1).strip()


def build_prompt(inspection_section: str) -> str:
	return f"""You are a professional sneaker authenticator.

You will be given:
1. A close-up image of a sneaker.
2. A description of an inspection point with authentic characteristics and known counterfeit patterns.

Your task is to visually inspect the provided image and determine whether the observed details are closer to authentic characteristics or counterfeit patterns.

Follow this reasoning process:

1. Carefully observe the specified focus area in the image.
2. Compare what you see with the "Authentic characteristics" and "Counterfeit patterns".
3. Explain which characteristics are visible.
4. Determine whether the shoe appears more likely authentic or counterfeit based only on the visible evidence.

Important rules:
- If the image is unclear or insufficient, reduce your confidence.
- Do not hallucinate details that are not visible.
- Base your reasoning only on visual evidence and the provided inspection hints.
- The final decision must be probabilistic, not absolute.

Return your answer in the following JSON format:

```json
{{
  "observation": "Describe what is visually observable in the focus area.",
  "comparison": "Explain how the observed features compare with authentic vs counterfeit characteristics.",
  "verdict": "authentic_like | counterfeit_like | inconclusive",
  "confidence": 0-100,
  "reasoning": "Short explanation for the decision."
}}
```

---

{inspection_section}

---

Analyze the image now."""


def detect_mime_type(path: Path) -> str:
	suffix = path.suffix.lower()
	if suffix in (".jpg", ".jpeg"):
		return "image/jpeg"
	if suffix == ".png":
		return "image/png"
	return "image/jpeg"


def analyze_image(client: genai.Client, image_path: Path, prompt: str, max_retries: int = 3) -> dict | None:
	"""1枚の画像を解析してJSONを返す。Rate limit時はリトライ。"""
	with open(image_path, "rb") as f:
		image_bytes = f.read()

	mime = detect_mime_type(image_path)

	for attempt in range(max_retries):
		try:
			response = client.models.generate_content(
				model=MODEL,
				contents=[
					types.Part.from_bytes(data=image_bytes, mime_type=mime),
					prompt,
				],
				config=types.GenerateContentConfig(
					response_mime_type="application/json",
				),
			)
			return json.loads(response.text)
		except json.JSONDecodeError as e:
			print(f"  JSON パースエラー: {e}")
			print(f"  Raw: {response.text[:500]}")
			return None
		except Exception as e:
			if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
				wait = 40 * (attempt + 1)
				print(f"  Rate limit hit. {wait}秒待機中... (attempt {attempt + 1}/{max_retries})")
				time.sleep(wait)
			else:
				raise
	print("  最大リトライ回数に達しました")
	return None


def print_result(result: dict) -> None:
	verdict_icon = {
		"authentic_like": "✅",
		"counterfeit_like": "🚨",
		"inconclusive": "❓",
	}.get(result["verdict"], "❓")

	print(f"  判定: {verdict_icon} {result['verdict']} (confidence: {result['confidence']}%)")
	print(f"  観察: {result['observation']}")
	print(f"  比較: {result['comparison']}")
	print(f"  理由: {result['reasoning']}")


def main() -> None:
	client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
	sop_md = SOP_PATH.read_text(encoding="utf-8")

	all_results = []

	for entry in POINT_IMAGES:
		point_id = entry["point_id"]
		section = extract_inspection_section(sop_md, point_id)
		prompt = build_prompt(section)

		for label in ("original", "fake"):
			image_rel = entry[label]
			image_path = IMAGE_DIR / image_rel

			if not image_path.exists():
				print(f"⚠️  画像が見つかりません: {image_path}")
				continue

			print(f"\n{'='*60}")
			print(f"Point {point_id} [{label.upper()}]: {image_rel}")
			print(f"{'='*60}")
			print(f"\n--- PROMPT ---\n{prompt}\n--- END PROMPT ---\n")
			print("解析中...")

			result = analyze_image(client, image_path, prompt)
			if result is None:
				continue

			result["inspection_point_id"] = point_id
			result["image"] = image_rel
			result["label"] = label
			all_results.append(result)

			print_result(result)

	# サマリー集計
	original_results = [r for r in all_results if r["label"] == "original"]
	fake_results = [r for r in all_results if r["label"] == "fake"]

	def make_summary(results: list[dict]) -> dict:
		if not results:
			return {}
		return {
			"total_points": len(results),
			"authentic_like": sum(1 for r in results if r["verdict"] == "authentic_like"),
			"counterfeit_like": sum(1 for r in results if r["verdict"] == "counterfeit_like"),
			"inconclusive": sum(1 for r in results if r["verdict"] == "inconclusive"),
			"avg_confidence": round(sum(r["confidence"] for r in results) / len(results), 1),
		}

	timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
	OUTPUT_DIR.mkdir(exist_ok=True)

	output = {
		"analysis_results": all_results,
		"summary_original": make_summary(original_results),
		"summary_fake": make_summary(fake_results),
	}

	json_path = OUTPUT_DIR / f"analysis_{timestamp}.json"
	json_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

	print(f"\n{'='*60}")
	print(f"結果保存先: {json_path}")
	print(f"\n--- ORIGINAL サマリー ---")
	print(json.dumps(output["summary_original"], indent=2, ensure_ascii=False))
	print(f"\n--- FAKE サマリー ---")
	print(json.dumps(output["summary_fake"], indent=2, ensure_ascii=False))


if __name__ == "__main__":
	main()
