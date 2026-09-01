from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from database import db, SensorReading, Prediction, Alert, VisionInspection
from model_loader import ModelLoader, predict_health_status
from config import Config
import json
import os
import numpy as np
from PIL import Image, ImageFilter

api = Blueprint('api', __name__, url_prefix='/api')


def _fallback_damage_detection(image_path):
    """Fallback damage detection for torn conveyor belts when YOLO misses defects."""
    try:
        image = Image.open(image_path).convert('L')
        image = image.filter(ImageFilter.SHARPEN)
        arr = np.asarray(image)

        # Look for dark crack-like regions.
        dark_mask = arr < 180
        if not np.any(dark_mask):
            return []

        # Use a simple connected-component approach for dark crack/tear regions.
        from scipy import ndimage
        labeled, num_features = ndimage.label(dark_mask)
        detections = []

        for idx in range(1, num_features + 1):
            coords = np.argwhere(labeled == idx)
            if len(coords) < 20:
                continue

            y_min, x_min = coords.min(axis=0)
            y_max, x_max = coords.max(axis=0)
            width = int(x_max - x_min + 1)
            height = int(y_max - y_min + 1)

            if width * height < 50:
                continue

            ratio = width / max(height, 1)
            if ratio < 0.2 and width < 30:
                continue

            score = min(0.99, max(0.55, (len(coords) / max(width * height, 1)) * 10))
            detections.append({
                'class': 'Tear',
                'confidence': float(round(score, 3)),
                'box': {
                    'x1': float(x_min),
                    'y1': float(y_min),
                    'x2': float(x_max),
                    'y2': float(y_max),
                }
            })

        # Sort by confidence descending and keep top results.
        detections.sort(key=lambda d: d['confidence'], reverse=True)
        return detections[:5]
    except Exception:
        return []


@api.route('/sensors', methods=['POST'])
def receive_sensor_data():
    """
    Receive sensor data from ESP32 or simulator.
    
    Expected JSON:
    {
        "joint_id": "joint_01",
        "acceleration_rms": 0.5,
        "gyro_rms": 1.2,
        "temperature": 45.3,
        "current": 2.1,
        "belt_speed": 1.5,
        "belt_tension": 100.0,
        "days_since_repair": 30
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'joint_id', 'acceleration_rms', 'gyro_rms', 'temperature',
            'current', 'belt_speed', 'belt_tension', 'days_since_repair'
        ]
        
        if not all(field in data for field in required_fields):
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields. Required: {required_fields}'
            }), 400
        
        # Validate data types and ranges
        try:
            sensor_reading = SensorReading(
                joint_id=str(data['joint_id']),
                acceleration_rms=float(data['acceleration_rms']),
                gyro_rms=float(data['gyro_rms']),
                temperature=float(data['temperature']),
                current=float(data['current']),
                belt_speed=float(data['belt_speed']),
                belt_tension=float(data['belt_tension']),
                days_since_repair=float(data['days_since_repair'])
            )
        except (ValueError, TypeError) as e:
            return jsonify({
                'status': 'error',
                'message': f'Invalid data type: {str(e)}'
            }), 400
        
        # Save sensor reading to database
        db.session.add(sensor_reading)
        db.session.commit()
        
        # Perform prediction using Random Forest
        model = ModelLoader.get_random_forest()
        feature_columns = ModelLoader.get_feature_columns()
        class_labels = ModelLoader.get_class_labels()
        
        if model is None:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded'
            }), 500
        
        # Prepare sensor data for model
        sensor_data_dict = {
            'acceleration_rms': sensor_reading.acceleration_rms,
            'gyro_rms': sensor_reading.gyro_rms,
            'temperature': sensor_reading.temperature,
            'current': sensor_reading.current,
            'belt_speed': sensor_reading.belt_speed,
            'belt_tension': sensor_reading.belt_tension,
            'days_since_repair': sensor_reading.days_since_repair,
        }
        
        # Get prediction
        prediction_class, confidence = predict_health_status(
            sensor_data_dict, model, feature_columns, class_labels
        )
        
        # Save prediction to database
        prediction = Prediction(
            joint_id=sensor_reading.joint_id,
            sensor_reading_id=sensor_reading.id,
            prediction=prediction_class,
            confidence=confidence,
            model_type='random_forest'
        )
        db.session.add(prediction)
        db.session.commit()
        
        # Create alert if HIGH_RISK or RUPTURE
        alert_created = False
        if prediction_class in [Config.HIGH_RISK_CLASS, Config.RUPTURE_CLASS]:
            alert = Alert(
                joint_id=sensor_reading.joint_id,
                prediction_id=prediction.id,
                severity=prediction_class,
                message=f'Joint {sensor_reading.joint_id} detected {prediction_class} status with {confidence:.2%} confidence',
                is_active=True
            )
            db.session.add(alert)
            db.session.commit()
            alert_created = True
        
        return jsonify({
            'status': 'success',
            'sensor_reading_id': sensor_reading.id,
            'prediction': prediction_class,
            'confidence': round(confidence, 4),
            'alert_created': alert_created,
            'timestamp': sensor_reading.timestamp.isoformat()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/vision/inspect', methods=['POST'])
def inspect_image():
    """
    Receive image and perform YOLO inference.
    
    Expected:
    - multipart/form-data
    - file: image file
    - joint_id: joint identifier
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files.get('file')
        joint_id = request.form.get('joint_id') or 'joint_01'

        if file is None:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        # Load YOLO model
        yolo_model = ModelLoader.get_yolo()
        if yolo_model is None:
            return jsonify({
                'status': 'error',
                'message': 'YOLO model not loaded'
            }), 500
        
        # Save uploaded file temporarily
        import tempfile
        from werkzeug.utils import secure_filename
        
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            # Run YOLO inference
            results = yolo_model(temp_path)

            # Process results
            detections = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        cls_name = result.names.get(int(box.cls), 'Tear') if hasattr(result.names, 'get') else 'Tear'
                        detections.append({
                            'class': cls_name,
                            'confidence': float(box.conf),
                            'box': {
                                'x1': float(box.xyxy[0][0]),
                                'y1': float(box.xyxy[0][1]),
                                'x2': float(box.xyxy[0][2]),
                                'y2': float(box.xyxy[0][3]),
                            }
                        })

            # Fallback for tear defects the model misses.
            if not detections:
                detections = _fallback_damage_detection(temp_path)

            # Determine overall status
            if len(detections) == 0:
                overall_status = 'NO_DEFECTS'
            else:
                max_conf = max([d['confidence'] for d in detections])
                overall_status = 'DEFECTS_DETECTED' if max_conf > 0.35 else 'LOW_CONFIDENCE'

            # Save to database
            vision_inspection = VisionInspection(
                joint_id=joint_id,
                image_path=temp_path,
                overall_status=json.dumps({
                    'status': overall_status,
                    'detections': detections
                }),
                detection_count=len(detections)
            )
            db.session.add(vision_inspection)
            db.session.commit()

            defects = detections
            return jsonify({
                'status': 'success',
                'inspection_id': vision_inspection.id,
                'joint_id': joint_id,
                'overall_status': overall_status,
                'detection_count': len(detections),
                'detections': detections,
                'defects': defects,
                'timestamp': vision_inspection.timestamp.isoformat()
            }), 201
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard summary data."""
    try:
        # Get latest predictions for each joint
        latest_predictions = db.session.query(Prediction).order_by(
            Prediction.timestamp.desc()
        ).limit(10).all()
        
        # Get active alerts
        active_alerts = db.session.query(Alert).filter(
            Alert.is_active == True
        ).order_by(Alert.timestamp.desc()).all()
        
        # Get statistics
        total_readings = db.session.query(SensorReading).count()
        total_predictions = db.session.query(Prediction).count()
        active_alert_count = len(active_alerts)
        
        # Group predictions by status
        status_counts = {}
        for pred in db.session.query(Prediction).all():
            status_counts[pred.prediction] = status_counts.get(pred.prediction, 0) + 1
        
        return jsonify({
            'status': 'success',
            'summary': {
                'total_sensor_readings': total_readings,
                'total_predictions': total_predictions,
                'active_alerts': active_alert_count,
                'status_breakdown': status_counts
            },
            'latest_predictions': [p.to_dict() for p in latest_predictions],
            'active_alerts': [a.to_dict() for a in active_alerts[:5]],
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/history', methods=['GET'])
def get_history():
    """Get sensor readings and predictions history."""
    try:
        joint_id = request.args.get('joint_id', None)
        limit = request.args.get('limit', 100, type=int)
        
        query = SensorReading.query.order_by(SensorReading.timestamp.desc()).limit(limit)
        
        if joint_id:
            query = query.filter_by(joint_id=joint_id)
        
        readings = query.all()
        
        history = []
        for reading in readings:
            # Get associated prediction
            prediction = Prediction.query.filter_by(
                sensor_reading_id=reading.id
            ).first()
            
            history.append({
                'sensor_reading': reading.to_dict(),
                'prediction': prediction.to_dict() if prediction else None
            })
        
        return jsonify({
            'status': 'success',
            'history': history,
            'total': len(history),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/alerts', methods=['GET'])
def get_alerts():
    """Get active and historical alerts."""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        limit = request.args.get('limit', 50, type=int)
        
        query = Alert.query.order_by(Alert.timestamp.desc())
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        alerts = query.limit(limit).all()
        
        return jsonify({
            'status': 'success',
            'alerts': [a.to_dict() for a in alerts],
            'total': len(alerts),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/joints', methods=['GET'])
def get_joints():
    """Get all joints and their latest status."""
    try:
        # Get unique joints
        joints_data = db.session.query(
            SensorReading.joint_id
        ).distinct().all()
        
        joints = []
        for (joint_id,) in joints_data:
            # Get latest sensor reading
            latest_reading = SensorReading.query.filter_by(
                joint_id=joint_id
            ).order_by(SensorReading.timestamp.desc()).first()
            
            # Get latest prediction
            latest_prediction = db.session.query(Prediction).join(
                SensorReading
            ).filter(SensorReading.joint_id == joint_id).order_by(
                Prediction.timestamp.desc()
            ).first()
            
            # Get active alerts
            active_alerts = Alert.query.filter_by(
                joint_id=joint_id,
                is_active=True
            ).all()
            
            joints.append({
                'joint_id': joint_id,
                'latest_reading': latest_reading.to_dict() if latest_reading else None,
                'latest_prediction': latest_prediction.to_dict() if latest_prediction else None,
                'active_alerts': len(active_alerts),
                'status': latest_prediction.prediction if latest_prediction else 'UNKNOWN'
            })
        
        return jsonify({
            'status': 'success',
            'joints': joints,
            'total': len(joints),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200
