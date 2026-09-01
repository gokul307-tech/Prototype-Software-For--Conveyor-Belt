# 🟢 INTELLIGENT CONVEYOR BELT HEALTH MONITORING - COMPLETE SYSTEM

## **System Status: FULLY OPERATIONAL**

### **Three Components Running:**

1. **Backend (Flask)** - http://localhost:5000 ✅
2. **Simulator (Sensor Data)** - Running continuously ✅
3. **Frontend (React)** - http://localhost:3000 ✅

---

## 🚀 **QUICK START**

### **Backend is already running:** ✅
```
✓ Random Forest model loaded
✓ YOLO model loaded
✓ Database created with 4 tables
✓ All 7 API endpoints live
→ Access: http://localhost:5000/api
```

### **Simulator is already running:** ✅
```
→ Continuously sending sensor data every 5 seconds
→ Generating HEALTHY, WARNING, HIGH_RISK, RUPTURE scenarios
→ Real Random Forest predictions (NOT hard-coded)
→ Automatic alert creation for anomalies
```

### **Frontend is already running:** ✅
```
→ React dashboard compiled successfully
→ Access: http://localhost:3000
→ Live updates every 5 seconds
→ Professional dark theme UI
```

---

## 🌐 **ACCESS THE SYSTEM**

### **Open in Browser:**
```
📊 Dashboard:  http://localhost:3000
🔧 Backend API: http://localhost:5000/api
```

---

## 📊 **DASHBOARD FEATURES**

### **Tab 1: Dashboard**
- 📈 Total sensor readings counter
- 📊 Total predictions counter
- 🚨 Active alerts counter
- 📉 Health status breakdown (pie chart)
- 🎯 Latest 10 predictions with confidence scores
- ⚠️ Active alerts preview

### **Tab 2: Joint Status**
- 🔧 Equipment cards for each joint
- 📌 Latest prediction status
- 🌡️ Current temperature
- 📍 Belt speed, tension, current
- 🔴 Active alert badges
- Real-time sensor data display

### **Tab 3: Alerts**
- 🚨 All active HIGH_RISK alerts
- ⛔ All active RUPTURE alerts
- 📅 Alert timestamps
- 📝 Detailed alert messages
- ✅ Status (active/resolved)

### **Tab 4: History**
- 📜 Historical sensor readings
- 🔍 Filter by joint ID
- 📊 Configurable time windows (20/50/100/200 records)
- 📋 Sensor data breakdown
- 💾 Expandable details

---

## 🔌 **API ENDPOINTS**

### **Health Check**
```bash
GET /api/health
```

### **Receive Sensor Data** (ESP32 or Simulator)
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

**Response (201 Created):**
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

### **Vision Inspection** (YOLO)
```bash
POST /api/vision/inspect
Content-Type: multipart/form-data

file: <image_file.jpg>
joint_id: joint_01
```

### **Dashboard Summary**
```bash
GET /api/dashboard
```

### **Historical Data**
```bash
GET /api/history?joint_id=joint_01&limit=100
```

### **Active Alerts**
```bash
GET /api/alerts?active_only=true&limit=50
```

### **Joint Status Overview**
```bash
GET /api/joints
```

---

## 💾 **DATABASE SCHEMA**

### **sensor_readings**
- id, timestamp, joint_id
- acceleration_rms, gyro_rms, temperature
- current, belt_speed, belt_tension, days_since_repair

### **predictions**
- id, timestamp, joint_id, sensor_reading_id
- prediction (HEALTHY/WARNING/HIGH_RISK/RUPTURE)
- confidence (0.0-1.0 from predict_proba)
- model_type (random_forest)

### **alerts**
- id, timestamp, joint_id, prediction_id
- severity (HIGH_RISK or RUPTURE)
- message, is_active, resolved_at

### **vision_inspections**
- id, timestamp, joint_id, image_path
- overall_status (JSON with detections), detection_count

---

## 🤖 **ML MODELS**

### **Random Forest Sensor Prediction**
- **Location:** `backend/models/random_forest/model.pkl`
- **Features (7):** acceleration_rms, gyro_rms, temperature, current, belt_speed, belt_tension, days_since_repair
- **Classes (4):** HEALTHY, WARNING, HIGH_RISK, RUPTURE
- **Prediction:** Uses `predict()` for class, `predict_proba()` for confidence
- **Status:** ✅ Loaded at startup, cached in memory

### **YOLO Vision Detection**
- **Location:** `backend/models/yolo/best.pt`
- **Model:** YOLOv8 (PyTorch format)
- **Inference:** Detects defects/anomalies in conveyor belt images
- **Status:** ✅ Loaded at startup, cached in memory

---

## 📁 **PROJECT STRUCTURE**

```
intelligent-conveyor-monitoring/
├── backend/
│   ├── app.py                      # Flask application factory
│   ├── config.py                   # Configuration (dev/prod)
│   ├── database.py                 # SQLAlchemy ORM models
│   ├── model_loader.py             # ML model loading (Singleton)
│   ├── routes.py                   # 7 API endpoints
│   ├── simulator.py                # Sensor data simulator
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment variables
│   ├── conveyor_monitoring.db      # SQLite database (auto-created)
│   └── models/
│       ├── random_forest/
│       │   ├── model.pkl           # Trained Random Forest
│       │   └── feature_columns.json # Feature configuration
│       └── yolo/
│           └── best.pt             # Trained YOLO model
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                  # Main dashboard component
        ├── App.css                 # Professional dark theme
        ├── index.js
        └── components/
            ├── Dashboard.js        # Summary & predictions
            ├── Alerts.js           # Alert display
            ├── JointStatus.js      # Equipment status cards
            └── History.js          # Historical data viewer
```

---

## 🔄 **DATA FLOW**

```
ESP32 / Simulator
       ↓
POST /api/sensors
       ↓
Flask Backend
       ↓
[Validate Data]
       ↓
[Save to SQLite]
       ↓
[Load Random Forest Model (cached)]
       ↓
[Run Prediction + predict_proba]
       ↓
[Save Prediction + Confidence]
       ↓
[Create Alert if HIGH_RISK/RUPTURE]
       ↓
[Return JSON]
       ↓
React Dashboard (refreshes every 5s)
```

---

## 🧪 **TEST THE SYSTEM**

### **Test Health Check:**
```bash
curl http://localhost:5000/api/health
```

### **Test Dashboard:**
```bash
curl http://localhost:5000/api/dashboard | python -m json.tool
```

### **Test Joint Status:**
```bash
curl http://localhost:5000/api/joints | python -m json.tool
```

### **Send Custom Sensor Data:**
```bash
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
  }' | python -m json.tool
```

---

## 📊 **SIMULATOR SCENARIOS**

### **HEALTHY**
- Low vibration (0.1-0.5)
- Normal temperature (35-50°C)
- Normal current (1.5-2.5A)
- High confidence in HEALTHY prediction

### **WARNING**
- Moderate vibration (0.5-1.2)
- Elevated temperature (50-65°C)
- Increased current (2.3-3.2A)
- Degradation detected

### **HIGH_RISK**
- High vibration (1.2-2.5)
- High temperature (65-80°C)
- High current (3.0-4.5A)
- **Alert automatically created** ⚠️

### **RUPTURE**
- Critical vibration (2.5-5.0)
- Extreme temperature (75-95°C)
- Critical current (4.0-6.0A)
- **Alert automatically created** ⛔

---

## 🎯 **KEY FEATURES IMPLEMENTED**

✅ **Real Machine Learning**
- Actual Random Forest predictions (NOT hard-coded)
- predict_proba() for confidence scores
- Models cached in memory for performance

✅ **Realistic Simulator**
- Multiple scenario generation
- Sensor data patterns for each health state
- Continuous stream (5-second intervals)

✅ **Complete Backend**
- 7 production-ready API endpoints
- SQLite persistence
- CORS support for frontend
- Error handling & validation
- Automatic alert creation

✅ **Professional Frontend**
- Real-time React dashboard
- Dark theme with 4 tabs
- Live auto-updating (5-second refresh)
- Responsive grid layout
- Filter & search capabilities

✅ **Automatic Database**
- SQLite auto-created on first run
- 4 normalized tables
- Foreign key relationships
- Indexed for performance

---

## ⚙️ **SIMULATOR COMMANDS**

### **Run specific scenario:**
```bash
cd backend
python simulator.py --scenario healthy       # All readings = HEALTHY
python simulator.py --scenario warning       # All readings = WARNING
python simulator.py --scenario high_risk     # All readings = HIGH_RISK
python simulator.py --scenario rupture       # All readings = RUPTURE
```

### **Custom settings:**
```bash
python simulator.py --count 20 --interval 2  # 20 readings, every 2 seconds
python simulator.py --joint-id joint_02      # Different joint
python simulator.py --backend-url http://192.168.1.100:5000/api  # Different backend
```

### **Simulate multiple joints** (run in separate terminals):
```bash
Terminal 1: python simulator.py --joint-id joint_01
Terminal 2: python simulator.py --joint-id joint_02
Terminal 3: python simulator.py --joint-id joint_03
```

---

## 🔐 **NEXT STEPS (OPTIONAL ENHANCEMENTS)**

1. **Email Alerts** - SMTP integration for critical alerts
2. **Real ESP32 Integration** - Connect physical sensors via WiFi
3. **Model Monitoring** - Track prediction accuracy over time
4. **Authentication** - API keys / JWT tokens
5. **Data Export** - CSV/Excel reports
6. **Production Deployment** - Docker containerization
7. **Advanced Analytics** - ML model retraining pipeline
8. **Mobile App** - React Native cross-platform

---

## 📝 **IMPORTANT NOTES**

### **Models are NOT Modified:**
- `model.pkl` and `best.pt` are read-only
- Only loaded into memory at startup
- Predictions are 100% real based on actual model

### **Database is Auto-Created:**
- No manual setup required
- Located at `backend/conveyor_monitoring.db`
- SQLite is lightweight and suitable for MVP

### **Simulator is NOT Hard-Coded:**
- Generates realistic sensor patterns per scenario
- Random Forest makes the final prediction
- Depends on actual model, not pre-set values

### **Frontend is Live:**
- Connects to real backend API
- Displays actual predictions & alerts
- Updates every 5 seconds automatically

---

## 🎓 **TECHNOLOGY STACK**

**Backend:**
- Python 3.14
- Flask 3.0.3
- SQLAlchemy (ORM)
- scikit-learn (Random Forest)
- PyTorch + ultralytics (YOLO)
- OpenCV (Image processing)
- SQLite (Database)

**Frontend:**
- React 18.2
- Axios (HTTP client)
- CSS3 (Custom dark theme)
- JavaScript ES6+

---

## 📞 **TROUBLESHOOTING**

### **Backend won't start:**
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Check port 5000 is free
netstat -ano | findstr :5000
```

### **Frontend won't start:**
```bash
# Delete node_modules and reinstall
cd frontend
rm -r node_modules package-lock.json
npm install
npm start
```

### **Models not loading:**
```bash
# Verify model files exist
ls backend/models/random_forest/model.pkl
ls backend/models/yolo/best.pt

# Check file permissions (should be readable)
```

### **No data showing in dashboard:**
- Wait 5-10 seconds for first update cycle
- Check browser console for errors (F12)
- Verify backend API is responding: `curl http://localhost:5000/api/health`
- Confirm simulator is running in its terminal

---

**Your Intelligent Conveyor Belt Health Monitoring System is LIVE and READY! 🚀**

Access the dashboard at: **http://localhost:3000**
