import pickle
import json
import numpy as np
from pathlib import Path

class ModelLoader:
    """Singleton loader for ML models. Loads models once at startup."""
    
    _instance = None
    _random_forest_model = None
    _yolo_model = None
    _feature_columns = None
    _class_labels = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance
    
    @classmethod
    def load_random_forest(cls, model_path, features_path):
        """Load Random Forest model and feature configuration."""
        if cls._random_forest_model is not None:
            return cls._random_forest_model, cls._feature_columns, cls._class_labels
        
        # Load model
        with open(model_path, 'rb') as f:
            cls._random_forest_model = pickle.load(f)
        
        # Load feature configuration
        with open(features_path, 'r') as f:
            config = json.load(f)
            cls._feature_columns = config['feature_columns']
            cls._class_labels = config['classes']
        
        print(f"✓ Random Forest model loaded from {model_path}")
        print(f"  Features: {cls._feature_columns}")
        print(f"  Classes: {cls._class_labels}")
        
        return cls._random_forest_model, cls._feature_columns, cls._class_labels
    
    @classmethod
    def load_yolo(cls, model_path):
        """Load YOLO model."""
        if cls._yolo_model is not None:
            return cls._yolo_model
        
        try:
            from ultralytics import YOLO
            cls._yolo_model = YOLO(model_path)
            print(f"✓ YOLO model loaded from {model_path}")
            return cls._yolo_model
        except Exception as e:
            print(f"✗ Failed to load YOLO model: {str(e)}")
            raise
    
    @classmethod
    def get_random_forest(cls):
        """Get cached Random Forest model."""
        return cls._random_forest_model
    
    @classmethod
    def get_yolo(cls):
        """Get cached YOLO model."""
        return cls._yolo_model
    
    @classmethod
    def get_feature_columns(cls):
        """Get feature column order."""
        return cls._feature_columns
    
    @classmethod
    def get_class_labels(cls):
        """Get class labels."""
        return cls._class_labels


def predict_health_status(sensor_data_dict, model, feature_columns, class_labels):
    """
    Make prediction using Random Forest model.
    
    Args:
        sensor_data_dict: Dictionary with sensor readings
        model: Trained Random Forest model
        feature_columns: List of feature names in correct order
        class_labels: List of class labels
    
    Returns:
        Tuple of (prediction_class, confidence)
    """
    # Extract features in correct order
    feature_values = [sensor_data_dict[feat] for feat in feature_columns]
    X = np.array([feature_values])
    
    # Get prediction and confidence
    prediction_idx = model.predict(X)[0]
    prediction_class = class_labels[prediction_idx]
    
    # Get confidence as max probability from predict_proba
    probabilities = model.predict_proba(X)[0]
    confidence = float(np.max(probabilities))
    
    return prediction_class, confidence
