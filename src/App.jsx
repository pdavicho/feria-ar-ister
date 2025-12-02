import React, { useState } from 'react';
import AvatarMenu from './components/AvatarMenu';
import ArExperience from './components/ArExperience';
import Gallery from './components/Gallery';
import './App.css'; // Nuevo archivo de estilos

function App() {
  const [view, setView] = useState('menu'); // 'menu', 'ar', 'gallery'
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // Navegación con transición suave
  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setView('ar');
  };

  const handleBackToMenu = () => {
    setView('menu');
    setSelectedAvatar(null); // Limpiamos selección al volver
  };

  return (
    <div className="app-container">
      {/* Header Fijo - Ahora con clase CSS */}
      <header className="app-header">
        <h1>RumiAR Experience</h1>
        {view !== 'menu' && (
          <button 
            className="header-back-btn"
            onClick={handleBackToMenu}
            aria-label="Volver al menú"
          >
            ← Volver
          </button>
        )}
      </header>

      {/* Contenido Principal con transiciones */}
      <main className={`app-main view-${view}`}>
        {view === 'menu' && (
          <div className="menu-view fade-in">
            <AvatarMenu onSelectAvatar={handleSelectAvatar} />
            <div className="gallery-link-container">
              <button 
                onClick={() => setView('gallery')} 
                className="gallery-link-btn"
              >
                📸 Ver Galería Pública
              </button>
            </div>
          </div>
        )}

        {view === 'ar' && selectedAvatar && (
          <div className="ar-view fade-in">
            <ArExperience 
              selectedAvatar={selectedAvatar} 
              onGoToGallery={() => setView('gallery')} 
              onBack={handleBackToMenu}
            />
          </div>
        )}

        {view === 'gallery' && (
          <div className="gallery-view fade-in">
            <Gallery onBack={handleBackToMenu} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;