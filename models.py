from sqlalchemy import Column, Integer, String, Float, BigInteger, TIMESTAMP
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    s2_cell_id = Column(BigInteger, index=True)

    created_at = Column(TIMESTAMP, server_default=func.now())