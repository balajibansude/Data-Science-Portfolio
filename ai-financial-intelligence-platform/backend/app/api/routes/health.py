from fastapi import APIRouter, status

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check() -> dict[str, str]:
    """Return process liveness only; dependency checks will be added later."""
    return {"status": "ok"}
