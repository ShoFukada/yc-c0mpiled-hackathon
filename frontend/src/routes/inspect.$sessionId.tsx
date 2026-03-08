import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	identifyShoe,
	type ReferenceImage,
	runInspect,
	sessionImageUrl,
} from "@/api/client";
import { sessionQueryOptions } from "@/api/queries";
import { IdentifyingScreen } from "@/components/IdentifyingScreen";
import { InspectionGuide } from "@/components/InspectionGuide";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PreviewScreen } from "@/components/PreviewScreen";

export const Route = createFileRoute("/inspect/$sessionId")({
	component: InspectPage,
});

function InspectPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: session, isLoading } = useQuery(sessionQueryOptions(sessionId));
	const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

	const imageUrl = sessionImageUrl(sessionId);

	const identifyMutation = useMutation({
		mutationFn: () => identifyShoe(sessionId),
		onSuccess: (data) => {
			setReferenceImages(data.reference_images);
			queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] });
		},
	});

	const inspectMutation = useMutation({
		mutationFn: () => runInspect(sessionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] });
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-2 border-border-medium border-t-accent rounded-full animate-spin" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-text-muted">Session not found</p>
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="text-accent hover:text-accent-light font-display font-500 text-sm"
				>
					Back to Home
				</button>
			</div>
		);
	}

	// Has inspection result
	if (session.result) {
		return (
			<InspectionGuide
				imageUrl={imageUrl}
				result={session.result}
				onReset={() => navigate({ to: "/" })}
				onGoToCapture={() =>
					navigate({ to: "/capture/$sessionId", params: { sessionId } })
				}
			/>
		);
	}

	// Inspection running
	if (inspectMutation.isPending) {
		return <LoadingScreen imageUrl={imageUrl} />;
	}

	// Shoe identified → show confirmation
	if (session.identified_shoe) {
		return (
			<PreviewScreen
				imageUrl={imageUrl}
				shoeName={session.identified_shoe}
				referenceImages={referenceImages}
				onStart={() => inspectMutation.mutate()}
				onReselect={() => navigate({ to: "/" })}
				error={
					inspectMutation.isError ? inspectMutation.error.message : undefined
				}
			/>
		);
	}

	// Identifying in progress
	if (identifyMutation.isPending) {
		return <IdentifyingScreen imageUrl={imageUrl} />;
	}

	// Not yet identified → auto-trigger identification
	if (!identifyMutation.isSuccess && !identifyMutation.isError) {
		identifyMutation.mutate();
		return <IdentifyingScreen imageUrl={imageUrl} />;
	}

	// Identification error fallback
	return (
		<PreviewScreen
			imageUrl={imageUrl}
			shoeName="Unknown Sneaker"
			onStart={() => inspectMutation.mutate()}
			onReselect={() => navigate({ to: "/" })}
			error={
				identifyMutation.isError ? identifyMutation.error.message : undefined
			}
		/>
	);
}
