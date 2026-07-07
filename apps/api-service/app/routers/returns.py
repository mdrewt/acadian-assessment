# The /returns endpoint.
#
# Defined as a synchronous handler so FastAPI runs it in its worker threadpool:
# the underlying yfinance fetch is blocking I/O and must not sit on the async event loop.

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..dependencies import get_returns_service
from ..schemas import ErrorResponse, ReturnsResponse
from ..service import ReturnsService

router = APIRouter(tags=["returns"])


# Return each MAG7 ticker's daily percentage returns over [start, end].
@router.get(
    "/returns",
    response_model=ReturnsResponse,
    operation_id="getReturns",
    summary="Daily returns for the MAG7 stocks",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid date range"},
        422: {"model": ErrorResponse, "description": "Malformed query parameters"},
        502: {"model": ErrorResponse, "description": "Upstream data provider error"},
    },
)
def get_returns(
    service: Annotated[ReturnsService, Depends(get_returns_service)],
    start: Annotated[
        date,
        Query(description="Start of the range (inclusive), formatted YYYY-MM-DD."),
    ],
    end: Annotated[
        date,
        Query(description="End of the range (inclusive), formatted YYYY-MM-DD."),
    ],
) -> ReturnsResponse:
    return service.get_returns(start, end)
