from fastapi import Request

from .service import ReturnsService


# The service is built once in the app's lifespan and kept on app.state; routes
# depend on this, and tests override it to inject a service with a fake fetcher.
def get_returns_service(request: Request) -> ReturnsService:
    return request.app.state.returns_service
