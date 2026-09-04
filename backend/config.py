import os

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

    YOLO_CONFIDENCE_THRESHOLD = float(os.getenv('YOLO_CONFIDENCE_THRESHOLD', '0.35'))
    ALERT_COOLDOWN_SECONDS = int(os.getenv('ALERT_COOLDOWN_SECONDS', '30'))
    ESP32_CAM_URL = os.getenv('ESP32_CAM_URL', '')
    VIDEO_INFERENCE_INTERVAL = int(os.getenv('VIDEO_INFERENCE_INTERVAL', '1'))
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
    PROCESSED_VIDEO_DIR = os.path.join(os.path.dirname(__file__), 'processed_videos')
    
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
