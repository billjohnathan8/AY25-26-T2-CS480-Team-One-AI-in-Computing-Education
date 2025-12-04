from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import crud
from ..cache import cache_get, cache_set
from ..database import get_session
from ..schemas import AnalyticsByTopic, AnalyticsOverview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def overview(session: Session = Depends(get_session)) -> AnalyticsOverview:
    cached = await cache_get("analytics:overview")
    if cached:
        return AnalyticsOverview.parse_obj(cached)
    overview = crud.analytics_overview(session)
    await cache_set("analytics:overview", overview.dict(), ttl_seconds=120)
    return overview


@router.get("/topics", response_model=list[AnalyticsByTopic])
def topics(session: Session = Depends(get_session)) -> list[AnalyticsByTopic]:
    return crud.analytics_by_topic(session)
