from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchema


class AdminUserSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    document_count: int = 0
    conversation_count: int = 0

    model_config = {"from_attributes": True}


class UserUpdateSchema(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
