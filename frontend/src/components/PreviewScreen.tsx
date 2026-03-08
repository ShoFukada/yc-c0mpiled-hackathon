interface PreviewScreenProps {
	imageUrl: string;
	onStart: () => void;
	onReselect: () => void;
	error?: string;
}

export function PreviewScreen({
	imageUrl,
	onStart,
	onReselect,
	error,
}: PreviewScreenProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
			{/* Background glow */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/4 rounded-full blur-[100px]" />
			</div>

			<div className="relative max-w-xl w-full space-y-8">
				{/* Header */}
				<div className="text-center animate-fade-in-up">
					<p className="text-accent font-display text-sm tracking-[0.3em] uppercase mb-2">
						Preview
					</p>
					<h2 className="font-display text-2xl font-700 tracking-tight">
						この画像で鑑定しますか？
					</h2>
				</div>

				{/* Image preview */}
				<div className="animate-fade-in-up delay-100">
					<div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised">
						<img
							src={imageUrl}
							alt="アップロードされたスニーカー"
							className="w-full max-h-[50vh] object-contain bg-black/30"
						/>
						{/* subtle vignette */}
						<div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.3)]" />
					</div>
				</div>

				{/* Error message */}
				{error && (
					<div className="animate-fade-in-up rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-center">
						<p className="text-red-400 text-sm">{error}</p>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-3 animate-fade-in-up delay-200">
					<button
						type="button"
						onClick={onReselect}
						className="flex-1 px-6 py-3.5 rounded-xl border border-border-subtle bg-surface-raised text-text-secondary font-display font-500 text-sm tracking-wide hover:bg-surface-overlay hover:border-border-medium hover:text-text-primary transition-all duration-200"
					>
						選び直す
					</button>
					<button
						type="button"
						onClick={onStart}
						className="flex-[2] px-6 py-3.5 rounded-xl bg-accent text-surface font-display font-700 text-sm tracking-wide hover:bg-accent-light transition-all duration-200 shadow-[0_0_30px_-8px_rgba(201,160,68,0.4)] hover:shadow-[0_0_40px_-8px_rgba(201,160,68,0.6)]"
					>
						鑑定を開始する
					</button>
				</div>
			</div>
		</div>
	);
}
