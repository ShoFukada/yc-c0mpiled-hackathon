from pydantic import BaseModel


class BBox(BaseModel):
    """バウンディングボックス（0-1000正規化座標）"""

    x1: float
    y1: float
    x2: float
    y2: float


class InspectionPoint(BaseModel):
    """鑑定ポイント1件"""

    id: int
    label: str
    description: str
    bbox: BBox


class InspectionResult(BaseModel):
    """鑑定結果"""

    points: list[InspectionPoint]
