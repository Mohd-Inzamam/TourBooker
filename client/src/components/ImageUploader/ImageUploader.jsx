import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, Check, X, RefreshCw } from 'lucide-react';
import { post, del } from '../../api/apiClient';
import './ImageUploader.css';

/**
 * Reusable ImageUploader Component
 * @param {"single" | "multiple"} mode - determines whether one or multiple files can be uploaded
 * @param {Function} onUploadComplete - callback fired with array of {url, publicId}
 * @param {Array<String>} existingImages - optionally pass URLs for edit mode pre-population
 * @param {Number} maxFiles - maximum number of files allowed in multiple mode
 */
const ImageUploader = ({
  mode = 'single',
  onUploadComplete,
  existingImages = [],
  maxFiles = 5
}) => {
  // State holds objects: { id, file, url, status: 'uploading'|'success'|'error', publicId }
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize existing images on mount
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      const formatted = existingImages.map((url, idx) => ({
        id: `existing-${idx}`,
        url,
        status: 'success',
        publicId: null // Optional if we don't have it, but they are successfully hosted
      }));
      setImages(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync upwards only the successfully uploaded/existing images
  const triggerOnComplete = useCallback((currentImages) => {
    if (onUploadComplete) {
      const validImages = currentImages
        .filter(img => img.status === 'success')
        .map(img => ({ url: img.url, publicId: img.publicId }));
      onUploadComplete(validImages);
    }
  }, [onUploadComplete]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    if (mode === 'single') {
      const file = files[0];
      const newImage = {
        id: Date.now().toString(),
        file,
        url: URL.createObjectURL(file),
        status: 'uploading'
      };
      // In single mode, replace existing
      setImages([newImage]);
      uploadSingleFile(newImage);
    } else {
      let allowedFilesCount = maxFiles - images.length;
      if (allowedFilesCount <= 0) return;
      
      const filesToAdd = files.slice(0, allowedFilesCount);
      const newImageObjects = filesToAdd.map((file, idx) => ({
        id: (Date.now() + idx).toString(),
        file,
        url: URL.createObjectURL(file),
        status: 'uploading'
      }));
      
      setImages(prev => {
        const nextState = [...prev, ...newImageObjects];
        return nextState;
      });
      
      uploadMultipleFiles(newImageObjects);
    }
  };

  const uploadSingleFile = async (imageObj) => {
    const formData = new FormData();
    formData.append('image', imageObj.file);

    try {
      const response = await post('/upload/single', formData);
      if (response && response.success) {
        setImages(prev => {
          const nextState = prev.map(img => 
            img.id === imageObj.id 
              ? { ...img, status: 'success', url: response.url, publicId: response.publicId } 
              : img
          );
          triggerOnComplete(nextState);
          return nextState;
        });
      }
    } catch (error) {
      console.error("Upload failed", error);
      setImages(prev => prev.map(img => img.id === imageObj.id ? { ...img, status: 'error' } : img));
    }
  };

  const uploadMultipleFiles = async (imageObjects) => {
    // Send to /upload/multiple
    const formData = new FormData();
    imageObjects.forEach(imgObj => {
      formData.append('images', imgObj.file);
    });

    try {
      const response = await post('/upload/multiple', formData);
      if (response && response.success) {
        setImages(prev => {
          let urlIndex = 0;
          const nextState = prev.map(img => {
            // If this is one of our newly uploading images, assign the returned URL
            const isJustUploaded = imageObjects.find(newImg => newImg.id === img.id);
            if (isJustUploaded && response.urls[urlIndex]) {
              const cloudData = response.urls[urlIndex];
              urlIndex++;
              return { ...img, status: 'success', url: cloudData.url, publicId: cloudData.publicId };
            }
            return img;
          });
          triggerOnComplete(nextState);
          return nextState;
        });
      }
    } catch (error) {
      console.error("Multiple upload failed", error);
      // Mark all of these specific images as error
      const idsToError = imageObjects.map(obj => obj.id);
      setImages(prev => prev.map(img => 
        idsToError.includes(img.id) ? { ...img, status: 'error' } : img
      ));
    }
  };

  const handleDelete = async (id, publicId) => {
    // Optimistic local removal
    setImages(prev => {
      const nextState = prev.filter(img => img.id !== id);
      triggerOnComplete(nextState);
      return nextState;
    });

    if (publicId) {
      try {
        // We catch failure securely without breaking UI local state.
        await del(`/upload/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete from Cloudinary backend:", err);
      }
    }
  };

  const triggerRetry = (imageObj) => {
    setImages(prev => prev.map(img => img.id === imageObj.id ? { ...img, status: 'uploading' } : img));
    if (mode === 'single') {
      uploadSingleFile(imageObj);
    } else {
      uploadMultipleFiles([imageObj]); // Retry just this one, so it's essentially a single array upload 
    }
  };

  return (
    <div className="ag-image-uploader">
      {/* Dropzone */}
      <div 
        className={`ag-upload-dropzone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <UploadCloud className="ag-upload-icon" />
        <p className="ag-upload-text">Click or drag images here</p>
        <p className="ag-upload-subtext">
          {mode === 'single' ? 'Upload 1 image' : `Upload up to ${maxFiles} images`} (Max 5MB)
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="ag-upload-input" 
          accept="image/*"
          multiple={mode === 'multiple'}
          onChange={handleChange}
        />
      </div>

      {/* Grid Previews */}
      {images.length > 0 && (
        <div className="ag-upload-preview-grid">
          {images.map(img => (
            <div key={img.id} className={`ag-upload-thumb ${img.status}`}>
              <img src={img.url} alt="Preview" />
              
              {/* Spinner */}
              {img.status === 'uploading' && (
                <div className="ag-upload-thumb-loading">
                  <div className="ag-upload-spinner"></div>
                </div>
              )}

              {/* Status Badges */}
              {img.status === 'success' && (
                <div className="ag-upload-badge success-badge">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}

              {/* Remove Button (Don't show while uploading so we don't sever mid-promise) */}
              {img.status !== 'uploading' && (
                <button 
                  type="button" 
                  className="ag-upload-thumb-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.id, img.publicId);
                  }}
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}

              {/* Error State Overlays */}
              {img.status === 'error' && (
                <div className="ag-upload-thumb-loading" style={{ backgroundColor: 'rgba(255, 230, 230, 0.8)' }}>
                  <button 
                    type="button" 
                    className="ag-btn ag-btn-primary ag-upload-retry-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerRetry(img);
                    }}
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
