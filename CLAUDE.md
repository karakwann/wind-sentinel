<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph does not cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

# Mémoire de session

## Fichiers à lire OBLIGATOIREMENT au démarrage de chaque session

Ces 3 fichiers contiennent le contexte, les décisions et les conventions du projet. Les lire avant toute action :

| Fichier | Contenu |
|---------|---------|
| `.claude/projects/-Users-erwann-Documents-GitHub-wind-sentinel/memory/project_overview.md` | Stack, architecture, fichiers clés, conventions techniques, auto-refresh |
| `.claude/projects/-Users-erwann-Documents-GitHub-wind-sentinel/memory/feedback_conventions.md` | Conventions UI/UX validées (couleurs, flèches, tooltip, graphiques) |
| `.claude/projects/-Users-erwann-Documents-GitHub-wind-sentinel/memory/user_profile.md` | Profil utilisateur et style de collaboration |

## Règle de mise à jour

**Après chaque modification significative**, mettre à jour le(s) fichier(s) concerné(s) :
- Nouveau comportement validé → `feedback_conventions.md`
- Changement d'architecture ou de convention technique → `project_overview.md`
- Nouvelle préférence utilisateur observée → `user_profile.md`

Ne pas attendre la fin de session — mettre à jour au fur et à mesure.

---

# CLAUDE.md — Wind-Sentinel

## Vue d'ensemble

**Wind-Sentinel** est une application web de visualisation des vents en temps réel sur la France, inspirée de [winds-up.com](https://www.winds-up.com/).

Elle combine :
- Une **animation de particules vent** (style Windy.com) issue des prévisions Météo-France AROME via Open-Meteo
- Des **stations d'observation temps réel** (réseau SYNOP Météo-France, ~60 stations)
- Une interface **interactive Leaflet** avec filtres, multi-unités et graphiques d'historique

Développé avec **Python FastAPI** (backend) + **React + Leaflet.js** (frontend).  
Intégration **Code Review Graph** pour la validation des changements.

---

## Architecture générale

```
wind-sentinel/
├── CLAUDE.md                          # ← Ce fichier
├── backend/
│   ├── app/
│   │   ├── main.py                    # Point d'entrée FastAPI
│   │   ├── config.py                  # Configuration & constantes
│   │   ├── core/
│   │   │   ├── wind_data.py           # Agrégation des sources de données
│   │   │   ├── grid_generator.py      # Génération grille vent (pour animation)
│   │   │   └── units.py               # Conversion d'unités
│   │   ├── services/
│   │   │   ├── openmeteo_service.py   # API Open-Meteo (prévisions + grille)
│   │   │   ├── synop_service.py       # Données SYNOP Météo-France
│   │   │   └── cache_service.py       # Cache Redis ou in-memory
│   │   └── api/
│   │       ├── stations.py            # Endpoint /api/stations
│   │       ├── grid.py                # Endpoint /api/grid (animation particules)
│   │       └── forecast.py            # Endpoint /api/forecast
│   ├── requirements.txt
│   └── tests/
│       ├── test_openmeteo.py
│       ├── test_synop.py
│       └── test_units.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── WindMap.jsx            # Carte principale Leaflet
│   │   │   ├── StationMarker.jsx      # Marqueur station avec flèche
│   │   │   ├── WindAnimationLayer.jsx # Couche particules (Leaflet-velocity)
│   │   │   ├── StationDetail.jsx      # Popup : données + graphique 24h
│   │   │   ├── Controls.jsx           # Barre de contrôle (unités, filtres, layers)
│   │   │   └── Legend.jsx             # Légende vitesse/couleurs
│   │   ├── hooks/
│   │   │   ├── useWindData.js         # Fetch stations + grille
│   │   │   └── useAutoRefresh.js      # Refresh automatique
│   │   └── utils/
│   │       └── windUnits.js           # Conversions + Beaufort
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

---

## Sources de données

### 1. Open-Meteo (gratuit, sans clé API)

Utilisé pour **deux usages distincts** :

**A. Animation de particules (grille régulière)**

Génère une grille de points sur la France (bounding box : lat 41–51, lon -5–10) avec Open-Meteo.  
Le format de sortie est compatible **Leaflet-velocity** (format GFS JSON).

```python
# Grille France : ~200 points (20×10), résolution ~1°
# Ou fine : ~2000 points (50×25), résolution ~0.4° (recommandé)
BASE_URL = "https://api.open-meteo.com/v1/forecast"
PARAMS = {
    "latitude": [lat1, lat2, ...],   # liste de latitudes
    "longitude": [lon1, lon2, ...],  # liste de longitudes
    "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    "models": "meteofrance_arome_france",   # modèle AROME 2.5km
    "wind_speed_unit": "ms"
}
```

**B. Prévisions par station (7 jours)**

```python
FORECAST_PARAMS = {
    "latitude": station_lat,
    "longitude": station_lon,
    "hourly": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    "forecast_days": 7,
    "models": "meteofrance_arome_france"
}
```

**Limites** : 10 000 requêtes/jour gratuit. Avec cache 10 min, largement suffisant.

---

### 2. Météo-France SYNOP via meteo.data.gouv.fr (observations temps réel)

Données d'observation des **stations au sol** du réseau SYNOP OMM.  
Mise à jour **toutes les heures** (synoptiques de 00h, 03h, 06h... UTC).

```python
# URL observations temps réel (dernière heure)
SYNOP_URL = "https://object.files.data.gouv.fr/meteofrance/data/synop/synop.{YYYYMMDDHH}.csv.gz"

# Exemple : heure courante arrondie à l'heure précédente
from datetime import datetime, timedelta, timezone
now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
url = f"https://object.files.data.gouv.fr/meteofrance/data/synop/synop.{now.strftime('%Y%m%d%H')}00.csv.gz"
```

**Champs utilisés** du CSV SYNOP** :
```
numer_sta  : identifiant station
lat        : latitude (degrés décimaux)
lon        : longitude (degrés décimaux)
nom        : nom de la station
ff         : vitesse du vent moyen (m/s)
dd         : direction du vent (degrés, 0–360)
fx         : rafale maximale (m/s)
t          : température (K → °C)
```

**Liste des stations** (~62 stations métropolitaines) :
```python
STATIONS_META_URL = "https://object.files.data.gouv.fr/meteofrance/data/synop/postesSynop.csv"
```

---

### 3. Sources complémentaires (optionnelles, Phase 2)

- **Aéroports (METAR)** : https://aviationweather.gov/api/data/metar?ids=LFPG&format=json — données METAR OACI gratuites
- **Bouées météo** : https://www.meteociel.fr/observations-meteo/bouees.php (scraping) ou Copernicus Marine Service (API gratuite)
- **Historique** : Open-Meteo Historical Weather API (1940–présent, gratuit)

---

## Stack technique

### Backend

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework | FastAPI 0.110+ | Async, type hints, cohérent avec macro_sentinel |
| Cache | TTLCache (cachetools) | Simple, in-memory, sans Redis pour commencer |
| HTTP client | httpx (async) | Async natif, compatible FastAPI |
| Compression | gzip (stdlib) | Décompression SYNOP CSV.gz |
| Scheduler | APScheduler | Refresh cache toutes les 10 min en background |
| Tests | pytest + pytest-asyncio | |

### Frontend

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework | React 18 + Vite | Rapide, modern |
| Carte | Leaflet.js 1.9 | Utilisé par winds-up.com, mature, léger |
| Animation vent | leaflet-velocity | Plugin Leaflet pour particules (style earth.nullschool) |
| Graphiques | Recharts | Graphique 24h par station |
| Icônes | Lucide React | |
| Style | Tailwind CSS | |
| HTTP | Axios | Requêtes backend |

---

## Format de données — API interne

### GET /api/stations

Retourne toutes les stations avec leur dernier relevé.

```json
{
  "timestamp": "2026-04-21T14:00:00Z",
  "stations": [
    {
      "id": "07690",
      "name": "Marseille-Marignane",
      "lat": 43.44,
      "lon": 5.22,
      "wind_speed_ms": 7.2,
      "wind_speed_knots": 14.0,
      "wind_speed_kmh": 25.9,
      "wind_speed_beaufort": 4,
      "wind_direction": 310,
      "wind_gust_ms": 11.5,
      "temperature_c": 18.4,
      "data_age_minutes": 45,
      "is_fresh": true
    }
  ]
}
```

### GET /api/grid

Retourne la grille de vent au format **Leaflet-velocity** (compatible GFS JSON).

```json
[
  {
    "header": {
      "discipline": 0,
      "parameterCategory": 2,
      "parameterNumber": 2,
      "surface1Type": 103,
      "surface1Value": 10.0,
      "lo1": -5.0,
      "la1": 51.0,
      "lo2": 10.0,
      "la2": 41.0,
      "dx": 0.5,
      "dy": 0.5,
      "nx": 31,
      "ny": 21,
      "refTime": "2026-04-21T14:00:00Z"
    },
    "data": [/* composante U du vent m/s, flattened row-major */]
  },
  {
    "header": { "...parameterNumber": 3, "...": "composante V" },
    "data": [/* composante V du vent m/s */]
  }
]
```

**Calcul U/V depuis vitesse + direction :**
```python
import math

def speed_direction_to_uv(speed_ms: float, direction_deg: float) -> tuple[float, float]:
    """
    Convention météo : direction = d'où vient le vent (0=N, 90=E, 180=S, 270=W)
    Leaflet-velocity attend les composantes de déplacement de l'air
    """
    rad = math.radians(direction_deg)
    u = -speed_ms * math.sin(rad)   # composante Est-Ouest
    v = -speed_ms * math.cos(rad)   # composante Nord-Sud
    return u, v
```

### GET /api/forecast?station_id={id}&hours=48

```json
{
  "station_id": "07690",
  "station_name": "Marseille-Marignane",
  "forecast": [
    {
      "time": "2026-04-21T15:00:00Z",
      "wind_speed_ms": 8.1,
      "wind_direction": 305,
      "wind_gust_ms": 13.2
    }
  ]
}
```

---

## Conversion des unités de vent

```python
# utils/units.py

BEAUFORT_SCALE = [
    (0.3, 0),   (1.5, 1),   (3.3, 2),   (5.5, 3),
    (8.0, 4),   (10.8, 5),  (13.9, 6),  (17.2, 7),
    (20.7, 8),  (24.5, 9),  (28.4, 10), (32.6, 11),
    (float('inf'), 12)
]

def ms_to_knots(ms: float) -> float:
    return ms * 1.94384

def ms_to_kmh(ms: float) -> float:
    return ms * 3.6

def ms_to_mph(ms: float) -> float:
    return ms * 2.23694

def ms_to_beaufort(ms: float) -> int:
    for limit, bf in BEAUFORT_SCALE:
        if ms < limit:
            return bf
    return 12
```

---

## Visualisation — Couleurs par vitesse

Palette basée sur la force du vent (Beaufort) :

```python
WIND_COLOR_SCALE = {
    # (min_ms, max_ms): couleur hex
    (0, 1):    "#E8F4F8",  # Calme — bleu très clair
    (1, 5):    "#74C6E6",  # Très légère brise — bleu clair
    (5, 11):   "#4BA3D4",  # Brise légère-modérée — bleu
    (11, 20):  "#F5A623",  # Vent frais-fort — orange
    (20, 29):  "#E85D26",  # Coup de vent — orange-rouge
    (29, 39):  "#C0392B",  # Tempête — rouge
    (39, 999): "#7B1A1A",  # Tempête violente — bordeaux
}
```

---

## Logique de détection de fraîcheur des données

```python
def is_data_fresh(observation_time: datetime, max_age_minutes: int = 90) -> bool:
    """
    Les données SYNOP sont disponibles avec ~30-60 min de délai.
    On considère les données 'fraîches' si < 90 min.
    """
    age = datetime.now(timezone.utc) - observation_time
    return age.total_seconds() / 60 < max_age_minutes
```

---

## Stratégie de cache

```python
# services/cache_service.py
from cachetools import TTLCache
import asyncio

# Cache des données stations : 10 minutes
STATIONS_CACHE = TTLCache(maxsize=1, ttl=600)

# Cache de la grille Open-Meteo : 10 minutes  
GRID_CACHE = TTLCache(maxsize=1, ttl=600)

# Cache des prévisions par station : 30 minutes
FORECAST_CACHE = TTLCache(maxsize=100, ttl=1800)
```

**Stratégie de fallback** :
1. Si SYNOP indisponible → utiliser Open-Meteo pour les observations ponctuelles
2. Si Open-Meteo indisponible → servir les données en cache avec indication d'obsolescence
3. Toujours afficher l'horodatage de la dernière mise à jour sur la carte

---

## Endpoints WebSocket (Phase 2)

Pour les mises à jour temps réel sans polling :

```python
# main.py
@app.websocket("/ws/wind")
async def wind_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await get_current_wind_data()
            await websocket.send_json(data)
            await asyncio.sleep(300)  # refresh 5 min
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

---

## Fonctionnalités — Roadmap

### Phase 1 — MVP (carte de base)
- [ ] Backend FastAPI : endpoints `/api/stations` + `/api/grid`
- [ ] Intégration Open-Meteo (grille + prévisions)
- [ ] Intégration SYNOP Météo-France (observations)
- [ ] Frontend React : carte Leaflet basique
- [ ] Marqueurs stations avec direction + couleur par vitesse
- [ ] Sélecteur d'unités (nœuds, km/h, m/s, Beaufort)
- [ ] Auto-refresh toutes les 5 minutes
- [ ] Popup station avec données actuelles

### Phase 2 — Animation & prévisions
- [ ] Animation particules vent (Leaflet-velocity)
- [ ] Graphique 24h d'historique par station
- [ ] Mode prévision (slider temporel 0h–48h)
- [ ] Filtre par vitesse minimale (slider)
- [ ] Couches toggleables (stations, animation, aéroports)
- [ ] Légende interactive

### Phase 3 — Features avancées
- [ ] Intégration METAR aéroports
- [ ] Intégration bouées météo marines
- [ ] Alertes vent (seuil configurable)
- [ ] Historique 30 jours (Open-Meteo Historical API)
- [ ] Export CSV des données
- [ ] API publique documentée (Swagger)
- [ ] Version mobile responsive

---

## Configuration

```python
# backend/app/config.py

# Bounding box France métropolitaine
FRANCE_BOUNDS = {
    "lat_min": 41.0,
    "lat_max": 51.5,
    "lon_min": -5.5,
    "lon_max": 10.0
}

# Grille de points pour l'animation (résolution ~0.5°)
GRID_RESOLUTION_DEG = 0.5
GRID_POINTS_LAT = int((FRANCE_BOUNDS["lat_max"] - FRANCE_BOUNDS["lat_min"]) / GRID_RESOLUTION_DEG) + 1
GRID_POINTS_LON = int((FRANCE_BOUNDS["lon_max"] - FRANCE_BOUNDS["lon_min"]) / GRID_RESOLUTION_DEG) + 1

# APIs externes
OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_MODEL = "meteofrance_arome_france"  # Modèle AROME 2.5km
SYNOP_BASE_URL = "https://object.files.data.gouv.fr/meteofrance/data/synop"

# Refresh
CACHE_TTL_STATIONS_SEC = 600   # 10 min
CACHE_TTL_GRID_SEC = 600       # 10 min
CACHE_TTL_FORECAST_SEC = 1800  # 30 min
AUTO_REFRESH_FRONTEND_SEC = 300 # 5 min (affiché côté client)

# Serveur
HOST = "0.0.0.0"
PORT = 8001  # Différent de macro_sentinel (8000)
```

---

## Démarrage rapide

```bash
# Backend
cd wind-sentinel/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend
cd wind-sentinel/frontend
npm install
npm run dev

# Ou avec Docker
docker-compose up
```

---

## Intégration Code Review Graph

Ce projet utilise le plugin **code-review-graph MCP** pour la validation des changements (même configuration que macro_sentinel).

**Workflow de code review :**

1. Avant tout changement sur les modules de données (`openmeteo_service.py`, `synop_service.py`) :
   ```
   detect_changes → get_impact_radius → get_affected_flows
   ```

2. Pour les modifications de l'API interne (format JSON) :
   ```
   query_graph pattern="callers_of" → vérifier la compatibilité frontend
   ```

3. Validation des conversions d'unités (critique pour l'exactitude des données affichées) :
   ```
   query_graph pattern="tests_for" → s'assurer qu'il y a des tests unitaires
   ```

**Règle de validation** : Tout PR modifiant `units.py` ou les calculs U/V doit passer les tests unitaires ET être validé via `get_review_context` avant merge.

---

## Points critiques de fiabilité

### 1. Disponibilité des données SYNOP

Les fichiers SYNOP sont générés à H+00, H+03, H+06... UTC.  
Entre deux synoptiques, interpoler l'heure avec l'observation la plus récente disponible.

```python
def get_latest_synop_url() -> str:
    """Retourne l'URL du fichier SYNOP le plus récent disponible."""
    now = datetime.now(timezone.utc)
    # SYNOP disponible à H+00, H+03, H+06, H+09, H+12, H+15, H+18, H+21
    synop_hour = (now.hour // 3) * 3
    synop_time = now.replace(hour=synop_hour, minute=0, second=0, microsecond=0)
    # Avec ~60 min de délai de publication, reculer si trop récent
    if (now - synop_time).total_seconds() < 3600:
        synop_time -= timedelta(hours=3)
    return f"{SYNOP_BASE_URL}/synop.{synop_time.strftime('%Y%m%d%H')}00.csv.gz"
```

### 2. Limites Open-Meteo en mode batch

L'API Open-Meteo accepte des listes de latitudes/longitudes (batch), mais avec une limite.  
Pour la grille complète France (~500 points à 0.5°), faire **2–3 requêtes batch** de ~200 points.

### 3. Convention de direction du vent

La **direction météo** (d'où vient le vent) est l'opposé de la direction de déplacement de l'air.  
Leaflet-velocity attend les **composantes U/V de déplacement** (vers où va l'air).  
Ne pas inverser ce calcul = animation dans le mauvais sens.

### 4. Absence de données maritime

Les stations SYNOP terrestres ne couvrent pas la mer.  
Pour les zones côtières, l'animation Open-Meteo (qui inclut l'offshore) est la seule source fiable.

---

## Tests

```bash
# Tests unitaires
pytest backend/tests/ -v

# Test de connectivité APIs
python -c "
import asyncio, httpx

async def test():
    async with httpx.AsyncClient() as c:
        r = await c.get('https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&current=wind_speed_10m&models=meteofrance_arome_france')
        print('Open-Meteo:', r.status_code, r.json()['current'])

asyncio.run(test())
"
```

---

## Notes techniques

- **Python 3.11+** requis (cohérent avec les autres projets)
- **Port 8001** (macro_sentinel utilise 8000)
- Les données SYNOP sont en **CSV séparé par `;`** avec des valeurs numériques en flottants
- L'unité native des vents SYNOP est le **m/s** (ff, fx)
- Open-Meteo retourne en **m/s** par défaut (configurable)
- Toutes les conversions vers autres unités se font côté **frontend** à partir du m/s
- Le modèle AROME couvre uniquement la **France métropolitaine** — pour les DOM-TOM, basculer sur `meteofrance_arome_france_hd` ou `meteofrance_arpege_world`

---

**Version** : 0.1 (plan initial)  
**Date** : 2026-04-21  
**Auteur** : Erwann  
**Inspiration** : [winds-up.com](https://www.winds-up.com/), [earth.nullschool.net](https://earth.nullschool.net/), [Windy.com](https://www.windy.com/)