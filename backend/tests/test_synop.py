import gzip
import io
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from app.services.synop_service import get_latest_synop_url, is_data_fresh, _safe_float


def test_safe_float_valid():
    assert _safe_float("7.5") == 7.5


def test_safe_float_invalid():
    assert _safe_float("mq") is None
    assert _safe_float("") is None
    assert _safe_float("9999") is None


def test_is_data_fresh_recent():
    now = datetime.now(timezone.utc)
    assert is_data_fresh(now, max_age_minutes=90) is True


def test_is_data_fresh_old():
    from datetime import timedelta
    old = datetime.now(timezone.utc) - timedelta(minutes=120)
    assert is_data_fresh(old, max_age_minutes=90) is False


def test_synop_url_format():
    url, t = get_latest_synop_url()
    assert "synop." in url
    assert url.endswith("00.csv.gz")
    assert t.minute == 0
    assert t.second == 0
    assert t.hour % 3 == 0
