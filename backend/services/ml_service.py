"""
Kisan Setu - ML Service Adapter
===============================
Provides bridge between FastAPI routers and Scikit-learn recommendation models.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml_pipeline_stub import recommender, wait_predictor


class MLService:
    @staticmethod
    def get_center_recommendations(
        farmer_coords: Dict[str, float],
        centers: List[Dict[str, Any]],
        quantity_quintals: float = 50.0,
        hour_of_day: int = 10
    ) -> Dict[str, Any]:
        """Calculates multi-criteria ranked centers using ML model."""
        return recommender.recommend(
            farmer_coords=farmer_coords,
            centers=centers,
            quantity_quintals=quantity_quintals,
            hour_of_day=hour_of_day
        )

    @staticmethod
    def predict_wait_mins(
        current_queue_length: int,
        avg_processing_mins: float = 12.0,
        hour_of_day: int = 10,
        capacity_utilization: float = 0.5,
        quantity_quintals: float = 50.0
    ) -> int:
        """Infers estimated wait time in minutes."""
        return wait_predictor.predict(
            current_queue_length=current_queue_length,
            avg_processing_mins=avg_processing_mins,
            hour_of_day=hour_of_day,
            capacity_utilization=capacity_utilization,
            quantity_quintals=quantity_quintals
        )
