"""Live currency conversion via a free, keyless FX API with a static fallback.

Primary: https://open.er-api.com/v6/latest/{BASE}  (no key required)
Results are cached in-memory for 6 hours per base currency.
"""
import time
import logging
import requests

from .taxonomy import FX_FALLBACK_TO_INR

logger = logging.getLogger("competeiq.fx")

_CACHE = {}  # base -> {"rates": {...}, "date": str, "ts": float}
_TTL = 6 * 3600
_PROVIDER = "open.er-api.com"


def _fetch(base: str):
    base = (base or "USD").upper()
    now = time.time()
    cached = _CACHE.get(base)
    if cached and (now - cached["ts"]) < _TTL:
        return cached
    try:
        r = requests.get(f"https://open.er-api.com/v6/latest/{base}", timeout=8)
        data = r.json()
        if data.get("result") == "success" and "rates" in data:
            entry = {
                "rates": data["rates"],
                "date": data.get("time_last_update_utc", ""),
                "ts": now,
                "source": _PROVIDER,
            }
            _CACHE[base] = entry
            return entry
    except Exception as e:
        logger.info(f"FX live fetch failed for {base}: {e}")
    return None


def convert(amount, from_currency: str, to_currency: str = "INR"):
    """Return (converted_amount, rate, rate_date, source). Falls back to a static table.

    rate is the multiplier such that: converted = amount * rate.
    """
    if amount is None:
        return None, None, None, None
    from_currency = (from_currency or "USD").upper()
    to_currency = (to_currency or "INR").upper()
    if from_currency == to_currency:
        return round(float(amount), 2), 1.0, "same-currency", "none"

    # Try live: rates are relative to base=from_currency
    entry = _fetch(from_currency)
    if entry and to_currency in entry["rates"]:
        rate = float(entry["rates"][to_currency])
        return round(float(amount) * rate, 2), round(rate, 4), entry["date"], entry["source"]

    # Fallback: convert via INR anchor table
    f_inr = FX_FALLBACK_TO_INR.get(from_currency)
    t_inr = FX_FALLBACK_TO_INR.get(to_currency)
    if f_inr and t_inr:
        rate = f_inr / t_inr
        return round(float(amount) * rate, 2), round(rate, 4), "fallback-static", "fallback"

    # Unknown currency — return as-is, no conversion
    return round(float(amount), 2), 1.0, "unconverted", "fallback"
