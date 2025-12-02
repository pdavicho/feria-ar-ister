import React, { useEffect, useState } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import './Gallery.css';

const Gallery = ({ onBack }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [filterAvatar, setFilterAvatar] = useState('all');

  // Lista de avatares disponibles (ajusta según tu AvatarMenu)
  const avatars = [
    { name: 'Rumi Científico', file: '/public/ruCientifico.glb' },
    { name: 'Rumi Médico', file: '/public/ruMedico.glb' },
    { name: 'Rumi Turista', file: '/public/ruTuristico.glb' },
    { name: 'Rumi Chef', file: '/public/ruChef.glb' },
    // Agrega todos tus avatares aquí
  ];

  // Cargar fotos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "galeria"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(photosData);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando galería:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Carrusel automático de avatares cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAvatarIndex((prevIndex) => 
        (prevIndex + 1) % avatars.length
      );
    }, 3000); // 10 segundos

    return () => clearInterval(interval);
  }, [avatars.length]);

  // Filtrar fotos por avatar
  const filteredPhotos = filterAvatar === 'all' 
    ? photos 
    : photos.filter(photo => photo.avatar === filterAvatar);

  // Abrir modal de foto
  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  };

  // Cerrar modal
  const closePhotoModal = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'auto';
  };

  // Navegar entre avatares manualmente
  const goToAvatar = (index) => {
    setCurrentAvatarIndex(index);
  };

  // Descargar foto
  const downloadPhoto = async (url, photoId) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `RumiAR_${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando foto:', error);
      alert('No se pudo descargar la foto');
    }
  };

  return (
  <div className="gallery-container">
    {/* Header SIN botón de volver */}
    <div className="gallery-header">
      <h1 className="gallery-title">📸 Galería de la Feria</h1>
      <div className="header-right">
        <div className="photo-count">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </div>
      </div>
    </div>

    {/* Resto del código igual... */}

      {/* Carrusel de Avatares 3D */}
      <div className="avatar-showcase">
        

        <div className="avatar-carousel">
          {/* Avatar actual en 3D */}
          <div className="avatar-display">
            <model-viewer
              src={avatars[currentAvatarIndex].file}
              alt={avatars[currentAvatarIndex].name}
              auto-rotate
              rotation-per-second="30deg"
              camera-controls
              shadow-intensity="1"
              className="carousel-model"
            />
            <div className="avatar-name-badge">
              {avatars[currentAvatarIndex].name}
            </div>
          </div>

          {/* Indicadores de navegación */}
          <div className="carousel-controls">
            <button 
              className="carousel-arrow left"
              onClick={() => goToAvatar((currentAvatarIndex - 1 + avatars.length) % avatars.length)}
            >
              ←
            </button>

            <div className="carousel-dots">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentAvatarIndex ? 'active' : ''}`}
                  onClick={() => goToAvatar(index)}
                  aria-label={`Ver ${avatar.name}`}
                />
              ))}
            </div>

            <button 
              className="carousel-arrow right"
              onClick={() => goToAvatar((currentAvatarIndex + 1) % avatars.length)}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-section">
        <button 
          className={`filter-btn ${filterAvatar === 'all' ? 'active' : ''}`}
          onClick={() => setFilterAvatar('all')}
        >
          Todos ({photos.length})
        </button>
        {avatars.map((avatar) => {
          const count = photos.filter(p => p.avatar === avatar.name).length;
          return (
            <button 
              key={avatar.name}
              className={`filter-btn ${filterAvatar === avatar.name ? 'active' : ''}`}
              onClick={() => setFilterAvatar(avatar.name)}
            >
              {avatar.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Fotos */}
      <div className="photos-section">
        {loading ? (
          // Skeleton loading
          <div className="photos-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="photo-skeleton" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <h3>No hay fotos aún</h3>
            <p>
              {filterAvatar === 'all' 
                ? 'Sé el primero en tomar una foto con los avatares'
                : `No hay fotos con ${filterAvatar}`
              }
            </p>
          </div>
        ) : (
          <div className="photos-grid">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="photo-card"
                onClick={() => openPhotoModal(photo)}
              >
                <img 
                  src={photo.url} 
                  alt={`Foto con ${photo.avatar}`}
                  loading="lazy"
                  className="photo-image"
                />
                <div className="photo-overlay">
                  <span className="photo-avatar-tag">
                    {photo.avatar}
                  </span>
                  <span className="photo-view-icon">🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de foto completa */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePhotoModal}>
              ✕
            </button>
            
            <img 
              src={selectedPhoto.url} 
              alt={`Foto con ${selectedPhoto.avatar}`}
              className="modal-image"
            />
            
            <div className="modal-info">
              <h3>📸 Foto con {selectedPhoto.avatar}</h3>
              <p className="modal-date">
                {selectedPhoto.createdAt?.toDate().toLocaleString('es-EC', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              
              <div className="modal-actions">
                <button 
                  className="modal-btn download"
                  onClick={() => downloadPhoto(selectedPhoto.url, selectedPhoto.id)}
                >
                  ⬇️ Descargar
                </button>
                <a 
                  href={selectedPhoto.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="modal-btn view"
                >
                  🔗 Abrir original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;