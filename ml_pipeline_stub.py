"""
Kisan Setu - AI/ML Traffic Prediction & Center Recommendation Pipeline
======================================================================
Provides Scikit-learn based machine learning models and heuristics for:
1. Predicting procurement queue waiting time given center queue load, time of day, and crop volume.
2. Intelligent multi-criteria ranking to recommend the optimal procurement center for a farmer.

Can be run standalone to train synthetic weights or imported directly by FastAPI services.
"""

import math
from datetime import datetime
from typing import List, Dict, Any

try:
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class WaitTimePredictionModel:
    """
    Predicts waiting time (in minutes) for a farmer tractor/trolley arriving at a Mandi.
    Features:
      0: current_queue_length (count of vehicles ahead)
      1: avg_processing_mins (minutes needed per weighing & sampling)
      2: hour_of_day (0 - 23, peak hours typically 10:00 - 14:00)
      3: capacity_utilization_ratio (current_volume / daily_capacity)
      4: quantity_quintals (farmer load)
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self._initialize_or_train()

    def _initialize_or_train(self):
        if not SKLEARN_AVAILABLE:
            return

        # Generate synthetic training dataset representing typical Indian APMC mandi trends
        np.random.seed(42)
        n_samples = 1200

        # Feature simulation
        queue_lengths = np.random.randint(0, 45, n_samples)
        avg_processing = np.random.uniform(8.0, 18.0, n_samples)
        hours = np.random.randint(7, 19, n_samples)
        capacity_util = np.random.uniform(0.1, 1.2, n_samples)
        quantities = np.random.uniform(20.0, 200.0, n_samples)

        X = np.column_stack([queue_lengths, avg_processing, hours, capacity_util, quantities])

        # Target: wait time in minutes with non-linear congestion bottlenecks
        # Wait time = (queue * avg_proc) + peak hour penalty + capacity saturation penalty
        peak_penalty = np.where((hours >= 11) & (hours <= 14), 25.0, 0.0)
        saturation_penalty = np.where(capacity_util > 0.8, (capacity_util - 0.8) * 60.0, 0.0)
        noise = np.random.normal(0, 4.0, n_samples)

        y = (queue_lengths * avg_processing * 0.85) + peak_penalty + saturation_penalty + noise
        y = np.clip(y, 5.0, 600.0)  # Min 5 mins, max 10 hours

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = RandomForestRegressor(n_estimators=30, max_depth=6, random_state=42)
        self.model.fit(X_scaled, y)

    def predict(
        self,
        current_queue_length: int,
        avg_processing_mins: float = 12.0,
        hour_of_day: int = 10,
        capacity_utilization: float = 0.5,
        quantity_quintals: float = 50.0
    ) -> int:
        """Returns predicted wait time in integer minutes."""
        if SKLEARN_AVAILABLE and self.model is not None:
            features = np.array([[
                current_queue_length,
                avg_processing_mins,
                hour_of_day,
                capacity_utilization,
                quantity_quintals
            ]])
            scaled = self.scaler.transform(features)
            pred = self.model.predict(scaled)[0]
            return max(5, int(round(pred)))

        # Fallback robust heuristic when sklearn is not installed yet
        base_wait = current_queue_length * avg_processing_mins * 0.85
        peak_adder = 20 if 11 <= hour_of_day <= 14 else 0
        cap_adder = (capacity_utilization - 0.8) * 50 if capacity_utilization > 0.8 else 0
        total = base_wait + peak_adder + cap_adder
        return max(5, int(round(total)))


class SmartCenterRecommender:
    """
    Intelligently scores and ranks candidate procurement centers for a farmer.
    
    Composite Scoring Equation:
      Score = 100 - (w_dist * DistPenalty + w_wait * WaitPenalty + w_traffic * TrafficPenalty)
    """

    def __init__(self):
        self.wait_predictor = WaitTimePredictionModel()

    def calculate_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine distance formula between two GPS coordinates."""
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 1)

    def recommend(
        self,
        farmer_coords: Dict[str, float],
        centers: List[Dict[str, Any]],
        quantity_quintals: float = 50.0,
        hour_of_day: int = 9
    ) -> Dict[str, Any]:
        """
        Rank procurement centers and provide recommendation reasoning.
        """
        scored_centers = []

        for center in centers:
            # Determine distance (use GPS if coordinates provided, else fallback to distance_km_ref)
            if farmer_coords and "lat" in farmer_coords and "lng" in farmer_coords:
                dist_km = self.calculate_distance_km(
                    farmer_coords["lat"],
                    farmer_coords["lng"],
                    center.get("latitude", 29.68),
                    center.get("longitude", 76.99)
                )
            else:
                dist_km = center.get("distance_km", center.get("distance_km_ref", 10.0))

            queue_count = center.get("current_queue_count", 5)
            avg_proc = center.get("avg_processing_time_mins", 12.0)
            daily_cap = center.get("daily_capacity_quintals", 1000.0)
            cap_util = min(1.5, (queue_count * 50.0) / daily_cap)

            predicted_wait = self.wait_predictor.predict(
                current_queue_length=queue_count,
                avg_processing_mins=avg_proc,
                hour_of_day=hour_of_day,
                capacity_utilization=cap_util,
                quantity_quintals=quantity_quintals
            )

            # Determine traffic status badge
            if queue_count < 10:
                traffic_status = "LOW"      # Green
            elif queue_count <= 25:
                traffic_status = "MODERATE" # Amber
            else:
                traffic_status = "HIGH"     # Red

            # Multi-factor penalty scoring
            # Distance penalty: 1 km ~ 1.5 points penalty
            dist_penalty = dist_km * 1.5
            # Wait penalty: 10 mins ~ 2.0 points penalty
            wait_penalty = (predicted_wait / 10.0) * 2.0
            # Congestion penalty
            traffic_penalty = 15.0 if traffic_status == "HIGH" else (5.0 if traffic_status == "MODERATE" else 0.0)

            composite_score = max(10.0, round(100.0 - (dist_penalty + wait_penalty + traffic_penalty), 1))

            scored_centers.append({
                "center_id": center.get("id"),
                "name": center.get("name"),
                "code": center.get("code"),
                "distance_km": dist_km,
                "current_queue_count": queue_count,
                "estimated_wait_mins": predicted_wait,
                "traffic_status": traffic_status,
                "ai_score": composite_score,
                "daily_capacity_quintals": daily_cap,
                "operating_hours": center.get("operating_hours", "08:00 AM - 06:00 PM")
            })

        # Sort descending by composite score
        scored_centers.sort(key=lambda x: x["ai_score"], reverse=True)

        best_center = scored_centers[0] if scored_centers else None

        reasoning = ""
        if best_center:
            reasoning = (
                f"{best_center['name']} is the optimal choice: situated just {best_center['distance_km']} km away "
                f"with {best_center['traffic_status']} traffic ({best_center['current_queue_count']} vehicles queued). "
                f"Predicted wait time is only {best_center['estimated_wait_mins']} mins."
            )

        return {
            "best_center_id": best_center["center_id"] if best_center else None,
            "ai_reasoning": reasoning,
            "recommended_centers": scored_centers
        }


# Global singleton instance for quick backend import
recommender = SmartCenterRecommender()
wait_predictor = WaitTimePredictionModel()

if __name__ == "__main__":
    print("Testing ML Pipeline Stub...")
    sample_centers = [
        {
            "id": 1,
            "code": "KRN-01",
            "name": "Karnal New Grain Mandi",
            "latitude": 29.6857,
            "longitude": 76.9905,
            "distance_km": 7.5,
            "current_queue_count": 6,
            "avg_processing_time_mins": 11.0,
            "daily_capacity_quintals": 1500.0
        },
        {
            "id": 2,
            "code": "TAR-02",
            "name": "Taraori Sub-Yard Mandi",
            "latitude": 29.8012,
            "longitude": 76.9241,
            "distance_km": 16.2,
            "current_queue_count": 28,
            "avg_processing_time_mins": 14.0,
            "daily_capacity_quintals": 800.0
        }
    ]
    res = recommender.recommend(
        farmer_coords={"lat": 29.69, "lng": 76.98},
        centers=sample_centers,
        quantity_quintals=65.0
    )
    print("AI Best Pick:", res["best_center_id"])
    print("AI Reasoning:", res["ai_reasoning"])
    for c in res["recommended_centers"]:
        print(f" - {c['name']}: Score={c['ai_score']}, Wait={c['estimated_wait_mins']}m, Traffic={c['traffic_status']}")
