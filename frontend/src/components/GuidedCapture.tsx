import { useCallback, useRef, useState } from "react";
import { detailImageUrl } from "@/api/client";
import type { InspectionResult, PointAnalysis } from "@/types";

interface GuidedCaptureProps {
	sessionId: string;
	imageUrl: string;
	result: InspectionResult;
	uploadedPointIds: number[];
	analyses: PointAnalysis[];
	isAnalyzing: boolean;
	analyzingPointId?: number;
	onUploadDetail: (pointId: number, file: File) => void;
	onBack: () => void;
	onComplete: () => void;
}

export function GuidedCapture({
	sessionId,
	imageUrl,
	result,
	uploadedPointIds,
	analyses,
	isAnalyzing,
	analyzingPointId,
	onUploadDetail,
	onBack,
	onComplete,
}: GuidedCaptureProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const point = result.points[currentIndex];
	const total = result.points.length;
	const isLast = currentIndex === total - 1;

	const isUploaded = uploadedPointIds.includes(point.id);
	const allUploaded = result.points.every((p) =>
		uploadedPointIds.includes(p.id),
	);
	const currentAnalysis = analyses.find((a) => a.point_id === point.id);
	const isCurrentAnalyzing = isAnalyzing && analyzingPointId === point.id;

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file?.type.startsWith("image/")) {
				onUploadDetail(point.id, file);
			}
			e.target.value = "";
		},
		[onUploadDetail, point.id],
	);

	const handleNext = useCallback(() => {
		if (!isLast) setCurrentIndex((i) => i + 1);
	}, [isLast]);

	const handlePrev = useCallback(() => {
		if (currentIndex > 0) setCurrentIndex((i) => i - 1);
	}, [currentIndex]);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file?.type.startsWith("image/")) {
				onUploadDetail(point.id, file);
			}
		},
		[onUploadDetail, point.id],
	);

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Header */}
			<header className="flex-shrink-0 border-b border-border-subtle bg-surface/80 backdrop-blur-md z-30">
				<div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onBack}
							className="text-text-muted hover:text-text-primary transition-colors"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
								/>
							</svg>
						</button>
						<h1 className="font-display text-base font-700 tracking-tight">
							LEGIT CHECK
						</h1>
						<span className="text-border-medium">/</span>
						<span className="text-text-muted text-sm">Detail Capture</span>
					</div>

					{/* Progress */}
					<div className="flex items-center gap-3">
						<div className="flex gap-1.5">
							{result.points.map((p, i) => {
								const hasAnalysis = analyses.some((a) => a.point_id === p.id);
								return (
									<button
										type="button"
										key={p.id}
										onClick={() => setCurrentIndex(i)}
										className={`
											w-2 h-2 rounded-full transition-all duration-200
											${
												i === currentIndex
													? "bg-accent w-6"
													: hasAnalysis
														? "bg-green-500"
														: uploadedPointIds.includes(p.id)
															? "bg-accent/50"
															: "bg-border-medium"
											}
										`}
									/>
								);
							})}
						</div>
						<span className="text-xs text-text-muted font-display tabular-nums">
							{currentIndex + 1}/{total}
						</span>
					</div>
				</div>
			</header>

			{/* Main content */}
			<div className="flex-1 flex flex-col lg:flex-row min-h-0">
				{/* Left: Original image + bbox highlight */}
				<div className="lg:flex-1 min-h-0 p-4 lg:p-6 flex items-center justify-center">
					<div className="relative inline-block animate-fade-in-up max-h-full">
						<div className="relative rounded-xl overflow-hidden border border-border-subtle">
							<img
								src={imageUrl}
								alt="Sneaker under inspection"
								className="block max-w-full max-h-[calc(100vh-120px)] object-contain"
							/>

							{/* Current point bbox */}
							<div
								className="absolute border-2 border-accent rounded-md bg-accent/10 animate-bbox-reveal pointer-events-none"
								style={{
									left: `${point.bbox.x1 / 10}%`,
									top: `${point.bbox.y1 / 10}%`,
									width: `${(point.bbox.x2 - point.bbox.x1) / 10}%`,
									height: `${(point.bbox.y2 - point.bbox.y1) / 10}%`,
								}}
							/>

							{/* Markers */}
							{result.points.map((p) => {
								const isCurrent = p.id === point.id;
								const cx = (p.bbox.x1 + p.bbox.x2) / 2 / 10;
								const cy = (p.bbox.y1 + p.bbox.y2) / 2 / 10;
								return (
									<div
										key={p.id}
										className="absolute pointer-events-none"
										style={{
											left: `${cx}%`,
											top: `${cy}%`,
											transform: "translate(-50%, -50%)",
										}}
									>
										<span
											className={`
												flex items-center justify-center w-7 h-7 rounded-full text-xs font-display font-700 shadow-lg
												${
													isCurrent
														? "bg-accent text-surface ring-2 ring-accent/40"
														: "bg-surface-raised/60 text-text-muted border border-border-subtle"
												}
											`}
										>
											{p.id}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Right: Capture guide + Upload + Analysis */}
				<div className="lg:w-[440px] min-h-0 border-t lg:border-t-0 lg:border-l border-border-subtle bg-surface-raised/30 overflow-y-auto">
					<div className="p-5 space-y-5">
						{/* Point info */}
						<div className="animate-fade-in-up">
							<div className="flex items-center gap-3 mb-3">
								<span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-surface text-sm font-display font-700">
									{point.id}
								</span>
								<h3 className="font-display font-700 text-lg text-text-primary">
									{point.label}
								</h3>
							</div>
							<p className="text-text-secondary text-sm leading-relaxed">
								{point.description}
							</p>
						</div>

						{/* Capture guide */}
						<div className="animate-fade-in-up delay-100 rounded-xl border border-accent/20 bg-accent/5 p-4">
							<div className="flex items-start gap-3">
								<svg
									className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
									/>
								</svg>
								<div>
									<p className="font-display font-600 text-sm text-accent-light mb-1">
										Capture Guide
									</p>
									<p className="text-text-secondary text-sm leading-relaxed">
										{point.capture_guide ||
											"Take a close-up photo of this area"}
									</p>
								</div>
							</div>
						</div>

						{/* Upload area */}
						<div className="animate-fade-in-up delay-200">
							{isUploaded ? (
								<div className="space-y-3">
									<div className="relative rounded-xl overflow-hidden border border-accent/30">
										<img
											src={detailImageUrl(sessionId, point.id)}
											alt={`Close-up of ${point.label}`}
											className="w-full max-h-48 object-contain bg-black/20"
										/>
										<div className="absolute top-2 right-2 bg-accent/90 text-surface text-xs font-display font-600 px-2 py-1 rounded-md">
											Captured
										</div>
									</div>
									<button
										type="button"
										onClick={() => inputRef.current?.click()}
										className="w-full text-center text-sm text-text-muted hover:text-text-primary transition-colors py-2"
									>
										Retake
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => inputRef.current?.click()}
									onDrop={handleDrop}
									onDragOver={(e) => {
										e.preventDefault();
										setIsDragOver(true);
									}}
									onDragLeave={() => setIsDragOver(false)}
									className={`group w-full rounded-xl border border-dashed p-8 transition-all duration-200 cursor-pointer ${
										isDragOver
											? "border-accent bg-accent/10"
											: "border-border-medium bg-surface-raised/50 hover:border-accent/40 hover:bg-accent/5"
									}`}
								>
									<div className="flex flex-col items-center gap-3">
										<div
											className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
												isDragOver
													? "bg-accent/15"
													: "bg-surface-overlay group-hover:bg-accent/10"
											}`}
										>
											<svg
												className={`w-6 h-6 transition-colors ${
													isDragOver
														? "text-accent"
														: "text-text-muted group-hover:text-accent"
												}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={1.5}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
												/>
											</svg>
										</div>
										<p className="font-display font-500 text-sm text-text-secondary group-hover:text-text-primary transition-colors">
											{isDragOver
												? "Drop to upload"
												: "Drag & drop or click to select"}
										</p>
									</div>
								</button>
							)}
						</div>

						{/* Analysis loading */}
						{isCurrentAnalyzing && (
							<div className="animate-fade-in-up rounded-xl border border-border-subtle bg-surface-raised p-4">
								<div className="flex items-center gap-3">
									<div className="w-5 h-5 border-2 border-border-medium border-t-accent rounded-full animate-spin flex-shrink-0" />
									<div>
										<p className="font-display font-600 text-sm text-text-primary">
											Analyzing...
										</p>
										<p className="text-text-muted text-xs mt-0.5">
											Comparing with SOP authentication criteria
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Analysis result */}
						{currentAnalysis &&
							!isCurrentAnalyzing &&
							(() => {
								const isAuthentic =
									currentAnalysis.verdict === "authentic_like";
								const isCounterfeit =
									currentAnalysis.verdict === "counterfeit_like";
								const borderColor = isAuthentic
									? "border-green-500/20"
									: isCounterfeit
										? "border-red-500/20"
										: "border-yellow-500/20";
								const bgColor = isAuthentic
									? "bg-green-500/5"
									: isCounterfeit
										? "bg-red-500/5"
										: "bg-yellow-500/5";
								const accentColor = isAuthentic
									? "text-green-400"
									: isCounterfeit
										? "text-red-400"
										: "text-yellow-400";
								const verdictLabel = isAuthentic
									? "AUTHENTIC"
									: isCounterfeit
										? "COUNTERFEIT"
										: "INCONCLUSIVE";
								return (
									<div
										className={`animate-fade-in-up rounded-xl border ${borderColor} ${bgColor} p-4 space-y-3`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<svg
													className={`w-5 h-5 ${accentColor} flex-shrink-0`}
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={1.5}
												>
													{isAuthentic ? (
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
														/>
													) : isCounterfeit ? (
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
														/>
													) : (
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
														/>
													)}
												</svg>
												<p
													className={`font-display font-700 text-sm ${accentColor} uppercase tracking-wide`}
												>
													{verdictLabel}
												</p>
											</div>
											<span
												className={`font-display font-700 text-sm ${accentColor}`}
											>
												{currentAnalysis.confidence}%
											</span>
										</div>

										<div className="space-y-2">
											<div>
												<p className="text-text-muted text-xs font-display font-600 uppercase tracking-wider mb-1">
													Observation
												</p>
												<p className="text-text-secondary text-sm leading-relaxed">
													{currentAnalysis.observation}
												</p>
											</div>
											<div>
												<p className="text-text-muted text-xs font-display font-600 uppercase tracking-wider mb-1">
													Comparison
												</p>
												<p className="text-text-secondary text-sm leading-relaxed">
													{currentAnalysis.comparison}
												</p>
											</div>
											<div>
												<p className="text-text-muted text-xs font-display font-600 uppercase tracking-wider mb-1">
													Reasoning
												</p>
												<p className="text-text-secondary text-sm leading-relaxed">
													{currentAnalysis.reasoning}
												</p>
											</div>
										</div>

										<p className="text-text-muted text-xs">
											Ref: {currentAnalysis.sop_reference}
										</p>
									</div>
								);
							})()}

						{/* Navigation */}
						<div className="flex gap-3 pt-2 animate-fade-in-up delay-300">
							<button
								type="button"
								onClick={handlePrev}
								disabled={currentIndex === 0}
								className="flex-1 px-4 py-3 rounded-xl border border-border-subtle bg-surface-raised text-text-secondary font-display font-500 text-sm hover:bg-surface-overlay hover:text-text-primary transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
							>
								Previous
							</button>
							{isLast ? (
								<button
									type="button"
									onClick={onComplete}
									disabled={!allUploaded}
									className="flex-[2] px-4 py-3 rounded-xl bg-accent text-surface font-display font-700 text-sm hover:bg-accent-light transition-all duration-200 shadow-[0_0_20px_-6px_rgba(208,107,58,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
								>
									Complete
								</button>
							) : (
								<button
									type="button"
									onClick={handleNext}
									className="flex-[2] px-4 py-3 rounded-xl bg-accent text-surface font-display font-700 text-sm hover:bg-accent-light transition-all duration-200 shadow-[0_0_20px_-6px_rgba(208,107,58,0.3)]"
								>
									Next Point
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	);
}
