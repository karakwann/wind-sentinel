from app.services.openmeteo_service import _build_grid_points
from app.config import FRANCE_BOUNDS, GRID_RESOLUTION_DEG


def test_grid_points_count():
    points = _build_grid_points()
    assert len(points) > 0
    # Vérifier que tous les points sont dans le bounding box
    for lat, lon in points:
        assert FRANCE_BOUNDS["lat_min"] <= lat <= FRANCE_BOUNDS["lat_max"] + 0.01
        assert FRANCE_BOUNDS["lon_min"] <= lon <= FRANCE_BOUNDS["lon_max"] + 0.01


def test_grid_points_resolution():
    points = _build_grid_points()
    lats = sorted(set(p[0] for p in points))
    if len(lats) > 1:
        diff = abs(lats[1] - lats[0])
        assert abs(diff - GRID_RESOLUTION_DEG) < 0.01


def test_grid_no_duplicates():
    points = _build_grid_points()
    assert len(points) == len(set(points))
