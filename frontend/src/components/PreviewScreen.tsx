import type { ReferenceImage } from "@/api/client";

interface PreviewScreenProps {
	imageUrl: string;
	shoeName: string;
	referenceImages?: ReferenceImage[];
	onStart: () => void;
	onReselect: () => void;
	error?: string;
}

export function PreviewScreen({
	imageUrl,
	shoeName,
	referenceImages = [],
	onStart,
	onReselect,
	error,
}: PreviewScreenProps) {
	const authRef = referenceImages[0];
	const similarRefs = referenceImages.slice(1);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
			{/* Background glow */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/4 rounded-full blur-[100px]" />
			</div>

			<div className="relative max-w-5xl w-full space-y-8">
				{/* Header */}
				<div className="text-center animate-fade-in-up">
					<p className="text-accent font-display text-sm tracking-[0.3em] uppercase mb-2">
						Identified
					</p>
					<h2 className="font-display text-2xl font-700 tracking-tight">
						Is this your sneaker?
					</h2>
				</div>

				{/* Shoe name badge */}
				<div className="flex items-center justify-center animate-fade-in-up delay-75">
					<div className="inline-flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/5 px-5 py-3">
						<svg
							className="w-5 h-5 text-accent flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
						<span className="font-display font-700 text-lg text-text-primary tracking-tight">
							{shoeName}
						</span>
					</div>
				</div>

				{/* Two-column: uploaded image (left) + reference (right) */}
				<div className="animate-fade-in-up delay-100 grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Left: uploaded image */}
					<div className="space-y-2">
						<p className="text-text-muted font-display text-xs tracking-[0.15em] uppercase">
							Your Photo
						</p>
						<div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised">
							<img
								src={imageUrl}
								alt={shoeName}
								className="w-full aspect-[4/3] object-contain bg-black/30"
							/>
							<div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.3)]" />
						</div>
					</div>

					{/* Right: auth reference (large) + similar (small) */}
					{authRef && (
						<div className="space-y-3">
							{/* Auth reference - large */}
							<div className="space-y-2">
								<p className="text-text-muted font-display text-xs tracking-[0.15em] uppercase">
									Best Match
								</p>
								<div className="relative rounded-2xl overflow-hidden border border-accent/20 bg-surface-raised">
									<img
										src={authRef.url}
										alt={authRef.label}
										className="w-full aspect-[4/3] object-cover bg-black/20"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
									<div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
										<span className="text-xs font-display font-500 text-white/90">
											{authRef.label}
										</span>
									</div>
								</div>
							</div>

							{/* Similar refs - small row */}
							{similarRefs.length > 0 && (
								<div className="space-y-2">
									<p className="text-text-muted font-display text-[10px] tracking-[0.15em] uppercase">
										Similar Models
									</p>
									<div className="grid grid-cols-2 gap-2">
										{similarRefs.map((ref) => (
											<div
												key={ref.url}
												className="relative rounded-xl overflow-hidden border border-border-subtle bg-surface-raised hover:border-border-medium transition-all duration-200"
											>
												<img
													src={ref.url}
													alt={ref.label}
													className="w-full aspect-[4/3] object-cover bg-black/20"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
												<div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
													<span className="text-[10px] font-display font-500 text-white/80 leading-tight">
														{ref.label}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Error message */}
				{error && (
					<div className="animate-fade-in-up rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-center">
						<p className="text-red-400 text-sm">{error}</p>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-3 animate-fade-in-up delay-200 max-w-md mx-auto w-full">
					<button
						type="button"
						onClick={onReselect}
						className="flex-1 px-6 py-3.5 rounded-xl border border-border-subtle bg-surface-raised text-text-secondary font-display font-500 text-sm tracking-wide hover:bg-surface-overlay hover:border-border-medium hover:text-text-primary transition-all duration-200"
					>
						Choose Another
					</button>
					<button
						type="button"
						onClick={onStart}
						className="flex-[2] px-6 py-3.5 rounded-xl bg-accent text-surface font-display font-700 text-sm tracking-wide hover:bg-accent-light transition-all duration-200 shadow-[0_0_30px_-8px_rgba(208,107,58,0.4)] hover:shadow-[0_0_40px_-8px_rgba(208,107,58,0.6)]"
					>
						Start Inspection
					</button>
				</div>
			</div>
		</div>
	);
}
