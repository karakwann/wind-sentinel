from fastapi import APIRouter, HTTPException

from app.services import openmeteo_service, cache_service

router = APIRouter()


@router.get("/grid")
async def get_grid():
    cached = cache_service.get_grid_cache()
    if cached:
        return cached

    try:
        grid = await openmeteo_service.fetch_grid_data()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Impossible de récupérer la grille vent : {e}")

    cache_service.set_grid_cache(grid)
    return grid
