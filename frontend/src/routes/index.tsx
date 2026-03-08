// トップページ
// TanStack Queryを使ってHono APIからデータ取得するサンプル

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	// TanStack Queryでサーバーからデータ取得
	// キャッシュ・ローディング・エラー状態が自動管理される
	const { data, isLoading, error } = useQuery({
		queryKey: ["hello"],
		queryFn: () => fetch("/api/hello").then((r) => r.json()),
	});

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">YC Hackathon App</h1>

			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-2">API Response</h2>
				{isLoading && <p className="text-gray-500">Loading...</p>}
				{error && <p className="text-red-500">Error: {error.message}</p>}
				{data && (
					<pre className="bg-gray-100 p-3 rounded text-sm">
						{JSON.stringify(data, null, 2)}
					</pre>
				)}
			</div>
		</div>
	);
}
