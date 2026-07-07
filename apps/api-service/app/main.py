from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import Settings, get_settings
from .exceptions import register_exception_handlers
from .routers import returns
from .service import ReturnsService

DESCRIPTION = "Daily percentage returns for the Magnificent Seven (MAG7) stocks, sourced from Yahoo Finance and computed with pandas."

# Build and configure the FastAPI application.
def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Instantiate the service once and share it across requests.
        app.state.returns_service = ReturnsService(settings)
        yield

    app = FastAPI(
        title="MAG7 Returns API",
        version=__version__,
        description=DESCRIPTION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(returns.router)

    return app


app = create_app()