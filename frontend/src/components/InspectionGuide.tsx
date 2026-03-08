import { useCallback, useState } from "react";
import type { InspectionResult } from "@/types";

interface InspectionGuideProps {
	imageUrl: string;
	result: InspectionResult;
	onReset: () => void;
}

export function InspectionGuide({
	imageUrl,
	result,
	onReset,
}: InspectionGuideProps) {
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const handlePointClick = useCallback((id: number) => {
		setSelectedId((prev) => (prev === id ? null : id));
	}, []);

	const selectedPoint = result.points.find((p) => p.id === selectedId);

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Header */}
			<header className="flex-shrink-0 border-b border-border-subtle bg-surface/80 backdrop-blur-md z-30">
				<div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h1 className="font-display text-base font-700 tracking-tight">
							LEGIT CHECK
						</h1>
						<span className="text-border-medium">/</span>
						<span className="text-text-muted text-sm">鑑定結果</span>
					</div>
					<button
						type="button"
						onClick={onReset}
						className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-surface-raised border border-transparent hover:border-border-subtle"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
							/>
						</svg>
						<span className="font-display font-500">別の写真を鑑定</span>
					</button>
				</div>
			</header>

			{/* Main content — ヘッダー以外を左右で埋める */}
			<div className="flex-1 flex flex-col lg:flex-row min-h-0">
				{/* 左: 画像カード */}
				<div className="lg:flex-1 min-h-0 p-4 lg:p-6 flex items-center justify-center">
					<div className="relative inline-block animate-fade-in-up max-h-full">
						<div className="relative rounded-xl overflow-hidden border border-border-subtle">
							<img
								src={imageUrl}
								alt="鑑定対象のスニーカー"
								className="block max-w-full max-h-[calc(100vh-120px)] object-contain"
							/>

							{/* Bounding box overlay */}
							{selectedPoint && (
								<div
									className="absolute border-2 border-accent rounded-md bg-accent/8 animate-bbox-reveal pointer-events-none"
									style={{
										left: `${selectedPoint.bbox.x1 / 10}%`,
										top: `${selectedPoint.bbox.y1 / 10}%`,
										width: `${(selectedPoint.bbox.x2 - selectedPoint.bbox.x1) / 10}%`,
										height: `${(selectedPoint.bbox.y2 - selectedPoint.bbox.y1) / 10}%`,
									}}
								/>
							)}

							{/* Markers */}
							{result.points.map((point, i) => {
								const isSelected = selectedId === point.id;
								const cx = (point.bbox.x1 + point.bbox.x2) / 2 / 10;
								const cy = (point.bbox.y1 + point.bbox.y2) / 2 / 10;

								return (
									<button
										type="button"
										key={point.id}
										onClick={() => handlePointClick(point.id)}
										className="absolute animate-marker-pop"
										style={{
											left: `${cx}%`,
											top: `${cy}%`,
											transform: "translate(-50%, -50%)",
											animationDelay: `${i * 80 + 200}ms`,
										}}
									>
										<span
											className={`
												flex items-center justify-center w-8 h-8 rounded-full text-xs font-display font-700
												transition-all duration-200 shadow-lg
												${
													isSelected
														? "bg-accent text-surface scale-110 ring-2 ring-accent/40 shadow-[0_0_20px_-4px_rgba(201,160,68,0.5)]"
														: "bg-surface-raised/90 text-text-primary border border-border-medium backdrop-blur-sm hover:bg-surface-overlay hover:border-accent-dim hover:scale-110"
												}
											`}
										>
											{point.id}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* 右: ポイント一覧 — 独立スクロール */}
				<div className="lg:w-[420px] min-h-0 border-t lg:border-t-0 lg:border-l border-border-subtle bg-surface-raised/30 overflow-y-auto">
					<div className="p-5">
						{/* Panel header */}
						<div className="flex items-center justify-between mb-4 sticky top-0 bg-surface-raised/30 backdrop-blur-sm -mx-5 px-5 py-2 -mt-5 z-10">
							<h2 className="font-display text-xs font-600 text-text-muted tracking-[0.2em] uppercase">
								鑑定ポイント
							</h2>
							<span className="text-xs text-text-muted font-display tabular-nums">
								{result.points.length} items
							</span>
						</div>

						{/* Point cards */}
						<div className="space-y-2">
							{result.points.map((point, i) => {
								const isSelected = selectedId === point.id;
								return (
									<button
										type="button"
										key={point.id}
										onClick={() => handlePointClick(point.id)}
										className={`
											animate-fade-in-up w-full text-left rounded-xl p-4 transition-all duration-200
											${
												isSelected
													? "bg-accent/8 border border-accent/25 shadow-[0_0_30px_-10px_rgba(201,160,68,0.15)]"
													: "bg-surface-raised/50 border border-border-subtle hover:bg-surface-overlay hover:border-border-medium"
											}
										`}
										style={{
											animationDelay: `${i * 60 + 100}ms`,
										}}
									>
										<div className="flex items-start gap-3.5">
											<span
												className={`
													flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-display font-700 mt-0.5
													transition-colors duration-200
													${
														isSelected
															? "bg-accent text-surface"
															: "bg-surface-overlay text-text-secondary border border-border-subtle"
													}
												`}
											>
												{point.id}
											</span>
											<div className="min-w-0 flex-1">
												<p
													className={`font-display font-600 text-sm ${isSelected ? "text-accent-light" : "text-text-primary"}`}
												>
													{point.label}
												</p>
												<p
													className={`text-sm mt-1.5 leading-relaxed ${isSelected ? "text-text-secondary" : "text-text-muted"}`}
												>
													{point.description}
												</p>
											</div>

											{/* Arrow */}
											<svg
												className={`w-4 h-4 mt-1 flex-shrink-0 transition-all duration-200 ${isSelected ? "text-accent rotate-90" : "text-border-medium"}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="m8.25 4.5 7.5 7.5-7.5 7.5"
												/>
											</svg>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
