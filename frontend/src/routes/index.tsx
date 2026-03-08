import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createSession } from "@/api/client";
import { UploadScreen } from "@/components/UploadScreen";

export const Route = createFileRoute("/")({
	component: UploadPage,
});

function UploadPage() {
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: createSession,
		onSuccess: ({ session_id }) => {
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
		</div>
	);
}
