"""
Kisan Setu - WebSocket Hub & Real-time Queue Sync Manager
=========================================================
Tracks connected client WebSockets per procurement center and broadcasts
instantaneous queue updates when an officer marks a farmer 'Done'.
"""

import json
from datetime import datetime
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Map: center_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, center_id: int, websocket: WebSocket):
        await websocket.accept()
        if center_id not in self.active_connections:
            self.active_connections[center_id] = []
        self.active_connections[center_id].append(websocket)
        print(f"[WebSocket] Client connected to Center #{center_id}. Active: {len(self.active_connections[center_id])}")

    def disconnect(self, center_id: int, websocket: WebSocket):
        if center_id in self.active_connections:
            if websocket in self.active_connections[center_id]:
                self.active_connections[center_id].remove(websocket)
            if not self.active_connections[center_id]:
                del self.active_connections[center_id]
        print(f"[WebSocket] Client disconnected from Center #{center_id}")

    async def broadcast_to_center(self, center_id: int, message: dict):
        """Broadcasts a JSON message payload to all clients listening to a specific center."""
        if center_id not in self.active_connections:
            return

        dead_connections = []
        payload = json.dumps(message)
        for connection in self.active_connections[center_id]:
            try:
                await connection.send_text(payload)
            except Exception as e:
                print(f"[WebSocket Error] Could not send to client: {e}")
                dead_connections.append(connection)

        # Cleanup dead sockets
        for dead in dead_connections:
            self.disconnect(center_id, dead)

    async def broadcast_queue_update(
        self,
        center_id: int,
        now_serving_token: int,
        total_waiting: int,
        traffic_status: str,
        avg_wait_time_mins: int,
        queue_snapshot: list = None
    ):
        """Standardized helper for queue decrement broadcasts."""
        message = {
            "event": "QUEUE_UPDATE",
            "center_id": center_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "now_serving_token": now_serving_token,
            "total_waiting": total_waiting,
            "traffic_status": traffic_status,
            "avg_wait_time_mins": avg_wait_time_mins,
            "queue_snapshot": queue_snapshot or []
        }
        await self.broadcast_to_center(center_id, message)


# Global singleton instance
ws_manager = ConnectionManager()
