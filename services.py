from sqlalchemy.orm import Session
from models import User
from s2sphere import CellId, LatLng
import math

# 🔹 S2 cell
def get_s2_cell(lat: float, lng: float) -> CellId:
    latlng = LatLng.from_degrees(lat, lng)
    return CellId.from_lat_lng(latlng).parent(12)  # level 12 = good balance

# 🔹 Get neighbor cells (IMPORTANT 🔥)
def get_neighbor_cells(cell: CellId):
    neighbors = []
    cell.get_all_neighbors(cell.level(), neighbors)
    return neighbors

# 🔹 Haversine
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

# 🔹 Create user
def create_user(db: Session, name: str, lat: float, lng: float):
    cell = get_s2_cell(lat, lng)

    user = User(
        name=name,
        latitude=lat,
        longitude=lng,
        s2_cell_id=cell.id()
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# 🔹 Nearby users (S2 neighbors + Haversine)
def get_nearby_users(db: Session, lat: float, lng: float, radius: int):
    base_cell = get_s2_cell(lat, lng)

    neighbor_cells = get_neighbor_cells(base_cell)

    cell_ids = [base_cell.id()] + [c.id() for c in neighbor_cells]

    # 🔥 Query only relevant cells
    candidates = db.query(User).filter(
        User.s2_cell_id.in_(cell_ids)
    ).all()

    nearby = []

    for user in candidates:
        dist = haversine(lat, lng, user.latitude, user.longitude)
        if dist <= radius:
            nearby.append({
                "id": user.id,
                "name": user.name,
                "latitude": user.latitude,
                "longitude": user.longitude,
                "distance": round(dist, 2)
            })

    return nearby[:50]