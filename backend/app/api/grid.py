from fastapi import APIRouter

from app.services import cache_service

router = APIRouter()


@router.get("/grid")
async def get_grid():
    cached = cache_service.get_grid_cache()
    if cached:
        return cached
    # Cache vide (démarrage ou grille en cours de chargement) : tableau vide valide
    return []
