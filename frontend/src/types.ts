export interface BBox {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface InspectionPoint {
	id: number;
	label: string;
	description: string;
	capture_guide: string;
	bbox: BBox;
}

export interface InspectionResult {
	points: InspectionPoint[];
}

export interface PointAnalysis {
	point_id: number;
	verdict: string;
	observation: string;
	comparison: string;
	confidence: number;
	reasoning: string;
	sop_reference: string;
}
