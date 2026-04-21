"""
Service stations : utilise Open-Meteo current weather pour une liste fixe
de ~40 stations météo françaises (coordonnées des vrais postes SYNOP OMM).
Fallback robuste car Open-Meteo est toujours disponible.
"""
from datetime import datetime, timezone
from typing import Any
import asyncio

import httpx

from app.config import OPEN_METEO_BASE_URL, OPEN_METEO_MODEL
from app.core.units import ms_to_knots, ms_to_kmh, ms_to_beaufort

# Postes SYNOP France métropolitaine (id OMM, nom, lat, lon)
FRENCH_STATIONS = [
    # --- Nord / Pas-de-Calais / Picardie ---
    ("07005", "Lille",              50.57,  3.10),
    ("07015", "Dunkerque",          51.05,  2.37),
    ("07020", "Boulogne-sur-Mer",   50.73,  1.72),
    ("07027", "Abbeville",          50.13,  1.83),

    # --- Normandie ---
    ("07037", "Rouen",              49.38,  1.18),
    ("07060", "Cherbourg",          49.65, -1.70),
    ("07061", "Cap de la Hague",    49.72, -1.93),
    ("07072", "Caen",               49.18, -0.45),
    ("07075", "Deauville",          49.37,  0.18),
    ("07080", "Le Havre",           49.53,  0.10),

    # --- Bretagne ---
    ("07110B","Brest",              48.45, -4.42),
    ("07117B","Ploumanac'h",        48.83, -3.47),
    ("07118", "Lannion",            48.75, -3.47),
    ("07120", "Saint-Brieuc",       48.53, -2.85),
    ("07122", "Dinard",             48.58, -2.07),
    ("07125", "Rennes",             48.07, -1.73),
    ("07127", "Quimper",            47.97, -4.10),
    ("07130B","Pointe du Raz",      48.03, -4.73),
    ("07132", "Lorient",            47.77, -3.45),
    ("07135", "Vannes",             47.73, -2.72),
    ("07137", "Belle-Île",          47.35, -3.13),
    ("07139B","Île d'Ouessant",     48.47, -5.10),

    # --- Pays de la Loire / Vendée ---
    ("07222", "Nantes",             47.17, -1.60),
    ("07225", "Saint-Nazaire",      47.28, -2.15),
    ("07231", "La Baule",           47.30, -2.38),
    ("07240", "Le Mans",            48.00,  0.20),
    ("07255", "Tours",              47.43,  0.73),
    ("07260", "Saint-Jean-de-Monts",46.80, -2.07),
    ("07265", "Île de Noirmoutier", 47.00, -2.23),
    ("07268", "Les Sables-d'Olonne",46.50, -1.78),

    # --- Île-de-France / Centre ---
    ("07110", "Paris-CDG",          49.02,  2.52),
    ("07117", "Paris-Montsouris",   48.82,  2.33),
    ("07130", "Reims",              49.30,  4.03),
    ("07335", "Poitiers",           46.58,  0.32),
    ("07434", "Limoges",            45.87,  1.18),

    # --- Grand Est / Alsace ---
    ("07139", "Strasbourg",         48.55,  7.63),
    ("07149", "Nancy",              48.69,  6.22),
    ("07156", "Dijon",              47.27,  5.09),
    ("07168", "Mulhouse",           47.77,  7.36),

    # --- Rhône-Alpes / Auvergne ---
    ("07181", "Lyon",               45.72,  5.08),
    ("07190", "Genève/Cointrin",    46.25,  6.13),
    ("07270", "Clermont-Fd",        45.78,  3.15),
    ("07280", "Grenoble",           45.37,  5.58),
    ("07285", "Chambéry",           45.65,  5.88),
    ("07460", "Aurillac",           44.88,  2.42),

    # --- Côte d'Azur / PACA ---
    ("07299", "Nice",               43.65,  7.20),
    ("07591", "Marseille",          43.44,  5.22),
    ("07690", "Toulon",             43.08,  5.93),
    ("07695", "Hyères",             43.08,  6.15),
    ("07697", "Saintes-Maries",     43.45,  4.43),
    ("07471", "Montpellier",        43.58,  3.97),
    ("07477", "Sète",               43.40,  3.70),

    # --- Languedoc / Roussillon (spot Leucate et alentours) ---
    ("07480", "Narbonne",           43.18,  3.00),
    ("07482", "Leucate",            42.92,  3.05),
    ("07484", "Cap Leucate",        42.92,  3.05),  # même zone, données indépendantes
    ("07571", "Perpignan",          42.73,  2.87),
    ("07573", "Gruissan",           43.11,  3.09),
    ("07577", "Carcassonne",        43.22,  2.32),

    # --- Midi-Pyrénées / Occitanie ---
    ("07558", "Toulouse",           43.63,  1.37),
    ("07650", "Montauban",          44.02,  1.35),
    ("07643", "Gourdon",            44.73,  1.38),
    ("07471B","Millau",             44.12,  3.02),
    ("07535", "Agen",               44.17,  0.60),

    # --- Aquitaine / Côte Basque ---
    ("07510", "Bordeaux",           44.83, -0.70),
    ("07520", "Arcachon",           44.66, -1.17),
    ("07525", "Mimizan",            44.18, -1.30),
    ("07530", "Hossegor",           43.67, -1.42),
    ("07607", "Biarritz",           43.47, -1.52),
    ("07609", "Anglet",             43.47, -1.52),
    ("07621", "Pau",                43.38, -0.42),
    ("07630", "Tarbes",             43.18,  0.00),

    # --- Corse ---
    ("07747", "Ajaccio",            41.92,  8.80),
    ("07761", "Bastia",             42.55,  9.48),
    ("07763", "Cap Corse",          43.00,  9.35),
]
# Filtrer sur France métropolitaine (couverte par AROME)
FRENCH_STATIONS = [s for s in FRENCH_STATIONS if 41 <= s[2] <= 52 and -6 <= s[3] <= 11]



async def fetch_stations() -> list[dict[str, Any]]:
    """Récupère les données vent actuelles via Open-Meteo pour toutes les stations françaises."""
    lats = [s[2] for s in FRENCH_STATIONS]
    lons = [s[3] for s in FRENCH_STATIONS]

    now = datetime.now(timezone.utc)

    BATCH = 20
    data = []
    async with httpx.AsyncClient(timeout=30) as client:
        for i in range(0, len(lats), BATCH):
            batch_lats = lats[i:i+BATCH]
            batch_lons = lons[i:i+BATCH]
            params = {
                "latitude": ",".join(str(x) for x in batch_lats),
                "longitude": ",".join(str(x) for x in batch_lons),
                "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m",
                "models": OPEN_METEO_MODEL,
                "wind_speed_unit": "ms",
            }
            for attempt in range(3):
                resp = await client.get(OPEN_METEO_BASE_URL, params=params)
                if resp.status_code != 429:
                    break
                await asyncio.sleep(3 * (attempt + 1))
            resp.raise_for_status()
            batch_data = resp.json()
            if isinstance(batch_data, dict):
                batch_data = [batch_data]
            data.extend(batch_data)
            if i + BATCH < len(lats):
                await asyncio.sleep(0.5)

    stations = []
    for i, item in enumerate(data):
        if i >= len(FRENCH_STATIONS):
            break
        sid, name, lat, lon = FRENCH_STATIONS[i]
        current = item.get("current", {})

        ff = current.get("wind_speed_10m")
        dd = current.get("wind_direction_10m")
        fx = current.get("wind_gusts_10m")
        t  = current.get("temperature_2m")

        if ff is None:
            continue

        stations.append({
            "id": sid,
            "name": name,
            "lat": lat,
            "lon": lon,
            "wind_speed_ms": ff,
            "wind_speed_knots": round(ms_to_knots(ff), 1),
            "wind_speed_kmh": round(ms_to_kmh(ff), 1),
            "wind_speed_beaufort": ms_to_beaufort(ff),
            "wind_direction": dd,
            "wind_gust_ms": fx,
            "temperature_c": round(t, 1) if t is not None else None,
            "observation_time": (current.get("time") or now.strftime("%Y-%m-%dT%H:%M")) + ":00Z",
            "is_fresh": True,
        })

    return stations
