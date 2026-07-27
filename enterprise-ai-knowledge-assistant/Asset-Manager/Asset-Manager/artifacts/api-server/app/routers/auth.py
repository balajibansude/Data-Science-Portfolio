"""Auth routes: register, login, me."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegistration, UserLogin, UserSchema, AuthResponse
from app.auth.jwt import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: UserRegistration, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First registered user becomes admin
    is_first = db.query(User).count() == 0
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role="admin" if is_first else "user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(access_token=token, token_type="bearer", user=UserSchema.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(access_token=token, token_type="bearer", user=UserSchema.model_validate(user))


@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
