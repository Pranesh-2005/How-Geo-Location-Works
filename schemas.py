from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    latitude: float
    longitude: float

class UserResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True