from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class SensorReading(db.Model):
    """Store individual sensor readings from ESP32 or simulator."""
    __tablename__ = 'sensor_readings'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    joint_id = db.Column(db.String(50), nullable=False)
    acceleration_rms = db.Column(db.Float, nullable=False)
    gyro_rms = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    current = db.Column(db.Float, nullable=False)
    belt_speed = db.Column(db.Float, nullable=False)
    belt_tension = db.Column(db.Float, nullable=False)
    days_since_repair = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'joint_id': self.joint_id,
            'acceleration_rms': self.acceleration_rms,
            'gyro_rms': self.gyro_rms,
            'temperature': self.temperature,
            'current': self.current,
            'belt_speed': self.belt_speed,
            'belt_tension': self.belt_tension,
            'days_since_repair': self.days_since_repair,
        }

class Prediction(db.Model):
    """Store ML model predictions for sensor data."""
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    joint_id = db.Column(db.String(50), nullable=False)
    sensor_reading_id = db.Column(db.Integer, db.ForeignKey('sensor_readings.id'), nullable=False)
    prediction = db.Column(db.String(50), nullable=False)  # HEALTHY, WARNING, HIGH_RISK, RUPTURE
    confidence = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    model_type = db.Column(db.String(50), default='random_forest', nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'joint_id': self.joint_id,
            'sensor_reading_id': self.sensor_reading_id,
            'prediction': self.prediction,
            'confidence': round(self.confidence, 4),
            'model_type': self.model_type,
        }

class Alert(db.Model):
    """Store alerts for HIGH_RISK or RUPTURE predictions."""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    joint_id = db.Column(db.String(50), nullable=False)
    prediction_id = db.Column(db.Integer, db.ForeignKey('predictions.id'), nullable=False)
    severity = db.Column(db.String(50), nullable=False)  # HIGH_RISK or RUPTURE
    message = db.Column(db.String(500), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'joint_id': self.joint_id,
            'prediction_id': self.prediction_id,
            'severity': self.severity,
            'message': self.message,
            'is_active': self.is_active,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }

class VisionInspection(db.Model):
    """Store YOLO vision inspection results."""
    __tablename__ = 'vision_inspections'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    joint_id = db.Column(db.String(50), nullable=False)
    image_path = db.Column(db.String(500), nullable=False)
    overall_status = db.Column(db.String(100), nullable=False)  # JSON string with detections
    detection_count = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'joint_id': self.joint_id,
            'image_path': self.image_path,
            'overall_status': json.loads(self.overall_status) if self.overall_status else {},
            'detection_count': self.detection_count,
        }
