import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import CORS_ORIGINS, AUTO_REFRESH_INTERVAL_SEC
from app.api import stations, grid, forecast, history
from app.services import synop_service, openmeteo_service, cache_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Wind-Sentinel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(stations.router, prefix="/api")
app.include_router(grid.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(history.router, prefix="/api")


async def _refresh_cache():
    logger.info("Rafraîchissement du cache stations + grille...")
    try:
        data = await synop_service.fetch_stations()
        from datetime import datetime, timezone
        cache_service.set_stations_cache({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stations": data,
            "count": len(data),
        })
        logger.info(f"Stations mises à jour : {len(data)} stations")
    except Exception as e:
        logger.warning(f"Erreur refresh stations : {e}")

    try:
        grid_data = await openmeteo_service.fetch_grid_data()
        cache_service.set_grid_cache(grid_data)
        logger.info("Grille vent mise à jour")
    except Exception as e:
        logger.warning(f"Erreur refresh grille : {e}")


@app.on_event("startup")
async def startup():
    asyncio.create_task(_refresh_cache())

    scheduler = AsyncIOScheduler()
    scheduler.add_job(_refresh_cache, "interval", seconds=AUTO_REFRESH_INTERVAL_SEC)
    scheduler.start()
    logger.info(f"Scheduler démarré — refresh toutes les {AUTO_REFRESH_INTERVAL_SEC}s")


@app.get("/health")
async def health():
    return {"status": "ok"}
