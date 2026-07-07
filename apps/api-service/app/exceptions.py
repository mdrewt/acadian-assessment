# Application errors and the FastAPI handler that turns them into JSON.
#
# Raising one of these anywhere in the service layer produces a consistent error
# envelope (see schemas.ErrorResponse) with the right status code, so the
# routing code doesn't have to translate errors itself.

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# Base class for expected, translatable application errors.
class AppError(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


# The requested date range doesn't make sense (e.g. start after end).
class InvalidDateRangeError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST


# The upstream market-data provider could not be reached or failed.
class DataFetchError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY


async def _app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# Register the handler for AppError and its subclasses.
def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)  # type: ignore[arg-type]
