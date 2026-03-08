import { queryOptions } from "@tanstack/react-query";
import { fetchDetailStatus, fetchSession, fetchSessions } from "./client";

export const sessionsQueryOptions = () =>
	queryOptions({
		queryKey: ["sessions"],
		queryFn: fetchSessions,
	});

export const sessionQueryOptions = (sessionId: string) =>
	queryOptions({
		queryKey: ["sessions", sessionId],
		queryFn: () => fetchSession(sessionId),
	});

export const detailStatusQueryOptions = (sessionId: string) =>
	queryOptions({
		queryKey: ["sessions", sessionId, "details"],
		queryFn: () => fetchDetailStatus(sessionId),
	});
