import React, { useState } from 'react';
import { Image, Film, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

const VisionAI = () => {
  const [mode, setMode] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setError(null);
    if (mode === 'image') {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setPreview(loadEvent.target?.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError(`Please select a ${mode} first`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = mode === 'image'
        ? await apiService.postVisionInspect(selectedFile)
        : await apiService.postVideoDetection(selectedFile);
      setResult({ ...response, defects: response.defects || response.detections || [] });
    } catch (err) {
      setError(err.message || `Failed to process ${mode}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const changeMode = (nextMode) => {
    if (loading) return;
    handleReset();
    setMode(nextMode);
  };

  const apiUrl = (path) => path?.startsWith('http') ? path : `http://localhost:5000${path}`;
  const defects = result?.defects || [];
  const highestConfidence = defects.length ? Math.max(...defects.map((item) => item.confidence || 0)) : 0;

  return (
    <div className="vision-ai-section">
      <div className="vision-header">
        <div className="vision-icon"><Image size={32} /></div>
        <div><h2>YOLO Vision AI Inspection</h2><p>Inspect conveyor belt images and video with the loaded damage model</p></div>
      </div>
      <div className="vision-content">
        <div className="vision-tabs" role="tablist" aria-label="Vision input mode">
          <button className={mode === 'image' ? 'vision-tab active' : 'vision-tab'} onClick={() => changeMode('image')}><Image size={18} /> Image Detection</button>
          <button className={mode === 'video' ? 'vision-tab active' : 'vision-tab'} onClick={() => changeMode('video')}><Film size={18} /> Video Detection</button>
        </div>
        {!result ? (
          <div className="vision-upload">
            <div className="upload-area">
              <input type="file" id="vision-file-input" accept={mode === 'image' ? 'image/*' : 'video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm'} onChange={handleFileSelect} className="image-input" disabled={loading} />
              <label htmlFor="vision-file-input" className="upload-label">
                {mode === 'image' ? <Image size={32} /> : <Film size={32} />}
                <span>Click to upload a {mode}</span><small>{mode === 'image' ? 'PNG, JPG, GIF up to 10MB' : 'MP4, AVI, MOV, MKV, WEBM'}</small>
              </label>
            </div>
            {preview && <div className="image-preview">{mode === 'image' ? <img src={preview} alt="Preview" /> : <video src={preview} controls />}<div className="preview-info"><p className="preview-name">{selectedFile?.name}</p><p className="preview-size">{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p></div></div>}
            {error && <div className="error-message">{error}</div>}
            <div className="upload-actions"><button className="btn-primary" onClick={handleProcess} disabled={!selectedFile || loading}>{loading ? <><Loader size={18} className="spinning" /> Processing...</> : <><Upload size={18} /> Process {mode}</>}</button><button className="btn-secondary" onClick={handleReset} disabled={loading}>Clear</button></div>
          </div>
        ) : (
          <div className="vision-result">
            <div className="result-status">{defects.length > 0 ? <><AlertCircle size={32} className="result-icon warning" /><h3>Damage Detected</h3></> : <><CheckCircle size={32} className="result-icon success" /><h3>Normal</h3></>}<p>{result.overall_status || 'Analysis complete'}</p></div>
            {mode === 'video' && result.video_url && <div className="result-image video-result"><h4>Annotated Output Video</h4><video src={apiUrl(result.video_url)} controls className="processed-video" /><div className="video-summary"><span>Total Frames: {result.frame_count}</span><span>Processed: {result.processed_frames}</span><span>Duration: {result.duration}s</span><span>Detections: {result.detection_count}</span><span>Highest Confidence: {(highestConfidence * 100).toFixed(1)}%</span></div></div>}
            {defects.length > 0 && <div className="defects-list"><h4>Detected Issues</h4>{defects.map((defect, index) => <div key={`${defect.class}-${index}`} className="defect-item"><div className="defect-class">{defect.class}</div><div className="defect-confidence">Confidence: {(defect.confidence * 100).toFixed(1)}%</div></div>)}</div>}
            <div className="result-actions"><button className="btn-primary" onClick={handleReset}>Inspect Another {mode}</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionAI;