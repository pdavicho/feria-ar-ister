import React, { useState, useRef } from 'react';
import { storage, db } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './ArExperience.css';

const ArExperience = ({ selectedAvatar, onGoToGallery, onBack }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);
  const modelViewerRef = useRef(null);

  // CAPTURAR FOTO DEL MODEL VIEWER
  const captureFromModelViewer = async () => {
    try {
      const modelViewer = modelViewerRef.current;
      if (!modelViewer) {
        alert('Error: No se puede acceder al visor 3D');
        return;
      }

      // Tomar screenshot del model viewer
      const blob = await modelViewer.toBlob({
        idealAspect: true,
        mimeType: 'image/jpeg',
        qualityArgument: 0.92
      });

      // Convertir blob a URL para preview
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage({ blob, url: imageUrl });
      setShowCaptureOptions(true);

    } catch (error) {
      console.error('Error capturando imagen:', error);
      alert('No se pudo capturar la imagen. Intenta de nuevo.');
    }
  };

  // CANCELAR CAPTURA
  const cancelCapture = () => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
    setShowCaptureOptions(false);
  };

  // COMPRIMIR IMAGEN
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 1920;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name || 'photo.jpg', { 
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // VALIDAR ARCHIVO
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten imágenes (JPG, PNG, WEBP)');
    }
    
    if (file.size > maxSize) {
      throw new Error('La imagen es muy pesada (máx. 10MB)');
    }
    
    return true;
  };

  // SUBIR FOTO CAPTURADA
  const uploadCapturedPhoto = async () => {
    if (!capturedImage) return;

    setUploading(true);
    setUploadProgress(10);
    setShowCaptureOptions(false);

    try {
      // Crear File desde Blob
      const file = new File([capturedImage.blob], `capture_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      setUploadProgress(25);

      // Comprimir
      const compressedFile = await compressImage(file);
      setUploadProgress(50);

      // Subir a Firebase
      const fileName = `feria_${Date.now()}_${selectedAvatar.name.replace(/\s+/g, '_')}.jpg`;
      const storageRef = ref(storage, `fotos_feria/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile);
      setUploadProgress(75);

      // Obtener URL
      const url = await getDownloadURL(storageRef);
      setUploadProgress(90);

      // Guardar en Firestore
      await addDoc(collection(db, "galeria"), {
        url: url,
        avatar: selectedAvatar.name,
        avatarFile: selectedAvatar.file,
        createdAt: serverTimestamp(),
        fileSize: compressedFile.size
      });
      
      setUploadProgress(100);

      // Limpiar
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
      
      setTimeout(() => {
        alert("¡Foto guardada exitosamente! 🎉");
        onGoToGallery();
      }, 500);

    } catch (error) {
      console.error('Error al subir foto:', error);
      alert("Error al subir la foto. Intenta de nuevo.");
      setUploading(false);
      setUploadProgress(0);
      setShowCaptureOptions(true);
    }
  };

  // SUBIR DESDE GALERÍA
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      validateFile(file);
      setUploadProgress(25);

      const compressedFile = await compressImage(file);
      setUploadProgress(50);

      const fileName = `feria_${Date.now()}_${selectedAvatar.name.replace(/\s+/g, '_')}.jpg`;
      const storageRef = ref(storage, `fotos_feria/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile);
      setUploadProgress(75);

      const url = await getDownloadURL(storageRef);
      setUploadProgress(90);

      await addDoc(collection(db, "galeria"), {
        url: url,
        avatar: selectedAvatar.name,
        avatarFile: selectedAvatar.file,
        createdAt: serverTimestamp(),
        fileSize: compressedFile.size
      });
      
      setUploadProgress(100);
      
      setTimeout(() => {
        alert("¡Foto guardada exitosamente! 🎉");
        onGoToGallery();
      }, 500);

    } catch (error) {
      console.error('Error al subir foto:', error);
      
      let errorMessage = "Error al subir la foto. ";
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Intenta de nuevo.";
      }
      
      alert(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="ar-experience-container">
      {/* Header */}
      <div className="ar-header">
        <h2 className="avatar-title-centered">{selectedAvatar.name}</h2>
      </div>

      {/* MODEL VIEWER */}
      <div className="model-viewer-wrapper">
        <model-viewer
          ref={modelViewerRef}
          src={selectedAvatar.file} 
          alt={selectedAvatar.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          shadow-intensity="1"
          auto-rotate
          rotation-per-second="30deg"
          className="model-viewer"
        >
          <button slot="ar-button" className="ar-button">
            📱 Ver en AR
          </button>
          
          <div className="ar-help">
            <p>👆 Arrastra para rotar</p>
          </div>
        </model-viewer>

        {/* Botón de captura sobre el viewer */}
        {!capturedImage && !uploading && (
          <button 
            className="capture-button"
            onClick={captureFromModelViewer}
          >
            📷 Capturar Foto
          </button>
        )}
      </div>

      {/* PREVIEW DE FOTO CAPTURADA */}
      {capturedImage && showCaptureOptions && (
        <div className="capture-preview">
          <h3 className="preview-title">📸 Vista previa</h3>
          <img 
            src={capturedImage.url} 
            alt="Preview" 
            className="preview-image"
          />
          <div className="preview-actions">
            <button 
              className="preview-btn cancel"
              onClick={cancelCapture}
            >
              ✕ Cancelar
            </button>
            <button 
              className="preview-btn confirm"
              onClick={uploadCapturedPhoto}
            >
              ✓ Subir Foto
            </button>
          </div>
        </div>
      )}

      {/* Sección de subida */}
      {!capturedImage && (
        <div className="upload-section">
          <div className="upload-card">
            <h3 className="upload-title">📤 Subir tu foto</h3>
            
            <div className="upload-options-info">
              <p><strong>Opción 1:</strong> Usa el botón "📷 Capturar Foto" arriba para tomar una captura del modelo 3D</p>
              <p><strong>Opción 2:</strong> Si ya tomaste una foto en AR, selecciónala de tu galería:</p>
            </div>

            {uploading ? (
              <div className="uploading-state">
                <div className="spinner"></div>
                <p className="uploading-text">Subiendo tu foto...</p>
                
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <input 
                  type="file" 
                  accept="image/*"
                  id="galleryInput" 
                  className="file-input-hidden"
                  onChange={handleFileSelect}
                />
                
                <button 
                  onClick={() => document.getElementById('galleryInput').click()}
                  className="upload-button gallery-btn-single"
                >
                  <span className="button-icon">🖼️</span>
                  <span className="button-text">Seleccionar de galería</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArExperience;