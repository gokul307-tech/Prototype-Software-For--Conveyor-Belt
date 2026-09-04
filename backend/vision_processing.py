"""Reusable YOLO frame processing for image, video, and camera adapters."""

from datetime import datetime

import cv2

from model_loader import ModelLoader


def _class_name(names, class_id):
    if isinstance(names, dict):
        return names.get(class_id, str(class_id))
    if isinstance(names, (list, tuple)) and 0 <= class_id < len(names):
        return names[class_id]
    return str(class_id)


def extract_detections(result, confidence_threshold):
    """Convert one Ultralytics result into JSON-serializable detections."""
    detections = []
    if result.boxes is None:
        return detections

    for box in result.boxes:
        confidence = float(box.conf[0])
        if confidence < confidence_threshold:
            continue

        class_id = int(box.cls[0])
        coordinates = [float(value) for value in box.xyxy[0].tolist()]
        detections.append({
            'class': _class_name(result.names, class_id),
            'confidence': round(confidence, 4),
            'box': {
                'x1': coordinates[0],
                'y1': coordinates[1],
                'x2': coordinates[2],
                'y2': coordinates[3],
            },
        })
    return detections


def annotate_detections(frame, detections):
    """Draw normalized detections on a BGR frame."""
    annotated = frame.copy()
    for detection in detections:
        box = detection['box']
        x1, y1 = int(box['x1']), int(box['y1'])
        x2, y2 = int(box['x2']), int(box['y2'])
        label = f"{detection['class']} {detection['confidence']:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 212, 255), 2)
        label_y = max(y1 - 8, 20)
        cv2.putText(
            annotated,
            label,
            (x1, label_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 212, 255),
            2,
            cv2.LINE_AA,
        )
    return annotated


def process_frame(frame, confidence_threshold, frame_number=None, timestamp=None):
    """Run the cached YOLO model once and return an annotated frame and metadata."""
    model = ModelLoader.get_yolo()
    if model is None:
        raise RuntimeError('YOLO model not loaded')

    results = model(frame, conf=confidence_threshold, verbose=False)
    detections = []
    annotated_frame = frame.copy()
    for result in results:
        result_detections = extract_detections(result, confidence_threshold)
        for detection in result_detections:
            detection['frame_number'] = frame_number
            detection['timestamp'] = timestamp or datetime.utcnow().isoformat()
        detections.extend(result_detections)
        if detections:
            annotated_frame = result.plot()

    if detections and annotated_frame is frame:
        annotated_frame = annotate_detections(frame, detections)

    event = {
        'frame_number': frame_number,
        'timestamp': timestamp or datetime.utcnow().isoformat(),
        'status': 'DAMAGE_DETECTED' if detections else 'NORMAL',
        'detections': detections,
    }
    return annotated_frame, event
