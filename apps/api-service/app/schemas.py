# Request and response models.
# These also define the OpenAPI schema, which the TypeScript SDK in libs/sdk is generated from.
from __future__ import annotations

import datetime

from pydantic import BaseModel, ConfigDict, Field


# A single day's percentage return for one ticker.
class ReturnPoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: datetime.date = Field(description="Trading day, formatted YYYY-MM-DD.")
    # `return` is a reserved word in Python, so the field is named `daily_return`
    # and serialises to/from the JSON key `return` via an alias.
    daily_return: float = Field(
        alias="return",
        description="Daily return as a fraction, close-over-previous-close.",
    )


# The /returns payload is a plain object keyed by ticker symbol, each mapping
# to that ticker's ordered list of daily returns, e.g.:
#   {"AMZN": [{"date": "2024-01-02", "return": 0.007}, ...], "MSFT": [...]}
ReturnsResponse = dict[str, list[ReturnPoint]]


class ErrorResponse(BaseModel):
    """Consistent error envelope returned for 4xx/5xx responses."""

    detail: str = Field(description="Human-readable description of the error.")
