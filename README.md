# LEGIT CHECK - AI スニーカー真贋鑑定アシスタント

https://luma.com/rhi9rha9

スニーカーの写真をアップロードすると、AI（Gemini Vision）が真贋鑑定のチェックポイントを自動特定し、インタラクティブなビジュアルガイドを生成。各ポイントのディテール撮影までガイドするWebアプリ。

## 機能

1. 画像アップロード（ドラッグ&ドロップ対応）
2. Gemini Vision APIによる鑑定ポイント自動検出（バウンディングボックス付き）
3. インタラクティブな鑑定ガイド＋ポイントごとのディテール撮影フロー

## フロー

アップロード → プレビュー → AI解析（ローディング） → 鑑定ガイド → ディテール撮影

## 技術スタック

### Frontend (`frontend/`)
- Vite + React + TypeScript
- TanStack Router（ファイルベースルーティング、`$sessionId` パラメータ）
- TanStack Query（queryOptionsパターン、Context/useEffect不使用）
- Tailwind CSS v4
- Biome（lint / format）

### Backend (`backend/`)
- FastAPI + Python 3.12
- uv workspace（api / ai_core / shared）
- Google Gemini SDK (`google-genai`)
- SQLite（セッション永続化）
- pydantic-settings（設定管理）
- 構造化ロギング（コンソール + ファイル出力）

## 前提条件

- Node.js 22 (`.nvmrc`)
- pnpm
- Python 3.12 (`.python-version`)
- uv

## セットアップ

```bash
# 環境変数
cp .env.example .env  # GEMINI_API_KEY を設定

# フロントエンド
cd frontend
pnpm install

# バックエンド
cd backend
uv sync --all-packages
```

SQLiteデータベースとアップロードディレクトリはAPIサーバー初回起動時に自動作成されます。

## 開発サーバー起動

ターミナル2つで起動:

```bash
# ターミナル1: フロントエンド (localhost:5173)
cd frontend
pnpm dev

# ターミナル2: バックエンド (localhost:8000)
cd backend
uv run uvicorn yc_hackathon_api.main:app --reload --port 8000
```

フロントの `/api/*` リクエストは Vite proxy 経由で FastAPI に転送されます。

## API

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/api/sessions` | セッション作成（画像アップロード） |
| `GET` | `/api/sessions/{id}` | セッション取得（鑑定結果含む） |
| `GET` | `/api/sessions/{id}/image` | アップロード元画像の取得 |
| `POST` | `/api/sessions/{id}/inspect` | AI鑑定を実行 |
| `GET` | `/api/sessions/{id}/details` | アップロード済みディテールポイントID一覧 |
| `POST` | `/api/sessions/{id}/details/{point_id}` | ディテール画像のアップロード |
| `GET` | `/api/sessions/{id}/details/{point_id}/image` | ディテール画像の取得 |

### `POST /api/sessions/{id}/inspect` レスポンス

```json
{
  "points": [
    {
      "id": 1,
      "label": "チェックポイント名",
      "description": "確認すべき内容",
      "capture_guide": "撮影方法のガイド",
      "bbox": { "x1": 100, "y1": 200, "x2": 500, "y2": 600 }
    }
  ]
}
```

`bbox` の座標は 0〜1000 の正規化値。

## スクリプト

### Frontend (`frontend/`)

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 (localhost:5173) |
| `pnpm build` | 本番ビルド |
| `pnpm lint` | Biome lint チェック |
| `pnpm lint:fix` | Biome lint 自動修正 |
| `pnpm format` | Biome フォーマット |

### Backend (`backend/`)

| コマンド | 説明 |
|---------|------|
| `uv sync --all-packages` | 全パッケージの依存関係インストール |
| `uv run uvicorn yc_hackathon_api.main:app --reload --port 8000` | 開発サーバー起動 |
| `uv run ruff check .` | lint チェック |
| `uv run ruff check --fix .` | lint 自動修正 |
| `uv run ruff format .` | フォーマット |

### Playground (`playground/`)

backendとは独立したPython環境。APIの動作確認、プロンプトの試行、ライブラリの検証に使用。

```bash
cd playground
uv sync
uv run python inspect_sneaker.py
```

## ディレクトリ構成

```
├── frontend/
│   ├── index.html
│   ├── vite.config.ts          # /api → localhost:8000 proxy
│   ├── biome.json
│   └── src/
│       ├── main.tsx             # Reactエントリ (Router/Query初期化)
│       ├── styles.css           # Tailwind + カスタムテーマ
│       ├── types.ts             # 共通型定義 (BBox, InspectionPoint, InspectionResult)
│       ├── api/
│       │   ├── client.ts        # APIクライアント関数
│       │   └── queries.ts       # TanStack Query options
│       ├── routes/
│       │   ├── __root.tsx       # ルートレイアウト
│       │   ├── index.tsx        # アップロードページ (/)
│       │   ├── inspect.$sessionId.tsx  # プレビュー + 鑑定ガイド
│       │   └── capture.$sessionId.tsx  # ディテール撮影ウィザード
│       └── components/
│           ├── UploadScreen.tsx
│           ├── PreviewScreen.tsx
│           ├── LoadingScreen.tsx
│           ├── InspectionGuide.tsx
│           └── GuidedCapture.tsx
│
├── backend/                     # uv workspace
│   ├── pyproject.toml           # workspace root (ruff, pyright)
│   ├── api/
│   │   └── src/yc_hackathon_api/
│   │       ├── main.py          # FastAPI エンドポイント定義
│   │       └── db.py            # SQLite セッション管理
│   ├── ai_core/
│   │   └── src/yc_hackathon_ai_core/
│   │       ├── inspector.py     # Gemini API 呼び出し・画像解析
│   │       └── schemas.py       # Pydantic モデル定義
│   └── shared/
│       └── src/yc_hackathon_shared/
│           ├── config.py        # 設定管理 (pydantic-settings, .env)
│           └── logging.py       # ロガー設定 (コンソール + ファイル)
│
├── data/
│   ├── images/                  # テスト用画像
│   └── inspection/
│       └── sop.md               # 鑑定SOP（チェックポイント定義）
│
├── docs/
│   └── design/
│       ├── requirements.md
│       └── dev_flow.md
│
└── playground/                  # お遊び環境（独立した uv 環境）
    ├── pyproject.toml
    └── inspect_sneaker.py
```
