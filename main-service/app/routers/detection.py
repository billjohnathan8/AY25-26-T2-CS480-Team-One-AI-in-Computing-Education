from fastapi import APIRouter
from pydantic import BaseModel

from ..services.detector_service import detector

router = APIRouter(prefix="/api/detect", tags=["detection"])


class DetectRequest(BaseModel):
    text: str


class DetectResponse(BaseModel):
    prob_ai: float
    label: str


@router.post("", response_model=DetectResponse)
def detect(req: DetectRequest) -> DetectResponse:
    result = detector.predict(req.text)
    return DetectResponse(prob_ai=float(result["prob_ai"]), label=str(result["label"]))
