import React, { useState } from 'react';
import { Image, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

const VisionAI = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInspect = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const visionResult = await apiService.postVisionInspect(selectedImage);
      const normalizedResult = {
        ...visionResult,
        defects: visionResult.defects || visionResult.detections || [],
      };
      setResult(normalizedResult);
    } catch (err) {
      setError(
        err.message || 'Failed to process image. Please try again.'
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="vision-ai-section">
      <div className="vision-header">
        <div className="vision-icon">
          <Image size={32} />
        </div>
        <div>
          <h2>YOLO Vision AI Inspection</h2>
          <p>Upload a conveyor belt image for automated defect detection</p>
        </div>
      </div>

      <div className="vision-content">
        {!result ? (
          <div className="vision-upload">
            <div className="upload-area">
              <input
                type="file"
                id="image-input"
                accept="image/*"
                onChange={handleImageSelect}
                className="image-input"
                disabled={loading}
              />
              <label htmlFor="image-input" className="upload-label">
                <Upload size={32} />
                <span>Click to upload or drag and drop</span>
                <small>PNG, JPG, GIF up to 10MB</small>
              </label>
            </div>

            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Preview" />
                <div className="preview-info">
                  <p className="preview-name">{selectedImage?.name}</p>
                  <p className="preview-size">
                    {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="upload-actions">
              <button
                className="btn-primary"
                onClick={handleInspect}
                disabled={!selectedImage || loading}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spinning" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Inspect Image</span>
                  </>
                )}
              </button>
              <button
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="vision-result">
            <div className="result-status">
              {result.defects && result.defects.length > 0 ? (
                <>
                  <AlertCircle size={32} className="result-icon warning" />
                  <h3>Defects Detected</h3>
                  <p>AI detected potential tears or damage in the conveyor belt image</p>
                </>
              ) : (
                <>
                  <CheckCircle size={32} className="result-icon success" />
                  <h3>No Defects Detected</h3>
                  <p>Conveyor belt appears to be in good condition</p>
                </>
              )}
            </div>

            {result.defects && result.defects.length > 0 && (
              <div className="defects-list">
                <h4>Detected Defects:</h4>
                {result.defects.map((defect, index) => (
                  <div key={index} className="defect-item">
                    <div className="defect-class">{defect.class || defect}</div>
                    {defect.confidence && (
                      <div className="defect-confidence">
                        Confidence: {(defect.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.processed_image && (
              <div className="result-image">
                <h4>Processed Image</h4>
                <img src={result.processed_image} alt="Processed" />
              </div>
            )}

            <div className="result-actions">
              <button className="btn-primary" onClick={handleReset}>
                Inspect Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionAI;
