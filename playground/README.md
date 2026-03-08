# playground

お遊び環境。API実験、プロンプト試行、ライブラリ検証など自由に使う。

backend とは独立した uv 環境なので、好きなパッケージを気軽に入れて試せる。

## セットアップ

```bash
cd playground
uv sync
```

## 使い方

```bash
# スクリプトを実行
uv run python example.py

# パッケージを追加して試す
uv add pandas
```
