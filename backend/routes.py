from flask import Blueprint, request, jsonify, send_from_directory
from datetime import datetime, timedelta
from database import db, SensorReading, Prediction, Alert, VisionInspection, VisionAlert
from model_loader import ModelLoader, predict_health_status
from config import Config
from vision_processing import process_frame
import json
import os
import numpy as np
import cv2
import uuid
from PIL import Image, ImageFilter

api = Blueprint('api', __name__, url_prefix='/api')

ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}


def _allowed_video(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


def _create_vision_alerts(detections, joint_id, source):
    """Create one active alert per class during the configured cooldown."""
    created = []
    now = datetime.utcnow()
    for detection_type in {item['class'] for item in detections}:
        matching = [item for item in detections if item['class'] == detection_type]
        strongest = max(matching, key=lambda item: item['confidence'])
        recent = VisionAlert.query.filter_by(
            joint_id=joint_id,
            detection_type=detection_type,
            source=source,
            is_active=True,
        ).order_by(VisionAlert.timestamp.desc()).first()
        if recent and (now - recent.timestamp).total_seconds() < Config.ALERT_COOLDOWN_SECONDS:
            continue

        alert = VisionAlert(
            joint_id=joint_id,
            detection_type=detection_type,
            confidence=strongest['confidence'],
            source=source,
            message=f'{detection_type} detected with {strongest["confidence"]:.2%} confidence',
        )
        db.session.add(alert)
        created.append(alert)
    if created:
        db.session.commit()
    return created


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
            image = cv2.imread(temp_path)
            if image is None:
                return jsonify({'status': 'error', 'message': 'Uploaded image could not be decoded'}), 400

            _, frame_result = process_frame(
                image,
                Config.YOLO_CONFIDENCE_THRESHOLD,
                frame_number=0,
            )
            detections = frame_result['detections']

            # Fallback for tear defects the model misses.
            if not detections:
                detections = _fallback_damage_detection(temp_path)

            # Determine overall status
            if len(detections) == 0:
                overall_status = 'NO_DEFECTS'
            else:
                max_conf = max([d['confidence'] for d in detections])
                overall_status = 'DEFECTS_DETECTED' if max_conf >= Config.YOLO_CONFIDENCE_THRESHOLD else 'LOW_CONFIDENCE'

            vision_alerts = _create_vision_alerts(detections, joint_id, 'IMAGE')

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
                'alerts_created': len(vision_alerts),
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


@api.route('/vision/detect-video', methods=['POST'])
def detect_video():
    """Process an uploaded video and return a browser-playable annotated result."""
    upload_path = None
    try:
        uploaded = request.files.get('video')
        if uploaded is None or not uploaded.filename:
            return jsonify({'status': 'error', 'message': 'No video file provided'}), 400
        if not _allowed_video(uploaded.filename):
            return jsonify({'status': 'error', 'message': 'Unsupported video format'}), 415
        if ModelLoader.get_yolo() is None:
            return jsonify({'status': 'error', 'message': 'YOLO model not loaded'}), 500

        joint_id = request.form.get('joint_id') or 'joint_01'
        source = request.form.get('source') or 'VIDEO'
        extension = uploaded.filename.rsplit('.', 1)[1].lower()
        upload_name = f'{uuid.uuid4().hex}.{extension}'
        upload_path = os.path.join(Config.UPLOAD_DIR, upload_name)
        uploaded.save(upload_path)

        capture = cv2.VideoCapture(upload_path)
        if not capture.isOpened():
            return jsonify({'status': 'error', 'message': 'Video could not be opened'}), 400

        fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        if width <= 0 or height <= 0:
            capture.release()
            return jsonify({'status': 'error', 'message': 'Video has invalid dimensions'}), 400

        output_name = f'{uuid.uuid4().hex}.mp4'
        output_path = os.path.join(Config.PROCESSED_VIDEO_DIR, output_name)
        writer = cv2.VideoWriter(
            output_path,
            cv2.VideoWriter_fourcc(*'mp4v'),
            fps,
            (width, height),
        )
        if not writer.isOpened():
            capture.release()
            return jsonify({'status': 'error', 'message': 'Could not create output video'}), 500

        all_detections = []
        processed_frames = 0
        frame_number = 0
        interval = max(1, Config.VIDEO_INFERENCE_INTERVAL)
        try:
            while True:
                success, frame = capture.read()
                if not success:
                    break
                if frame_number % interval == 0:
                    annotated, frame_result = process_frame(
                        frame,
                        Config.YOLO_CONFIDENCE_THRESHOLD,
                        frame_number=frame_number,
                        timestamp=(frame_number / fps),
                    )
                    all_detections.extend(frame_result['detections'])
                else:
                    annotated = frame
                writer.write(annotated)
                processed_frames += 1
                frame_number += 1
        finally:
            capture.release()
            writer.release()

        if processed_frames == 0:
            if os.path.exists(output_path):
                os.remove(output_path)
            return jsonify({'status': 'error', 'message': 'Video contains no readable frames'}), 400

        unique_detections = {}
        for detection in all_detections:
            key = detection['class']
            current = unique_detections.get(key)
            if current is None or detection['confidence'] > current['confidence']:
                unique_detections[key] = detection
        detections = list(unique_detections.values())
        alerts_created = _create_vision_alerts(detections, joint_id, source)
        return jsonify({
            'status': 'success',
            'video_url': f'/api/vision/video/{output_name}',
            'detections': detections,
            'detection_count': len(all_detections),
            'frame_count': total_frames or processed_frames,
            'processed_frames': processed_frames,
            'fps': round(fps, 3),
            'duration': round(processed_frames / fps, 3),
            'overall_status': 'DAMAGE_DETECTED' if detections else 'NORMAL',
            'alerts_created': len(alerts_created),
            'source': source,
        }), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 500
    finally:
        if upload_path and os.path.exists(upload_path):
            os.remove(upload_path)


@api.route('/vision/video/<path:filename>', methods=['GET'])
def serve_processed_video(filename):
    """Serve only generated videos from the configured output directory."""
    return send_from_directory(Config.PROCESSED_VIDEO_DIR, filename, mimetype='video/mp4')


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
        active_vision_alerts = VisionAlert.query.filter_by(
            is_active=True
        ).order_by(VisionAlert.timestamp.desc()).all()
        combined_alerts = sorted(
            active_alerts + active_vision_alerts,
            key=lambda alert: alert.timestamp,
            reverse=True,
        )
        
        # Get statistics
        total_readings = db.session.query(SensorReading).count()
        total_predictions = db.session.query(Prediction).count()
        active_alert_count = len(combined_alerts)
        
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
            'active_alerts': [a.to_dict() for a in combined_alerts[:5]],
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
        vision_query = VisionAlert.query
        if active_only:
            vision_query = vision_query.filter_by(is_active=True)
        vision_alerts = vision_query.order_by(VisionAlert.timestamp.desc()).limit(limit).all()
        alerts = sorted(
            alerts + vision_alerts,
            key=lambda alert: alert.timestamp,
            reverse=True,
        )[:limit]
        
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
