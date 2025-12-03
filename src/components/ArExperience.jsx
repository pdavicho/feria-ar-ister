import React, { useState } from 'react';
import { storage, db } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './ArExperience.css';

const ArExperience = ({ selectedAvatar, onGoToGallery, onBack }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // COMPRIMIR IMAGEN ANTES DE SUBIR
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Máximo 1920px de ancho, mantener aspecto
          const maxWidth = 1920;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convertir a JPEG con 85% calidad
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { 
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten imágenes (JPG, PNG, WEBP)');
    }
    
    if (file.size > maxSize) {
      throw new Error('La imagen es muy pesada (máx. 10MB)');
    }
    
    return true;
  };

  // SUBIDA MEJORADA CON VALIDACIÓN Y COMPRESIÓN
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // 1. Validar
      validateFile(file);
      setUploadProgress(25);

      // 2. Comprimir
      const compressedFile = await compressImage(file);
      setUploadProgress(50);

      // 3. Subir a Firebase Storage
      const fileName = `feria_${Date.now()}_${selectedAvatar.name.replace(/\s+/g, '_')}.jpg`;
      const storageRef = ref(storage, `fotos_feria/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile);
      setUploadProgress(75);

      // 4. Obtener URL
      const url = await getDownloadURL(storageRef);
      setUploadProgress(90);

      // 5. Guardar en Firestore
      await addDoc(collection(db, "galeria"), {
        url: url,
        avatar: selectedAvatar.name,
        avatarFile: selectedAvatar.file,
        createdAt: serverTimestamp(),
        fileSize: compressedFile.size
      });
      
      setUploadProgress(100);
      
      // Feedback exitoso
      setTimeout(() => {
        alert("¡Foto guardada exitosamente! 🎉");
        onGoToGallery();
      }, 500);

    } catch (error) {
      console.error('Error al subir foto:', error);
      
      // Mensajes específicos de error
      let errorMessage = "Error al subir la foto. ";
      if (error.code === 'storage/unauthorized') {
        errorMessage += "No tienes permisos. Contacta al administrador.";
      } else if (error.code === 'storage/canceled') {
        errorMessage += "Subida cancelada.";
      } else if (error.message) {
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
    {/* Header SIN botón de atrás - simplificado */}
    <div className="ar-header">
      <h2 className="avatar-title-centered">{selectedAvatar.name}</h2>
    </div>

    {/* MODEL VIEWER con mejor diseño */}
    <div className="model-viewer-wrapper">
      <model-viewer
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
        
        {/* Mensaje de ayuda */}
        <div className="ar-help" slot="poster">
          <p>👆 Arrastra para rotar • 🔍 Pellizca para zoom</p>
        </div>
      </model-viewer>
    </div>

      {/* Sección de subida de foto - MEJORADA PARA ANDROID */}
      <div className="upload-section">
        <div className="upload-card">
          <h3 className="upload-title">📸 ¿Ya tienes tu foto?</h3>
          
          {/* Instrucciones específicas por plataforma */}
          <div className="platform-instructions">
            <p className="instruction-android">
              <strong>📱 Android:</strong> Toca "Ver en AR" arriba, toma tu foto con el botón de cámara de tu teléfono, y luego selecciónala aquí abajo.
            </p>
            <p className="instruction-ios">
              <strong>🍎 iOS:</strong> Toca "Ver en AR", captura tu momento, y súbelo aquí.
            </p>
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
                <span className="button-icon">📤</span>
                <span className="button-text">Seleccionar foto de galería</span>
              </button>

              <div className="upload-tips">
                <p className="tip-item">💡 <strong>Consejo:</strong> Asegúrate de tomar la foto en modo AR primero</p>
                <p className="tip-item">📷 La foto debe mostrar al avatar en tu entorno</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArExperience;