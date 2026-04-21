import math

BEAUFORT_SCALE = [
    (0.3, 0),
    (1.5, 1),
    (3.3, 2),
    (5.5, 3),
    (8.0, 4),
    (10.8, 5),
    (13.9, 6),
    (17.2, 7),
    (20.7, 8),
    (24.5, 9),
    (28.4, 10),
    (32.6, 11),
    (float("inf"), 12),
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


def speed_direction_to_uv(speed_ms: float, direction_deg: float) -> tuple[float, float]:
    """
    direction_deg : d'où vient le vent (convention météo : 0=N, 90=E, 180=S, 270=W)
    Retourne (U, V) : composantes de déplacement de l'air pour Leaflet-velocity.
    U = Est-Ouest (positif vers l'Est), V = Nord-Sud (positif vers le Nord)
    """
    rad = math.radians(direction_deg)
    u = -speed_ms * math.sin(rad)
    v = -speed_ms * math.cos(rad)
    return u, v
