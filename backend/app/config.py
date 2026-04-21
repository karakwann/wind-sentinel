from dataclasses import dataclass

FRANCE_BOUNDS = {
    "lat_min": 41.0,
    "lat_max": 51.5,
    "lon_min": -5.5,
    "lon_max": 10.0,
}

GRID_RESOLUTION_DEG = 1.0
GRID_POINTS_LAT = int((FRANCE_BOUNDS["lat_max"] - FRANCE_BOUNDS["lat_min"]) / GRID_RESOLUTION_DEG) + 1
GRID_POINTS_LON = int((FRANCE_BOUNDS["lon_max"] - FRANCE_BOUNDS["lon_min"]) / GRID_RESOLUTION_DEG) + 1

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_MODEL = "meteofrance_arome_france"
OPEN_METEO_BATCH_SIZE = 200

SYNOP_BASE_URL = "https://object.files.data.gouv.fr/meteofrance/data/synop"
SYNOP_STATIONS_META_URL = f"{SYNOP_BASE_URL}/postesSynop.csv"
SYNOP_DELAY_MINUTES = 60
SYNOP_MAX_AGE_MINUTES = 90

CACHE_TTL_STATIONS_SEC = 300
CACHE_TTL_GRID_SEC = 600
CACHE_TTL_FORECAST_SEC = 1800

AUTO_REFRESH_INTERVAL_SEC = 300

HOST = "0.0.0.0"
PORT = 8001

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
