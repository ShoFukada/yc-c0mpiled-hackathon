// ルートレイアウト
// 全ページで共通のレイアウト（ナビゲーション等）を定義
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm border-b">
				<div className="max-w-4xl mx-auto px-4 py-3 flex gap-4">
					<Link to="/" className="text-blue-600 font-semibold hover:underline">
						Home
					</Link>
					<Link
						to="/about"
						className="text-blue-600 font-semibold hover:underline"
					>
						About
					</Link>
				</div>
			</nav>
			{/* 子ルートのコンテンツがここに描画される */}
			<main className="max-w-4xl mx-auto px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}
