import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { InspectionGuide } from "@/components/InspectionGuide";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PreviewScreen } from "@/components/PreviewScreen";
import { UploadScreen } from "@/components/UploadScreen";
import type { InspectionResult } from "@/types";

export const Route = createFileRoute("/")({
	component: HomePage,
});

type Screen = "upload" | "preview" | "loading" | "result";

function HomePage() {
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [screen, setScreen] = useState<Screen>("upload");

	const imageUrl = useMemo(
		() => (uploadedFile ? URL.createObjectURL(uploadedFile) : null),
		[uploadedFile],
	);

	const inspectMutation = useMutation({
		mutationFn: async (file: File): Promise<InspectionResult> => {
			const formData = new FormData();
			formData.append("image", file);
			const res = await fetch("/api/inspect", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("鑑定に失敗しました");
			return res.json();
		},
		onSuccess: () => setScreen("result"),
		onError: () => setScreen("preview"),
	});

	const handleUpload = useCallback((file: File) => {
		setUploadedFile(file);
		setScreen("preview");
	}, []);

	const handleStartInspection = useCallback(() => {
		if (!uploadedFile) return;
		setScreen("loading");
		inspectMutation.mutate(uploadedFile);
	}, [uploadedFile, inspectMutation]);

	const handleReset = useCallback(() => {
		setUploadedFile(null);
		setScreen("upload");
		inspectMutation.reset();
	}, [inspectMutation]);

	const handleReselect = useCallback(() => {
		setUploadedFile(null);
		setScreen("upload");
	}, []);

	if (screen === "result" && inspectMutation.data && imageUrl) {
		return (
			<InspectionGuide
				imageUrl={imageUrl}
				result={inspectMutation.data}
				onReset={handleReset}
			/>
		);
	}

	if (screen === "loading" && imageUrl) {
		return <LoadingScreen imageUrl={imageUrl} />;
	}

	if (screen === "preview" && imageUrl) {
		return (
			<PreviewScreen
				imageUrl={imageUrl}
				onStart={handleStartInspection}
				onReselect={handleReselect}
				error={
					inspectMutation.isError ? inspectMutation.error.message : undefined
				}
			/>
		);
	}

	return <UploadScreen onUpload={handleUpload} />;
}
