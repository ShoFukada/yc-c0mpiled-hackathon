# yc-c0mpiled-hackathon

https://luma.com/rhi9rha9

## 技術スタック

### Frontend (`frontend/`)
- Vite + React + TypeScript
- TanStack Router (ファイルベースルーティング)
- TanStack Query (API呼び出し)
- Tailwind CSS v4
- Biome (lint / format)

### Backend (`backend/`)
- FastAPI + Python 3.12
- uv workspace (api + ai_core)
- Anthropic SDK

## 前提条件

- Node.js 22 (`.nvmrc`)
- pnpm
- Python 3.12 (`.python-version`)
- uv

## セットアップ

```bash
# フロントエンド
cd frontend
pnpm install

# バックエンド
cd backend
uv sync

# playground（お遊び環境）
cd playground
uv sync
```

## 開発サーバー起動

ターミナル2つで起動する。

```bash
# ターミナル1: フロントエンド (localhost:5173)
cd frontend
pnpm dev

# ターミナル2: バックエンド (localhost:8000)
cd backend
uv run uvicorn yc_hackathon_api.main:app --reload --port 8000
```

フロントの `/api/*` リクエストは Vite proxy 経由で FastAPI に転送される。

## スクリプト

### Frontend (`frontend/`)

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 (localhost:5173) |
| `pnpm build` | 本番ビルド |
| `pnpm preview` | ビルド結果のプレビュー |
| `pnpm lint` | Biome で lint チェック |
| `pnpm lint:fix` | Biome で lint 自動修正 |
| `pnpm format` | Biome でフォーマット |

### Backend (`backend/`)

| コマンド | 説明 |
|---------|------|
| `uv sync` | 依存関係インストール |
| `uv run uvicorn yc_hackathon_api.main:app --reload --port 8000` | 開発サーバー起動 |
| `uv run pytest` | テスト実行 |
| `uv run ruff check .` | lint チェック |
| `uv run ruff check --fix .` | lint 自動修正 |
| `uv run ruff format .` | フォーマット |

## ディレクトリ構成

```
├── frontend/
│   ├── index.html
│   ├── vite.config.ts        # /api → localhost:8000 proxy
│   ├── biome.json
│   └── src/
│       ├── main.tsx           # React エントリ (Router/Query 初期化)
│       ├── styles.css         # Tailwind
│       ├── routes/            # TanStack Router ファイルベースルーティング
│       └── components/
│
├── backend/                   # uv workspace
│   ├── pyproject.toml         # workspace root (ruff, pyright, pytest)
│   ├── api/                   # FastAPI サーバー
│   │   ├── pyproject.toml
│   │   └── src/yc_hackathon_api/
│   └── ai_core/               # AI コアロジック
│       ├── pyproject.toml
│       └── src/yc_hackathon_ai_core/
│
└── playground/                # お遊び環境（独立した uv 環境）
    ├── pyproject.toml
    └── *.py                   # 自由に試すスクリプト
```
