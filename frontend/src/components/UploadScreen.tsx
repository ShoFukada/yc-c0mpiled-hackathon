import { useCallback, useRef, useState } from "react";

interface UploadScreenProps {
	onUpload: (file: File) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(file: File) => {
			if (file.type.startsWith("image/")) {
				onUpload(file);
			}
		},
		[onUpload],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragOver(false);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-6">
			{/* Background ambient glow */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
			</div>

			<div className="relative max-w-lg w-full space-y-10 text-center">
				{/* Brand */}
				<div className="animate-fade-in-up">
					<p className="text-accent font-display text-sm tracking-[0.3em] uppercase mb-3">
						Sneaker Authentication
					</p>
					<h1 className="font-display text-5xl font-800 tracking-tight leading-tight">
						LEGIT CHECK
					</h1>
					<p className="mt-4 text-text-secondary text-base leading-relaxed">
						スニーカーの写真をアップロードして
						<br />
						AIが鑑定ポイントをガイドします
					</p>
				</div>

				{/* Upload area */}
				<div className="animate-fade-in-up delay-200">
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						className={`
							group w-full rounded-2xl border p-14 transition-all duration-300 cursor-pointer
							${
								isDragOver
									? "border-accent bg-accent/5 shadow-[0_0_60px_-12px_rgba(201,160,68,0.3)]"
									: "border-border-subtle bg-surface-raised hover:border-border-medium hover:bg-surface-overlay hover:shadow-[0_0_60px_-12px_rgba(201,160,68,0.1)]"
							}
						`}
					>
						<div className="flex flex-col items-center gap-5">
							{/* Icon */}
							<div
								className={`
								w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300
								${isDragOver ? "bg-accent/15" : "bg-surface-overlay group-hover:bg-accent/10"}
							`}
							>
								<svg
									className={`w-6 h-6 transition-colors duration-300 ${isDragOver ? "text-accent" : "text-text-muted group-hover:text-accent-dim"}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
									/>
								</svg>
							</div>

							<div>
								<p className="text-text-primary font-display font-600 text-base">
									写真をドラッグ&ドロップ
								</p>
								<p className="text-text-muted text-sm mt-1.5">
									またはクリックしてファイルを選択
								</p>
							</div>

							<div className="flex items-center gap-2 text-text-muted text-xs">
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
									/>
								</svg>
								<span>横からの写真1枚を推奨</span>
							</div>
						</div>
					</button>
				</div>

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					capture="environment"
					onChange={handleInputChange}
					className="hidden"
				/>
			</div>
		</div>
	);
}
