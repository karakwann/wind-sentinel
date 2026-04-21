from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.services import synop_service, cache_service

router = APIRouter()


@router.get("/stations")
async def get_stations():
    cached = cache_service.get_stations_cache()
    if cached:
        return cached

    try:
        stations = await synop_service.fetch_stations()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Impossible de récupérer les données SYNOP : {e}")

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stations": stations,
        "count": len(stations),
    }
    cache_service.set_stations_cache(result)
    return result
