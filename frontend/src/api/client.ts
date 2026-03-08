import type { InspectionResult, PointAnalysis } from "@/types";

export interface Session {
	id: string;
	mime_type: string;
	identified_shoe: string | null;
	result: InspectionResult | null;
	created_at: string;
}

export interface DetailStatus {
	uploaded_point_ids: number[];
	analyses: PointAnalysis[];
}

export interface SessionSummary {
	id: string;
	mime_type: string;
	identified_shoe: string | null;
	has_result: boolean;
	created_at: string;
}

export async function fetchSessions(): Promise<SessionSummary[]> {
	const res = await fetch("/api/sessions");
	if (!res.ok) throw new Error("Failed to fetch sessions");
	return res.json();
}

export async function createSession(
	file: File,
): Promise<{ session_id: string }> {
	const form = new FormData();
	form.append("image", file);
	const res = await fetch("/api/sessions", { method: "POST", body: form });
	if (!res.ok) throw new Error("Failed to create session");
	return res.json();
}

export async function fetchSession(sessionId: string): Promise<Session> {
	const res = await fetch(`/api/sessions/${sessionId}`);
	if (!res.ok) throw new Error("Session not found");
	return res.json();
}

export interface ReferenceImage {
	url: string;
	label: string;
}

export interface IdentifyResult {
	name: string;
	reference_images: ReferenceImage[];
}

export async function identifyShoe(sessionId: string): Promise<IdentifyResult> {
	const res = await fetch(`/api/sessions/${sessionId}/identify`, {
		method: "POST",
	});
	if (!res.ok) throw new Error("Failed to identify shoe");
	return res.json();
}

export async function runInspect(sessionId: string): Promise<InspectionResult> {
	const res = await fetch(`/api/sessions/${sessionId}/inspect`, {
		method: "POST",
	});
	if (!res.ok) throw new Error("Inspection failed");
	return res.json();
}

export async function fetchDetailStatus(
	sessionId: string,
): Promise<DetailStatus> {
	const res = await fetch(`/api/sessions/${sessionId}/details`);
	if (!res.ok) throw new Error("Failed to fetch detail status");
	return res.json();
}

export async function uploadDetail(
	sessionId: string,
	pointId: number,
	file: File,
): Promise<void> {
	const form = new FormData();
	form.append("image", file);
	const res = await fetch(`/api/sessions/${sessionId}/details/${pointId}`, {
		method: "POST",
		body: form,
	});
	if (!res.ok) throw new Error("Failed to upload detail image");
}

export async function analyzeDetail(
	sessionId: string,
	pointId: number,
): Promise<PointAnalysis> {
	const res = await fetch(
		`/api/sessions/${sessionId}/details/${pointId}/analyze`,
		{ method: "POST" },
	);
	if (!res.ok) throw new Error("Failed to analyze detail");
	return res.json();
}

export function sessionImageUrl(sessionId: string): string {
	return `/api/sessions/${sessionId}/image`;
}

export function detailImageUrl(sessionId: string, pointId: number): string {
	return `/api/sessions/${sessionId}/details/${pointId}/image`;
}
