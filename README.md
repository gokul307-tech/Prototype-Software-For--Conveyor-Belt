# Intelligent Conveyor Monitoring System

A professional industrial monitoring application for conveyor belt health, predictive maintenance, and vision-based defect detection.

This project combines a Flask backend, a React dashboard, AI-based health prediction, and computer vision inspection for real-time monitoring of conveyor belt conditions.

## Overview

The system is designed for industrial environments where continuous monitoring is required for:

- conveyor belt wear and health
- vibration and thermal anomalies
- joint condition monitoring
- real-time sensor trends
- AI-based predictive maintenance
- visual defect detection from uploaded belt images

The dashboard provides a dark industrial interface with live sensor cards, charts, alerts, AI predictions, and a vision inspection panel.

## Features

- Live sensor monitoring from backend API
- Real-time dashboard refresh using polling
- AI-powered health prediction using a Random Forest model
- Joint health summary and risk classification
- Visual defect detection with YOLO-based inspection
- Alert generation and active issue tracking
- Trend charts for sensor history and health metrics
- Dark industrial dashboard design for factory monitoring
- REST API layer for integration with sensors or external systems

## Project Structure

```text
intelligent-conveyor-monitoring/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── model_loader.py
│   ├── routes.py
│   ├── models/
│   │   ├── random_forest/
│   │   │   ├── feature_columns.json
│   │   │   └── model.pkl
│   │   └── yolo/
│   │       └── best.pt
│   ├── simulator.py
│   ├── requirements.txt
│   └── conveyor_monitoring.db
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── README.md
├── SYSTEM_GUIDE.md
└── .venv/
```

## Tech Stack

### Backend
- Python
- Flask
- Flask-SQLAlchemy
- SQLite
- scikit-learn / Random Forest model
- Ultralytics YOLO
- Pillow / NumPy for image processing

### Frontend
- React 18
- React Scripts
- Axios
- Recharts
- Lucide React
- CSS custom styling

## Prerequisites

Before running the project, ensure the following are installed:

- Python 3.10+
- Node.js 18+
- npm
- Git

## Backend Setup

1. Open a terminal in the project root.
2. Create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

3. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Start the Flask API:

```bash
python app.py
```

The API should run on:

- http://localhost:5000

## Frontend Setup

1. Open a new terminal.
2. Navigate to the frontend folder:

```bash
cd frontend
```

3. Install frontend dependencies:

```bash
npm install
```

4. Start the React dashboard:

```bash
npm start
```

The frontend typically runs on:

- http://localhost:3002

> The dashboard may select an alternate port if 3000 is occupied, as seen in this project setup.

## Running the Full System

Start both services:

1. Backend API
2. Frontend dashboard

Then open the dashboard in the browser and it will automatically fetch data from the Flask backend.

## API Endpoints

The backend exposes the following main routes:

- GET /api/health
- GET /api/dashboard
- GET /api/history
- GET /api/joints
- GET /api/alerts
- POST /api/sensors
- POST /api/vision/inspect

These endpoints are used to:

- fetch system status
- display live readings
- render time-series charts
- retrieve prediction summaries
- upload and inspect images for belt damage

## Data Flow

The application follows this flow:

1. sensor data is collected or simulated
2. the backend receives readings via /api/sensors
3. the health model predicts conveyor condition
4. the dashboard polls the API for updated state
5. the UI renders alerts, trend charts, and health panels
6. belt images can be submitted to the vision endpoint for defect analysis

## Database

The system uses SQLite for local persistence. The database is created automatically when the Flask app starts.

Main records include:

- sensor readings
- prediction results
- alert events
- vision inspection results

## Vision AI

The inspection endpoint uses a YOLO model stored in:

```text
backend/models/yolo/best.pt
```

Users can upload a conveyor image and the backend runs the model to detect issues such as:

- tears
- holes
- punctures
- other visible belt damage

## Model Files

The project includes trained model artifacts under the backend model folders:

- backend/models/random_forest/model.pkl
- backend/models/random_forest/feature_columns.json
- backend/models/yolo/best.pt

## Environment Notes

This project uses a local Python virtual environment in:

```text
.venv/
```

Do not commit the virtual environment or generated runtime artifacts.

## Development Notes

- the backend is configured for local development on port 5000
- the frontend uses a React app and runs independently from the API
- data is refreshed automatically from the backend via polling
- the dashboard is designed for industrial monitoring and predictive maintenance use cases

## Suggested Production Enhancements

- add authentication for admin/dashboard access
- deploy backend as a production WSGI service
- add Docker support for backend and frontend
- store predictions in a proper database service
- add monitoring, logging, and error dashboards
- improve detection models with larger defect datasets
- add camera integration for continuous belt inspection

## License

This project is intended for educational and industrial prototype use unless otherwise specified by the project owner.

## Contact / Usage

This project is designed for intelligent conveyor health monitoring and predictive maintenance research and demonstration. It can be extended for a real plant deployment with sensor integration, industrial dashboards, and model retraining pipelines.
