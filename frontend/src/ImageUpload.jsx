import { useState, useRef } from "react";

export default function ImageUpload({ 
  onUpload, 
  onError, 
  userId, 
  currentImageUrl = null,
  disabled = false 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    onError?.(""); // Clear previous errors

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('jwt'); // Use 'jwt' to match axios interceptor
      const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
      const response = await fetch(`${apiBase}/user/${userId}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const updatedUser = await response.json();
      onUpload?.(updatedUser);
      
    } catch (error) {
      onError?.(error.message);
      setPreviewUrl(currentImageUrl); // Reset preview on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    setIsUploading(true);
    onError?.("");

    try {
      const token = localStorage.getItem('jwt'); // Use 'jwt' to match axios interceptor
      const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
      const response = await fetch(`${apiBase}/user/${userId}/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Delete failed');
      }

      const updatedUser = await response.json();
      setPreviewUrl(null);
      onUpload?.(updatedUser);
      
    } catch (error) {
      onError?.(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <style>{`
        .image-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .image-preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #e5e7eb;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .image-preview:hover {
          border-color: #2F88A7;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 0.875rem;
          text-align: center;
        }

        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .image-preview:hover .upload-overlay {
          opacity: 1;
        }

        .upload-text {
          color: white;
          font-size: 0.8rem;
          text-align: center;
          font-weight: 600;
        }

        .upload-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #2F88A7;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #296F89;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hidden {
          display: none;
        }

        .upload-info {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
          max-width: 200px;
        }
      `}</style>

      <div 
        className="image-preview"
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Profile preview" />
            <div className="upload-overlay">
              <div className="upload-text">
                {isUploading ? "Uploading..." : "Change Photo"}
              </div>
            </div>
          </>
        ) : (
          <div className="image-placeholder">
            {isUploading ? "Uploading..." : "Click to upload"}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="upload-actions">
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {previewUrl ? "Change" : "Upload"}
        </button>
        {previewUrl && (
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={disabled || isUploading}
          >
            Remove
          </button>
        )}
      </div>

      <div className="upload-info">
        JPEG, PNG, or WebP. Max 5MB.
      </div>
    </div>
  );
}
