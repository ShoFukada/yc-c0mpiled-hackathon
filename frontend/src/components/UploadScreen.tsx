import { useCallback, useRef, useState } from "react";

interface UploadScreenProps {
	onUpload: (file: File) => void;
	isPending?: boolean;
}

export function UploadScreen({ onUpload, isPending }: UploadScreenProps) {
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

	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-6">
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
			</div>

			<div className="relative max-w-lg w-full space-y-10 text-center">
				<div className="animate-fade-in-up">
					<p className="text-accent font-display text-sm tracking-[0.3em] uppercase mb-3">
						Sneaker Authentication
					</p>
					<h1 className="font-display text-5xl font-800 tracking-tight leading-tight">
						AuthentiFlow
					</h1>
					<p className="mt-4 text-text-secondary text-base leading-relaxed">
						Upload a sneaker photo and
						<br />
						AI will guide you through inspection points
					</p>
				</div>

				<div className="animate-fade-in-up delay-200">
					<button
						type="button"
						disabled={isPending}
						onClick={() => inputRef.current?.click()}
						onDrop={handleDrop}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragOver(true);
						}}
						onDragLeave={() => setIsDragOver(false)}
						className={`
							group w-full rounded-2xl border p-14 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait
							${
								isDragOver
									? "border-accent bg-accent/5 shadow-[0_0_60px_-12px_rgba(208,107,58,0.3)]"
									: "border-border-subtle bg-surface-raised hover:border-border-medium hover:bg-surface-overlay hover:shadow-[0_0_60px_-12px_rgba(208,107,58,0.1)]"
							}
						`}
					>
						<div className="flex flex-col items-center gap-5">
							<div
								className={`
								w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300
								${isDragOver ? "bg-accent/15" : "bg-surface-overlay group-hover:bg-accent/10"}
							`}
							>
								{isPending ? (
									<div className="w-6 h-6 border-2 border-text-muted border-t-accent rounded-full animate-spin" />
								) : (
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
								)}
							</div>

							<div>
								<p className="text-text-primary font-display font-600 text-base">
									{isPending ? "Uploading..." : "Drag & Drop Your Photo"}
								</p>
								{!isPending && (
									<p className="text-text-muted text-sm mt-1.5">
										or click to select a file
									</p>
								)}
							</div>

							{!isPending && (
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
									<span>One side-view photo recommended</span>
								</div>
							)}
						</div>
					</button>
				</div>

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					capture="environment"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleFile(file);
					}}
					className="hidden"
				/>
			</div>
		</div>
	);
}
