import asyncio
import math
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FPS = 25


def get_frame(t: float) -> dict:
    """FAKE data. Later, replace this with your real LiDAR pipeline."""
    speed_kmh = 55 + 15 * math.sin(t * 0.2)

    return {
        "timestamp": time.time() * 1000,
        "vehicle_speed": round(speed_kmh, 1),
        "fps": FPS,
        "latency": round(19 + 3 * math.sin(t), 1),
        "range": "80 × 80 m",
        "fovea": {"near": 5, "mid": 15, "far": 50},
        "objects": [
            {"id": 1, "type": "vehicle",
             "x": 22 + 3 * math.sin(t * 0.5), "y": -1.8,
             "vx": 1.5 * math.cos(t * 0.5), "vy": 0.0},
            {"id": 2, "type": "pedestrian",
             "x": 12.0, "y": 4 * math.sin(t * 0.8),
             "vx": 0.0, "vy": 3.2 * math.cos(t * 0.8)},
            {"id": 3, "type": "hazard",
             "x": 30.0, "y": 3.2, "vx": 0.0, "vy": 0.0},
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def lidar_stream(websocket: WebSocket):
    await websocket.accept()
    start = time.time()
    try:
        while True:
            await websocket.send_json(get_frame(time.time() - start))
            await asyncio.sleep(1 / FPS)
    except WebSocketDisconnect:
        pass