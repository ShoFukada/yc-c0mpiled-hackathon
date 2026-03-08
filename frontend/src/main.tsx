// クライアント側のエントリーポイント
// ReactアプリをDOMにマウントし、TanStack Router/Queryを初期化

import "./styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen"; // TanStack Router が自動生成

// TanStack Queryのクライアント
// API呼び出しのキャッシュ・再取得・エラーハンドリングを自動管理
const queryClient = new QueryClient();

// TanStack Routerのインスタンス
// src/routes/ 配下のファイルから自動生成されたrouteTreeを使用
const router = createRouter({
	routeTree,
	context: { queryClient },
});

// 型安全なルーティングのための型定義
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
);
