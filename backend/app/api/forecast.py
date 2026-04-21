from fastapi import APIRouter, HTTPException, Query

from app.services import openmeteo_service, cache_service, synop_service

router = APIRouter()


@router.get("/forecast")
async def get_forecast(
    station_id: str = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    hours: int = Query(48, ge=1, le=168),
):
    cached = cache_service.get_forecast_cache(station_id)
    if cached:
        return cached

    try:
        data = await openmeteo_service.fetch_forecast(station_id, lat, lon, hours)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Impossible de récupérer les prévisions : {e}")

    cache_service.set_forecast_cache(station_id, data)
    return data
