from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db import SessionLocal
import schemas
import services
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Geo Matching API (S2 Version) 🚀")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for now (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def health():
    return {"status": "running"}

@app.get("/kaithheathcheck")
def kaithhealth_check():
    return {"status": "healthy"}

@app.get("/kaithhealthcheck")
def kaith_health_check():
    return {"status": "healthy"}

@app.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return services.create_user(db, user.name, user.latitude, user.longitude)

@app.get("/nearby")
def nearby_users(lat: float, lng: float, radius: int = 5000, db: Session = Depends(get_db)):
    return services.get_nearby_users(db, lat, lng, radius)

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run("main:app", host="0.0.0.0", port=port)