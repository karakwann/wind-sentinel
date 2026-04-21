from cachetools import TTLCache
from app.config import CACHE_TTL_STATIONS_SEC, CACHE_TTL_GRID_SEC, CACHE_TTL_FORECAST_SEC

_stations_cache: TTLCache = TTLCache(maxsize=1, ttl=CACHE_TTL_STATIONS_SEC)
_grid_cache: TTLCache = TTLCache(maxsize=1, ttl=CACHE_TTL_GRID_SEC)
_forecast_cache: TTLCache = TTLCache(maxsize=200, ttl=CACHE_TTL_FORECAST_SEC)


def get_stations_cache() -> dict | None:
    return _stations_cache.get("STATIONS")


def set_stations_cache(data: dict) -> None:
    _stations_cache["STATIONS"] = data


def get_grid_cache() -> list | None:
    return _grid_cache.get("GRID")


def set_grid_cache(data: list) -> None:
    _grid_cache["GRID"] = data


def get_forecast_cache(station_id: str) -> dict | None:
    return _forecast_cache.get(f"FORECAST_{station_id}")


def set_forecast_cache(station_id: str, data: dict) -> None:
    _forecast_cache[f"FORECAST_{station_id}"] = data
