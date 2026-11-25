import os
from flask import Flask, jsonify
from config import config
from database import db
from model_loader import ModelLoader

def create_app(config_name='development'):
    """Application factory for Flask app."""
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize database
    db.init_app(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        os.makedirs(app.config['UPLOAD_DIR'], exist_ok=True)
        os.makedirs(app.config['PROCESSED_VIDEO_DIR'], exist_ok=True)
    
    # Load ML models at startup
    with app.app_context():
        try:
            # Load Random Forest model
            ModelLoader.load_random_forest(
                app.config['RANDOM_FOREST_MODEL_PATH'],
                app.config['RANDOM_FOREST_FEATURES_PATH']
            )
        except Exception as e:
            print(f"✗ Error loading Random Forest model: {str(e)}")
            raise
        
        try:
            # Load YOLO model
            ModelLoader.load_yolo(app.config['YOLO_MODEL_PATH'])
        except Exception as e:
            print(f"⚠ Warning: YOLO model failed to load: {str(e)}")
            print("  Vision inspection endpoints will not work.")
    
    # Register blueprints
    from routes import api
    app.register_blueprint(api)

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'status': 'success',
            'message': 'Conveyor Monitoring API is running',
            'api_base': '/api',
            'endpoints': [
                '/api/health',
                '/api/dashboard',
                '/api/history',
                '/api/joints',
                '/api/alerts',
                '/api/vision/inspect',
                '/api/vision/detect-video',
                '/api/sensors'
            ]
        }), 200
    
    # CORS support for frontend (simple approach)
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    return app

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
