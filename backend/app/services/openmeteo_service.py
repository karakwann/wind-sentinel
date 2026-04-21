import asyncio
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import (
    FRANCE_BOUNDS,
    GRID_RESOLUTION_DEG,
    GRID_POINTS_LAT,
    GRID_POINTS_LON,
    OPEN_METEO_BASE_URL,
    OPEN_METEO_MODEL,
    OPEN_METEO_BATCH_SIZE,
)
from app.core.units import speed_direction_to_uv


def _build_grid_points() -> list[tuple[float, float]]:
    points = []
    lat = FRANCE_BOUNDS["lat_min"]
    while lat <= FRANCE_BOUNDS["lat_max"] + 1e-9:
        lon = FRANCE_BOUNDS["lon_min"]
        while lon <= FRANCE_BOUNDS["lon_max"] + 1e-9:
            points.append((round(lat, 4), round(lon, 4)))
            lon += GRID_RESOLUTION_DEG
        lat += GRID_RESOLUTION_DEG
    return points


async def fetch_grid_data() -> list[dict[str, Any]]:
    points = _build_grid_points()
    results: dict[tuple[float, float], dict] = {}

    async with httpx.AsyncClient(timeout=60) as client:
        for i in range(0, len(points), OPEN_METEO_BATCH_SIZE):
            batch = points[i : i + OPEN_METEO_BATCH_SIZE]
            lats = [p[0] for p in batch]
            lons = [p[1] for p in batch]

            params = {
                "latitude": ",".join(str(x) for x in lats),
                "longitude": ",".join(str(x) for x in lons),
                "current": "wind_speed_10m,wind_direction_10m",
                "models": OPEN_METEO_MODEL,
                "wind_speed_unit": "ms",
            }
            for attempt in range(3):
                resp = await client.get(OPEN_METEO_BASE_URL, params=params)
                if resp.status_code != 429:
                    break
                await asyncio.sleep(5 * (attempt + 1))
            resp.raise_for_status()
            data = resp.json()
            if i + OPEN_METEO_BATCH_SIZE < len(points):
                await asyncio.sleep(1.0)

            # API retourne une liste si plusieurs points, un dict si un seul
            if isinstance(data, dict):
                data = [data]

            for j, item in enumerate(data):
                lat_pt = batch[j][0]
                lon_pt = batch[j][1]
                current = item.get("current", {})
                speed = current.get("wind_speed_10m", 0.0) or 0.0
                direction = current.get("wind_direction_10m", 0.0) or 0.0
                results[(lat_pt, lon_pt)] = {"speed": speed, "direction": direction}

    # Construire la grille ordonnée (row-major : lat décroissante, lon croissante)
    lats_unique = sorted(set(p[0] for p in points), reverse=True)
    lons_unique = sorted(set(p[1] for p in points))
    nx = len(lons_unique)
    ny = len(lats_unique)
    dx = GRID_RESOLUTION_DEG
    dy = GRID_RESOLUTION_DEG

    u_data = []
    v_data = []
    for lat in lats_unique:
        for lon in lons_unique:
            pt = results.get((lat, lon))
            if pt:
                u, v = speed_direction_to_uv(pt["speed"], pt["direction"])
            else:
                u, v = 0.0, 0.0
            u_data.append(round(u, 4))
            v_data.append(round(v, 4))

    ref_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00:00Z")

    base_header = {
        "discipline": 0,
        "parameterCategory": 2,
        "surface1Type": 103,
        "surface1Value": 10.0,
        "lo1": FRANCE_BOUNDS["lon_min"],
        "la1": FRANCE_BOUNDS["lat_max"],
        "lo2": FRANCE_BOUNDS["lon_max"],
        "la2": FRANCE_BOUNDS["lat_min"],
        "dx": dx,
        "dy": dy,
        "nx": nx,
        "ny": ny,
        "refTime": ref_time,
    }

    return [
        {"header": {**base_header, "parameterNumber": 2}, "data": u_data},  # U
        {"header": {**base_header, "parameterNumber": 3}, "data": v_data},  # V
    ]


async def fetch_history(station_id: str, lat: float, lon: float) -> dict[str, Any]:
    """Retourne les 24 dernières heures d'observations pour une station."""
    now = datetime.now(timezone.utc)

    async with httpx.AsyncClient(timeout=30) as client:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
            "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
            "past_hours": 24,
            "forecast_hours": 0,
            "models": OPEN_METEO_MODEL,
            "wind_speed_unit": "ms",
        }
        resp = await client.get(OPEN_METEO_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    speeds = hourly.get("wind_speed_10m", [])
    directions = hourly.get("wind_direction_10m", [])
    gusts = hourly.get("wind_gusts_10m", [])

    entries = [
        {
            "time": t + ":00Z",
            "wind_speed_ms": speeds[i] if i < len(speeds) else None,
            "wind_direction": directions[i] if i < len(directions) else None,
            "wind_gust_ms": gusts[i] if i < len(gusts) else None,
        }
        for i, t in enumerate(times)
    ]

    history = entries[-24:]

    # Ajouter l'observation courante comme dernier point si plus récente que le dernier point horaire
    current = data.get("current", {})
    current_time_str = current.get("time")
    if current_time_str and current.get("wind_speed_10m") is not None:
        current_dt = datetime.fromisoformat(current_time_str).replace(tzinfo=timezone.utc)
        last_dt = datetime.fromisoformat(history[-1]["time"].rstrip("Z")).replace(tzinfo=timezone.utc) if history else None
        if last_dt is None or current_dt > last_dt:
            history.append({
                "time": current_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "wind_speed_ms": current.get("wind_speed_10m"),
                "wind_direction": current.get("wind_direction_10m"),
                "wind_gust_ms": current.get("wind_gusts_10m"),
            })

    return {"station_id": station_id, "history": history}


async def fetch_forecast(station_id: str, lat: float, lon: float, hours: int = 48) -> dict[str, Any]:
    forecast_days = min(7, max(1, (hours // 24) + 1))

    async with httpx.AsyncClient(timeout=30) as client:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
            "forecast_days": forecast_days,
            "models": OPEN_METEO_MODEL,
            "wind_speed_unit": "ms",
        }
        resp = await client.get(OPEN_METEO_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    speeds = hourly.get("wind_speed_10m", [])
    directions = hourly.get("wind_direction_10m", [])
    gusts = hourly.get("wind_gusts_10m", [])

    forecast = []
    for i, t in enumerate(times[:hours]):
        forecast.append({
            "time": t + ":00Z" if "T" in t else t,
            "wind_speed_ms": speeds[i] if i < len(speeds) else None,
            "wind_direction": directions[i] if i < len(directions) else None,
            "wind_gust_ms": gusts[i] if i < len(gusts) else None,
        })

    return {"station_id": station_id, "forecast": forecast}
