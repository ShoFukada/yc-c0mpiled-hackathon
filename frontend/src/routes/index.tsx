import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createSession, sessionImageUrl } from "@/api/client";
import { sessionsQueryOptions } from "@/api/queries";
import { UploadScreen } from "@/components/UploadScreen";

export const Route = createFileRoute("/")({
	component: UploadPage,
});

function UploadPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: sessions } = useQuery(sessionsQueryOptions());

	const mutation = useMutation({
		mutationFn: createSession,
		onSuccess: ({ session_id }) => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			navigate({
				to: "/inspect/$sessionId",
				params: { sessionId: session_id },
			});
		},
	});

	return (
		<div>
			{mutation.isError && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg text-sm">
					{mutation.error.message}
				</div>
			)}
			<UploadScreen
				onUpload={(file) => mutation.mutate(file)}
				isPending={mutation.isPending}
			/>

			{/* Session History */}
			{sessions && sessions.length > 0 && (
				<div className="max-w-lg mx-auto px-6 pb-16 -mt-4">
					<div className="border-t border-border-subtle pt-8">
						<p className="text-text-muted text-xs font-display font-600 uppercase tracking-wider mb-4">
							Recent Sessions
						</p>
						<div className="space-y-2">
							{sessions.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() =>
										navigate({
											to: s.has_result
												? "/capture/$sessionId"
												: "/inspect/$sessionId",
											params: { sessionId: s.id },
										})
									}
									className="group w-full flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface-raised/50 hover:bg-surface-overlay hover:border-border-medium transition-all duration-200 text-left"
								>
									<div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-overlay flex-shrink-0">
										<img
											src={sessionImageUrl(s.id)}
											alt=""
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-text-primary text-sm font-display font-600 truncate">
											{s.identified_shoe || "Unidentified"}
										</p>
										<p className="text-text-muted text-xs mt-0.5">
											{new Date(s.created_at).toLocaleString()}
										</p>
									</div>
									<div className="flex items-center gap-2 flex-shrink-0">
										{s.has_result ? (
											<span className="text-xs font-display font-500 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
												Inspected
											</span>
										) : (
											<span className="text-xs font-display font-500 text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md">
												Pending
											</span>
										)}
										<svg
											className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={1.5}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="m8.25 4.5 7.5 7.5-7.5 7.5"
											/>
										</svg>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
