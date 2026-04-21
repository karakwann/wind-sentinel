import math
import pytest
from app.core.units import ms_to_knots, ms_to_kmh, ms_to_beaufort, speed_direction_to_uv


def test_ms_to_knots():
    assert abs(ms_to_knots(1.0) - 1.94384) < 0.0001


def test_ms_to_kmh():
    assert abs(ms_to_kmh(1.0) - 3.6) < 0.0001


def test_beaufort_calm():
    assert ms_to_beaufort(0.0) == 0
    assert ms_to_beaufort(0.2) == 0


def test_beaufort_storm():
    assert ms_to_beaufort(33.0) == 12


def test_beaufort_moderate():
    assert ms_to_beaufort(7.0) == 4


def test_uv_north():
    """Vent du Nord (dir=0°) : U=0, V=-speed"""
    u, v = speed_direction_to_uv(10.0, 0.0)
    assert abs(u) < 1e-9
    assert abs(v - (-10.0)) < 1e-9


def test_uv_east():
    """Vent de l'Est (dir=90°) : U=-speed, V≈0"""
    u, v = speed_direction_to_uv(10.0, 90.0)
    assert abs(u - (-10.0)) < 1e-9
    assert abs(v) < 1e-9


def test_uv_south():
    """Vent du Sud (dir=180°) : U≈0, V=+speed"""
    u, v = speed_direction_to_uv(10.0, 180.0)
    assert abs(u) < 1e-9
    assert abs(v - 10.0) < 1e-9
