"""
Kisan Setu - Main FastAPI Application Gateway & Real-Time WebSocket Server
==========================================================================
Smart India Hackathon digital procurement gateway.
Integrates slot booking, ML-driven center suggestions, real-time queue management,
DBT payment tracking, and Saarthi AI voice/text services.
"""

from contextlib import asynccontextmanager
import sys
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database import init_db
from backend.seed_data import seed_database
from backend.services.websocket_hub import ws_manager
from backend.routers import farmers, centers, slots, queue, payments, assistant


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed initial mandis & demo queue
    print("[Startup] Initializing database and running seeder...")
    init_db()
    seed_database()
    print("[Startup] Ready to serve Kisan Setu requests!")
    yield
    print("[Shutdown] Closing services.")


app = FastAPI(
    title="Kisan Setu API Gateway",
    description="SIH Digital Procurement Platform - Real-time Queue Tracking, AI Mandi Recommendations & Automated DBT",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(farmers.router, prefix="/api")
app.include_router(centers.router, prefix="/api")
app.include_router(slots.router, prefix="/api")
app.include_router(queue.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")


# Real-Time WebSocket Endpoint for Live Queue Sync
@app.websocket("/ws/queue/{center_id}")
async def websocket_queue_endpoint(websocket: WebSocket, center_id: int):
    """
    WebSocket channel for instant bi-directional updates between Mandi Officers and Farmers.
    Emits QUEUE_UPDATE whenever an officer calls next or marks done.
    """
    await ws_manager.connect(center_id, websocket)
    try:
        while True:
            # Keep connection open and accept client heartbeats / messages
            data = await websocket.receive_text()
            # Echo or process client ping if needed
            if data == "ping":
                await websocket.send_text('{"event":"pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(center_id, websocket)
    except Exception as e:
        print(f"[WebSocket Exception] {e}")
        ws_manager.disconnect(center_id, websocket)


@app.get("/")
def root():
    return {
        "platform": "Kisan Setu (किसान सेतु)",
        "purpose": "Smart India Hackathon Digital Procurement Prototype",
        "status": "ONLINE",
        "docs_url": "/docs",
        "websocket_endpoint": "/ws/queue/{center_id}",
        "endpoints": {
            "farmers": "/api/farmers",
            "centers": "/api/centers",
            "recommendations": "/api/centers/recommendations",
            "slots": "/api/slots",
            "queue": "/api/queue",
            "payments": "/api/payments",
            "assistant": "/api/assistant/query",
            "sms_feed": "/api/assistant/sms-feed"
        }
    }
