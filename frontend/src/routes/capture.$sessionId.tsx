import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { sessionImageUrl, uploadDetail } from "@/api/client";
import { detailStatusQueryOptions, sessionQueryOptions } from "@/api/queries";
import { GuidedCapture } from "@/components/GuidedCapture";

export const Route = createFileRoute("/capture/$sessionId")({
	component: CapturePage,
});

function CapturePage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: session, isLoading: sessionLoading } = useQuery(
		sessionQueryOptions(sessionId),
	);
	const { data: detailStatus } = useQuery(detailStatusQueryOptions(sessionId));

	const imageUrl = sessionImageUrl(sessionId);

	const uploadMutation = useMutation({
		mutationFn: ({ pointId, file }: { pointId: number; file: File }) =>
			uploadDetail(sessionId, pointId, file),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["sessions", sessionId, "details"],
			});
		},
	});

	if (sessionLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-2 border-border-medium border-t-accent rounded-full animate-spin" />
			</div>
		);
	}

	if (!session?.result) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-text-muted">Please run inspection first</p>
				<button
					type="button"
					onClick={() =>
						navigate({
							to: "/inspect/$sessionId",
							params: { sessionId },
						})
					}
					className="text-accent hover:text-accent-light font-display font-500 text-sm"
				>
					Go to Inspection
				</button>
			</div>
		);
	}

	return (
		<GuidedCapture
			sessionId={sessionId}
			imageUrl={imageUrl}
			result={session.result}
			uploadedPointIds={detailStatus?.uploaded_point_ids ?? []}
			onUploadDetail={(pointId, file) =>
				uploadMutation.mutate({ pointId, file })
			}
			onBack={() =>
				navigate({
					to: "/inspect/$sessionId",
					params: { sessionId },
				})
			}
			onComplete={() =>
				navigate({
					to: "/inspect/$sessionId",
					params: { sessionId },
				})
			}
		/>
	);
}
