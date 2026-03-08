interface LoadingScreenProps {
	imageUrl: string;
}

export function LoadingScreen({ imageUrl }: LoadingScreenProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
			<div className="relative max-w-lg w-full space-y-10">
				{/* Image with scanning effect */}
				<div className="animate-fade-in-up">
					<div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised">
						<img
							src={imageUrl}
							alt="解析中のスニーカー"
							className="w-full max-h-[50vh] object-contain bg-black/30"
						/>

						{/* Scanning overlay */}
						<div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-accent/5 animate-pulse-glow" />

						{/* Scanning line */}
						<div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-line shadow-[0_0_15px_2px_rgba(201,160,68,0.3)]" />

						{/* Corner brackets */}
						<div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-accent/60 rounded-tl-sm" />
						<div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-accent/60 rounded-tr-sm" />
						<div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-accent/60 rounded-bl-sm" />
						<div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-accent/60 rounded-br-sm" />

						{/* vignette */}
						<div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]" />
					</div>
				</div>

				{/* Status text */}
				<div className="text-center space-y-3 animate-fade-in-up delay-200">
					<div className="inline-flex items-center gap-3">
						<div className="flex gap-1">
							<span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
							<span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
							<span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
						</div>
						<p className="font-display text-lg font-600 text-text-primary tracking-tight">
							鑑定ガイドを作成中
						</p>
					</div>
					<p className="text-text-muted text-sm">
						AIが画像を解析し、鑑定ポイントを特定しています
					</p>
				</div>
			</div>
		</div>
	);
}
