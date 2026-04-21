from fastapi import APIRouter, HTTPException, Query
from app.services import openmeteo_service, cache_service

router = APIRouter()


@router.get("/history")
async def get_history(
    station_id: str = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
):
    cached = cache_service.get_forecast_cache(f"hist_{station_id}")
    if cached:
        return cached

    try:
        data = await openmeteo_service.fetch_history(station_id, lat, lon)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Impossible de récupérer l'historique : {e}")

    cache_service.set_forecast_cache(f"hist_{station_id}", data)
    return data
