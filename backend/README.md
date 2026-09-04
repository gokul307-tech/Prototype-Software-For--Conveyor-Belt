# Intelligent Conveyor Belt Health Monitoring - Backend

Flask backend with SQLite database, Random Forest ML predictions, and YOLO vision inference.

## Project Structure

```
backend/
├── app.py                          # Flask application factory
├── config.py                       # Configuration management
├── database.py                     # SQLAlchemy models (sensor_readings, predictions, alerts, vision_inspections)
├── model_loader.py                 # ML model loading and inference
├── routes.py                       # API endpoints
├── simulator.py                    # Sensor data simulator
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables
├── conveyor_monitoring.db          # SQLite database (auto-created)
└── models/
    ├── random_forest/
    │   ├── model.pkl               # Trained Random Forest model
    │   └── feature_columns.json    # Feature configuration
    └── yolo/
        └── best.pt                 # Trained YOLO model
```

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Flask Backend

```bash
python app.py
```

Expected output:
```
✓ Random Forest model loaded from backend/models/random_forest/model.pkl
  Features: ['acceleration_rms', 'gyro_rms', 'temperature', 'current', 'belt_speed', 'belt_tension', 'days_since_repair']
  Classes: ['HEALTHY', 'WARNING', 'HIGH_RISK', 'RUPTURE']
✓ YOLO model loaded from backend/models/yolo/best.pt
 * Running on http://0.0.0.0:5000
```

The backend is now running at `http://localhost:5000`

### 3. Run the Simulator (in a separate terminal)

```bash
cd backend
python simulator.py
```

The simulator will:
- Send sensor readings every 5 seconds
- Randomize between healthy/warning/high_risk/rupture scenarios
- Display prediction results from the Real Random Forest model

Expected output:
```
============================================================
Conveyor Monitoring Simulator
============================================================
Backend URL: http://localhost:5000/api
Joint ID: joint_01
Interval: 5 seconds
============================================================

[2024-01-15 10:30:45] ✓ Sensor data sent successfully
  Joint: joint_01
  Scenario: healthy
  Prediction: HEALTHY
  Confidence: 0.9823
  Alert Created: False
  Sensor ID: 1
```

---

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Sensor Data (ESP32 or Simulator)
```bash
POST /api/sensors
Content-Type: application/json

{
  "joint_id": "joint_01",
  "acceleration_rms": 0.45,
  "gyro_rms": 0.8,
  "temperature": 45.2,
  "current": 2.0,
  "belt_speed": 1.5,
  "belt_tension": 100.0,
  "days_since_repair": 30
}
```

Response (201 Created):
```json
{
  "status": "success",
  "sensor_reading_id": 1,
  "prediction": "HEALTHY",
  "confidence": 0.9823,
  "alert_created": false,
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### Vision Inspection (YOLO)
```bash
POST /api/vision/inspect
Content-Type: multipart/form-data

file: <image_file>
joint_id: joint_01
```

### Video Detection (YOLO)
```bash
POST /api/vision/detect-video
Content-Type: multipart/form-data

video: <mp4|avi|mov|mkv|webm>
joint_id: joint_01
```

The response contains `video_url`, frame counts, duration, status, and detection summaries. The generated MP4 is served by `GET /api/vision/video/<filename>` and is stored under `backend/processed_videos/` at runtime.

Useful environment variables:

```bash
YOLO_CONFIDENCE_THRESHOLD=0.35
ALERT_COOLDOWN_SECONDS=30
VIDEO_INFERENCE_INTERVAL=1
ESP32_CAM_URL=http://192.168.1.50/
```

Response (201 Created):
```json
{
  "status": "success",
  "inspection_id": 1,
  "joint_id": "joint_01",
  "overall_status": "NO_DEFECTS",
  "detection_count": 0,
  "detections": [],
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### Dashboard
```bash
GET /api/dashboard
```

Returns summary of all system data:
```json
{
  "status": "success",
  "summary": {
    "total_sensor_readings": 150,
    "total_predictions": 150,
    "active_alerts": 3,
    "status_breakdown": {
      "HEALTHY": 100,
      "WARNING": 30,
      "HIGH_RISK": 15,
      "RUPTURE": 5
    }
  },
  "latest_predictions": [...],
  "active_alerts": [...],
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### History
```bash
GET /api/history?joint_id=joint_01&limit=100
```

Returns sensor readings with associated predictions.

### Alerts
```bash
GET /api/alerts?active_only=true&limit=50
```

Returns alert history.

### Joints
```bash
GET /api/joints
```

Returns status of all joints with latest predictions and alerts.

---

## Simulator Usage

### Send single reading with specific scenario:
```bash
python simulator.py --scenario healthy --joint-id joint_01
python simulator.py --scenario warning --joint-id joint_02
python simulator.py --scenario high_risk --joint-id joint_03
python simulator.py --scenario rupture --joint-id joint_04
```

### Continuous simulation with custom settings:
```bash
# Send 20 random readings every 3 seconds
python simulator.py --count 20 --interval 3

# Send to different backend URL
python simulator.py --backend-url http://192.168.1.100:5000/api

# Simulate multiple joints
python simulator.py --joint-id joint_02
python simulator.py --joint-id joint_03
```

---

## Database Schema

### sensor_readings
- **id** (INTEGER, Primary Key)
- **timestamp** (DATETIME, auto-set)
- **joint_id** (STRING)
- **acceleration_rms** (FLOAT)
- **gyro_rms** (FLOAT)
- **temperature** (FLOAT)
- **current** (FLOAT)
- **belt_speed** (FLOAT)
- **belt_tension** (FLOAT)
- **days_since_repair** (FLOAT)

### predictions
- **id** (INTEGER, Primary Key)
- **timestamp** (DATETIME, auto-set)
- **joint_id** (STRING)
- **sensor_reading_id** (INTEGER, Foreign Key)
- **prediction** (STRING) - HEALTHY, WARNING, HIGH_RISK, RUPTURE
- **confidence** (FLOAT) - 0.0 to 1.0
- **model_type** (STRING) - 'random_forest'

### alerts
- **id** (INTEGER, Primary Key)
- **timestamp** (DATETIME, auto-set)
- **joint_id** (STRING)
- **prediction_id** (INTEGER, Foreign Key)
- **severity** (STRING) - HIGH_RISK or RUPTURE
- **message** (STRING)
- **is_active** (BOOLEAN)
- **resolved_at** (DATETIME, nullable)

### vision_inspections
- **id** (INTEGER, Primary Key)
- **timestamp** (DATETIME, auto-set)
- **joint_id** (STRING)
- **image_path** (STRING)
- **overall_status** (STRING, JSON) - Detection results
- **detection_count** (INTEGER)

---

## How It Works

### Sensor Prediction Flow
1. **Sensor Data Arrives** → POST /api/sensors
2. **Validation** → Check data types and required fields
3. **Database Store** → Save to sensor_readings table
4. **Model Prediction** → Load Random Forest from cache
5. **Real Inference** → predict() + predict_proba() on actual model
6. **Database Save** → Store prediction in predictions table
7. **Alert Creation** → If HIGH_RISK or RUPTURE, create alert
8. **Response** → Return prediction + confidence to client

### Vision Inspection Flow
1. **Image Arrives** → POST /api/vision/inspect
2. **File Handling** → Save temporarily
3. **YOLO Inference** → Load YOLO from cache, run detection
4. **Result Processing** → Extract bounding boxes and classes
5. **Database Save** → Store results in vision_inspections table
6. **Response** → Return detections and overall status

### Model Loading
- Models are loaded **once at startup** using a Singleton pattern
- Cached in memory for fast inference
- No retraining or modification of models
- Random Forest supports predict_proba() for confidence scores

---

## Configuration

Edit `config.py` to adjust:
- Database URI
- Model paths
- Alert thresholds
- Confidence thresholds

---

## Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Verify requirements.txt installed: `pip list | grep -E Flask\|torch\|scikit`
- Check if port 5000 is available: `netstat -ano | findstr :5000`

### "Model not loaded" error
- Verify model files exist: `ls backend/models/random_forest/model.pkl`
- Check feature_columns.json is valid JSON
- Check permissions on model files

### Simulator won't connect
- Ensure backend is running on correct URL
- Check firewall allowing 5000 port
- Use `--backend-url` to override default

### YOLO model warnings
- YOLO is optional for MVP
- Sensor endpoints work without it
- Vision endpoints require YOLO

---

## Next Steps (Not Yet Implemented)

1. **Frontend Dashboard** - React/Vue visualization
2. **Email Alerts** - SMTP integration for critical alerts
3. **Real ESP32 Integration** - Connect physical sensors
4. **Model Monitoring** - Track prediction accuracy over time
5. **Authentication** - API key / JWT tokens
6. **Data Export** - CSV/Excel reports

---

## Example Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Send sensor data
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "joint_id": "joint_01",
    "acceleration_rms": 0.5,
    "gyro_rms": 1.0,
    "temperature": 45.0,
    "current": 2.0,
    "belt_speed": 1.5,
    "belt_tension": 100.0,
    "days_since_repair": 30
  }'

# Get dashboard
curl http://localhost:5000/api/dashboard

# Get history
curl http://localhost:5000/api/history?joint_id=joint_01
```

---

## Performance Notes

- Predictions complete in <10ms (Random Forest is fast)
- Models cached in memory (no disk I/O per prediction)
- SQLite suitable for this workload (~1000 readings/hour)
- YOLO inference may take 100-500ms depending on image size
