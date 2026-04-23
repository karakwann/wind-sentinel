"""
Service stations : source hybride METAR + Open-Meteo.

1. Récupère les vraies observations METAR des aéroports français
   via l'API publique NOAA Aviation Weather (pas d'auth, MàJ ~30 min).
   → source="metar"

2. Complète avec Open-Meteo AROME pour les stations hors réseau aéroport.
   → source="model"
"""
import logging
from datetime import datetime, timezone
from typing import Any
import asyncio

import httpx

from app.config import OPEN_METEO_BASE_URL, OPEN_METEO_MODEL
from app.core.units import ms_to_knots, ms_to_kmh, ms_to_beaufort

logger = logging.getLogger(__name__)

# Drapeau premier démarrage : évite un conflit de rate-limit avec l'instance précédente
_startup_run = True

METAR_API = "https://aviationweather.gov/api/data/metar"
KNOTS_TO_MS = 0.514444

# Stations METAR françaises (ICAO, nom affiché, lat, lon)
METAR_STATIONS = [
    # --- Île-de-France / Centre Nord ---
    ("LFPG", "Paris-CDG",           49.013,  2.550),
    ("LFPO", "Paris-Orly",          48.725,  2.359),
    ("LFOB", "Beauvais",            49.454,  2.113),
    ("LFOZ", "Orléans",             47.900,  2.160),
    ("LFOA", "Avord",               47.053,  2.632),
    ("LFLX", "Châteauroux",         46.870,  1.740),
    ("LFYR", "Romorantin",          47.320,  1.690),
    # --- Nord / Picardie ---
    ("LFQQ", "Lille",               50.561,  3.089),
    ("LFAC", "Calais",              50.960,  1.960),
    ("LFAT", "Le Touquet",          50.520,  1.620),
    ("LFAQ", "Albert-Picardie",     49.970,  2.700),
    ("LFOK", "Châlons-Vatry",       48.780,  4.170),
    ("LFQB", "Troyes",              48.330,  4.020),
    # --- Normandie ---
    ("LFRK", "Caen",                49.173, -0.449),
    ("LFRC", "Cherbourg",           49.651, -1.470),
    ("LFOH", "Le Havre",            49.534,  0.088),
    ("LFOP", "Rouen",               49.380,  1.180),
    # --- Bretagne ---
    ("LFRD", "Dinard",              48.588, -2.079),
    ("LFRN", "Rennes",              48.069, -1.731),
    ("LFRB", "Brest",               48.447, -4.418),
    ("LFRO", "Lannion",             48.754, -3.472),
    ("LFRQ", "Quimper",             47.975, -4.168),
    ("LFRH", "Lorient",             47.760, -3.440),
    ("LFRT", "Saint-Brieuc",        48.540, -2.850),
    ("LFRV", "Vannes",              47.720, -2.730),
    # --- Pays de la Loire ---
    ("LFRS", "Nantes",              47.153, -1.610),
    ("LFJR", "Angers",              47.560, -0.320),
    ("LFRM", "Le Mans",             47.950,  0.200),
    ("LFOV", "Laval",               48.030, -0.750),
    # --- Vallée de la Loire ---
    ("LFOT", "Tours",               47.440,  0.730),
    # --- Grand Est ---
    ("LFST", "Strasbourg",          48.538,  7.628),
    ("LFSB", "Basel-Mulhouse",      47.590,  7.529),
    ("LFSN", "Nancy",               48.690,  6.230),
    ("LFSX", "Luxeuil",             47.780,  6.360),
    ("LFGA", "Colmar",              48.110,  7.360),
    # --- Bourgogne ---
    ("LFSD", "Dijon",               47.269,  5.090),
    ("LFQG", "Nevers",              47.000,  3.110),
    ("LFLN", "Saint-Yan",           46.410,  4.030),
    # --- Auvergne / Centre ---
    ("LFLC", "Clermont-Ferrand",    45.790,  3.170),
    ("LFHP", "Le Puy",              45.080,  3.760),
    ("LFLW", "Aurillac",            44.900,  2.420),
    # --- Centre-Ouest ---
    ("LFBI", "Poitiers",            46.580,  0.310),
    ("LFBH", "La Rochelle",         46.180, -1.190),
    ("LFBL", "Limoges",             45.860,  1.180),
    ("LFBG", "Cognac",              45.660, -0.320),
    # --- Rhône-Alpes ---
    ("LFLL", "Lyon",                45.721,  5.081),
    ("LFLB", "Chambéry",            45.638,  5.880),
    ("LFLS", "Grenoble",            45.362,  5.329),
    # --- Côte d'Azur / PACA ---
    ("LFMN", "Nice",                43.658,  7.215),
    ("LFML", "Marseille",           43.436,  5.215),
    ("LFTH", "Toulon-Hyères",       43.097,  6.146),
    ("LFMV", "Avignon",             43.910,  4.900),
    # --- Languedoc ---
    ("LFMT", "Montpellier",         43.576,  3.963),
    ("LFMU", "Béziers",             43.320,  3.350),
    ("LFMK", "Carcassonne",         43.210,  2.310),
    ("LFMP", "Perpignan",           42.740,  2.870),
    # --- Midi-Pyrénées ---
    ("LFBO", "Toulouse",            43.629,  1.367),
    ("LFCR", "Rodez",               44.410,  2.480),
    ("LFSL", "Brive",               45.040,  1.490),
    # --- Aquitaine ---
    ("LFBD", "Bordeaux",            44.828, -0.715),
    ("LFBZ", "Biarritz",            43.469, -1.523),
    ("LFBT", "Tarbes-Lourdes",      43.179, -0.006),
    ("LFBM", "Mont-de-Marsan",      43.910, -0.510),
    ("LFBA", "Agen",                44.180,  0.590),
    ("LFBE", "Bergerac",            44.830,  0.520),
    # --- Corse ---
    ("LFKJ", "Ajaccio",             41.924,  8.800),
    ("LFKB", "Bastia",              42.551,  9.484),
    ("LFKF", "Figari",              41.501,  9.098),
    ("LFKC", "Calvi",               42.524,  8.793),
]

# Postes modèle (Open-Meteo AROME) — zones sans aéroport METAR à proximité
MODEL_STATIONS = [
    # --- Nord / Picardie ---
    ("07027", "Abbeville",          50.13,   1.83),
    # --- Normandie ---
    ("07075", "Deauville",          49.37,   0.18),
    # --- Bretagne (côtes sans aéroport) ---
    ("07117", "Ploumanac'h",        48.83,  -3.47),
    ("07130", "Pointe du Raz",      48.03,  -4.73),
    ("07137", "Belle-Île",          47.35,  -3.13),
    ("07139", "Île d'Ouessant",     48.47,  -5.10),
    # --- Pays de la Loire (côtes) ---
    ("07231", "La Baule",           47.30,  -2.38),
    ("07260", "Saint-Jean-de-Monts",46.80,  -2.07),
    ("07265", "Île de Noirmoutier", 47.00,  -2.23),
    ("07268", "Les Sables-d'Olonne",46.50,  -1.78),
    # --- Charente-Maritime (îles) ---
    ("07306", "Île de Ré",          46.20,  -1.37),
    ("07307", "Île d'Oléron",       45.92,  -1.29),
    # --- Côte d'Azur ---
    ("07697", "Saintes-Maries",     43.45,   4.43),
    ("07695", "Hyères",             43.08,   6.15),
    # --- Languedoc (côtes) ---
    ("07477", "Sète",               43.40,   3.70),
    ("07480", "Narbonne",           43.18,   3.00),
    ("07482", "Leucate",            42.92,   3.05),
    # --- Aquitaine (côtes) ---
    ("07520", "Arcachon",           44.66,  -1.17),
    ("07525", "Mimizan",            44.18,  -1.30),
    ("07530", "Hossegor",           43.67,  -1.42),
    # --- Midi-Pyrénées ---
    ("07650", "Montauban",          44.02,   1.35),
    ("07471", "Millau",             44.12,   3.02),
]


async def fetch_metar(client: httpx.AsyncClient) -> dict[str, dict]:
    """
    Charge les observations METAR pour toutes les stations METAR_STATIONS.
    Retourne un dict { icao → données parsées }.
    """
    ids = ",".join(s[0] for s in METAR_STATIONS)
    resp = await client.get(METAR_API, params={"ids": ids, "format": "json"}, timeout=15)
    resp.raise_for_status()
    raw = resp.json()

    result: dict[str, dict] = {}
    for obs in raw:
        icao = obs.get("icaoId", "")
        wspd = obs.get("wspd")          # nœuds
        wdir = obs.get("wdir")          # degrés (peut être "VRB")
        wgst = obs.get("wgst")          # rafale en nœuds (peut être vide/None)
        temp = obs.get("temp")          # °C
        obs_time_str = obs.get("reportTime") or obs.get("obsTime") or ""

        if wspd is None:
            continue

        # wdir peut être "VRB" (variable) → on met None
        direction = None
        if isinstance(wdir, (int, float)):
            direction = int(wdir)
        elif isinstance(wdir, str) and wdir.isdigit():
            direction = int(wdir)

        ff_ms = round(float(wspd) * KNOTS_TO_MS, 2)
        fx_ms = round(float(wgst) * KNOTS_TO_MS, 2) if wgst else None

        result[icao] = {
            "ff": ff_ms,
            "dd": direction,
            "fx": fx_ms,
            "t":  round(float(temp), 1) if temp is not None else None,
            "obs_time": obs_time_str,
        }
    return result


async def fetch_openmeteo_batch(
    client: httpx.AsyncClient,
    station_list: list[tuple],
) -> list[dict]:
    """Fetch Open-Meteo current weather pour une liste de stations (tuples id,nom,lat,lon)."""
    lats = [s[2] for s in station_list]
    lons = [s[3] for s in station_list]
    BATCH = 20
    results: list[dict] = []
    for b in range(0, len(lats), BATCH):
        params = {
            "latitude":  ",".join(str(x) for x in lats[b:b+BATCH]),
            "longitude": ",".join(str(x) for x in lons[b:b+BATCH]),
            "current":   "wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m",
            "models":    OPEN_METEO_MODEL,
            "wind_speed_unit": "ms",
        }
        for attempt in range(5):
            resp = await client.get(OPEN_METEO_BASE_URL, params=params)
            if resp.status_code != 429:
                break
            await asyncio.sleep(8 * (attempt + 1))
        resp.raise_for_status()
        batch = resp.json()
        results.extend(batch if isinstance(batch, list) else [batch])
        if b + BATCH < len(lats):
            await asyncio.sleep(0.3)
    return results


def _build_station(sid, name, lat, lon, ff, dd, fx, t, obs_time, source, now) -> dict[str, Any]:
    return {
        "id":                  sid,
        "name":                name,
        "lat":                 lat,
        "lon":                 lon,
        "wind_speed_ms":       ff,
        "wind_speed_knots":    round(ms_to_knots(ff), 1),
        "wind_speed_kmh":      round(ms_to_kmh(ff), 1),
        "wind_speed_beaufort": ms_to_beaufort(ff),
        "wind_direction":      dd,
        "wind_gust_ms":        fx,
        "temperature_c":       t,
        "observation_time":    obs_time or now.strftime("%Y-%m-%dT%H:%M") + ":00Z",
        "is_fresh":            True,
        "source":              source,
    }


async def fetch_stations() -> list[dict[str, Any]]:
    """
    Source hybride :
    - Stations METAR (aéroports) → données capteur réel, source="metar"
    - Autres stations → Open-Meteo AROME, source="model"
    Au premier démarrage, seules les stations METAR sont chargées pour éviter
    un conflit de rate-limit avec l'instance précédente.
    """
    global _startup_run
    now = datetime.now(timezone.utc)
    stations: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=30) as client:

        # ── 1. Observations METAR réelles ──────────────────────────────────
        metar_data: dict[str, dict] = {}
        try:
            metar_data = await fetch_metar(client)
            logger.info(f"METAR chargé : {len(metar_data)}/{len(METAR_STATIONS)} stations")
        except Exception as exc:
            logger.warning(f"METAR indisponible ({exc}) — fallback Open-Meteo pour les aéroports")

        if metar_data:
            # Données METAR disponibles
            for icao, name, lat, lon in METAR_STATIONS:
                obs = metar_data.get(icao)
                if obs is None:
                    continue
                stations.append(_build_station(
                    icao, name, lat, lon,
                    obs["ff"], obs["dd"], obs["fx"], obs["t"],
                    obs["obs_time"], "metar", now,
                ))
        else:
            # Fallback Open-Meteo pour les aéroports
            om = await fetch_openmeteo_batch(client, METAR_STATIONS)
            for i, (icao, name, lat, lon) in enumerate(METAR_STATIONS):
                if i >= len(om):
                    continue
                cur = om[i].get("current", {})
                ff = cur.get("wind_speed_10m")
                if ff is None:
                    continue
                t = cur.get("temperature_2m")
                stations.append(_build_station(
                    icao, name, lat, lon,
                    ff, cur.get("wind_direction_10m"),
                    cur.get("wind_gusts_10m"),
                    round(t, 1) if t is not None else None,
                    cur.get("time", "") + ":00Z", "model", now,
                ))

        # ── 2. Stations modèle (Open-Meteo) ────────────────────────────────
        # Ignoré au 1er run pour ne pas concurrencer l'instance précédente.
        # Disponible dès le 2ème cycle (5 min plus tard).
        if _startup_run:
            _startup_run = False
            logger.info("Démarrage initial : stations modèle différées au prochain cycle")
            return stations

        await asyncio.sleep(10)
        try:
            om = await fetch_openmeteo_batch(client, MODEL_STATIONS)
            for i, (sid, name, lat, lon) in enumerate(MODEL_STATIONS):
                if i >= len(om):
                    continue
                cur = om[i].get("current", {})
                ff = cur.get("wind_speed_10m")
                if ff is None:
                    continue
                t = cur.get("temperature_2m")
                stations.append(_build_station(
                    sid, name, lat, lon,
                    ff, cur.get("wind_direction_10m"),
                    cur.get("wind_gusts_10m"),
                    round(t, 1) if t is not None else None,
                    cur.get("time", "") + ":00Z", "model", now,
                ))
        except Exception as exc:
            logger.warning(f"Open-Meteo modèle : {exc}")

    logger.info(f"fetch_stations : {len(stations)} stations total "
                f"({sum(1 for s in stations if s['source']=='metar')} METAR, "
                f"{sum(1 for s in stations if s['source']=='model')} modèle)")
    return stations
