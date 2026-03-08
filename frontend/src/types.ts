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
