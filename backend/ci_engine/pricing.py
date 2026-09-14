"""Pricing normalization + currency conversion (deterministic)."""
from . import fx
from .taxonomy import DEFAULT_NORMALIZED_CURRENCY


def _annualize(price, freq):
    if price is None:
        return None
    freq = (freq or "").lower()
    if freq in ("monthly", "month", "mo", "per_month"):
        return price * 12
    if freq in ("annual", "annually", "year", "yr", "per_year"):
        return price
    if freq in ("one_time", "onetime", "perpetual"):
        return price  # treat as annual-equivalent one-off
    # default assume monthly if unclear but price small, else annual
    return price * 12 if (price and price < 500) else price


def normalize_pricing(pricing: dict, target=DEFAULT_NORMALIZED_CURRENCY) -> dict:
    """pricing input fields:
      price_type: fixed|free|custom|estimated|unknown
      price: number|None
      currency: e.g. USD
      billing_frequency: monthly|annual|one_time
      included_users: int|None
      tier: str
      source_url, confidence, evidence, label
    """
    pricing = pricing or {}
    ptype = (pricing.get("price_type") or "unknown").lower()
    currency = (pricing.get("currency") or "USD").upper()
    price = pricing.get("price")
    freq = pricing.get("billing_frequency")
    users = pricing.get("included_users")

    original = {
        "price": price,
        "currency": currency,
        "billing_frequency": freq,
        "tier": pricing.get("tier", ""),
        "included_users": users,
        "label": pricing.get("label") or _default_label(pricing),
    }
    base = {
        "price_type": ptype,
        "tier": pricing.get("tier", ""),
        "source_url": pricing.get("source_url", ""),
        "confidence": pricing.get("confidence", 50),
        "evidence": pricing.get("evidence", ""),
        "original": original,
        "comparable": ptype in ("fixed", "free", "estimated"),
    }

    if ptype in ("custom", "unknown") or (price is None and ptype != "free"):
        base["normalized"] = None
        base["note"] = ("Custom / contact-sales pricing — not directly comparable."
                        if ptype == "custom" else "Pricing not publicly available.")
        return base

    if ptype == "free" and price is None:
        price = 0

    annual_src = _annualize(price, freq)
    annual_inr, rate, rate_date, source = fx.convert(annual_src, currency, target)
    monthly_inr = round(annual_inr / 12, 2) if annual_inr is not None else None
    per_user_year = round(annual_inr / users, 2) if (annual_inr is not None and users) else None
    per_user_month = round(per_user_year / 12, 2) if per_user_year is not None else None

    base["normalized"] = {
        "currency": target,
        "annual": annual_inr,
        "monthly": monthly_inr,
        "per_user_year": per_user_year,
        "per_user_month": per_user_month,
        "fx_rate": rate,
        "fx_rate_date": rate_date,
        "fx_source": source,
    }
    base["note"] = ""
    return base


def _default_label(pricing):
    price = pricing.get("price")
    cur = pricing.get("currency", "USD")
    freq = pricing.get("billing_frequency", "")
    if pricing.get("price_type") == "custom":
        return "Contact Sales"
    if pricing.get("price_type") == "free" or price == 0:
        return "Free"
    if price is None:
        return "Not publicly available"
    sym = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹"}.get(cur, cur + " ")
    suffix = "/mo" if (freq or "").lower().startswith("month") else "/yr" if (freq or "").lower().startswith("year") or (freq or "").lower().startswith("annual") else ""
    return f"{sym}{price:g}{suffix}"
