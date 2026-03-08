import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: AboutPage,
});

function AboutPage() {
	return (
		<div className="space-y-4">
			<h1 className="text-3xl font-bold">About</h1>
			<p className="text-gray-600">
				Vite + React + Hono + TanStack Router/Query + Drizzle + Claude AI
			</p>
		</div>
	);
}
