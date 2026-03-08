import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		// FastAPI バックエンドへのプロキシ
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
	plugins: [
		// TanStack Routerのファイルベースルーティング
		// src/routes/ 配下のファイルから自動的にルート生成
		// react()より前に配置する必要がある
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),

		tailwindcss(),
		react(),
	],
});
