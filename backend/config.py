import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SQLALCHEMY_DATABASE_URI = 'sqlite:///conveyor_monitoring.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    
    # Model paths
    RANDOM_FOREST_MODEL_PATH = os.path.join(
        os.path.dirname(__file__),
        'models',
        'random_forest',
        'model.pkl'
    )
    
    RANDOM_FOREST_FEATURES_PATH = os.path.join(
        os.path.dirname(__file__),
        'models',
        'random_forest',
        'feature_columns.json'
    )
    
    YOLO_MODEL_PATH = os.path.join(
        os.path.dirname(__file__),
        'models',
        'yolo',
        'best.pt'
    )
    
    # Alert thresholds
    ALERT_CONFIDENCE_THRESHOLD = 0.7
    HIGH_RISK_CLASS = 'HIGH_RISK'
    RUPTURE_CLASS = 'RUPTURE'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
