from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.predictions import router as predictions_router
from app.api.routes.training import router as training_router
from app.api.routes.uploads import router as uploads_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["operations"])
api_router.include_router(uploads_router, prefix="/datasets", tags=["datasets"])
api_router.include_router(training_router, prefix="/datasets", tags=["models"])
api_router.include_router(predictions_router, prefix="/models", tags=["models"])
