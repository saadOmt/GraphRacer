import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Home from './pages/Home';
import LevelSelect from './pages/LevelSelect';
import Game from './pages/Game';

// Composant interne qui gère la navigation
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'select', 'game'
  const { setCurrentLevel } = useGame();

  // Navigation vers la sélection
  const goToSelect = () => setCurrentPage('select');

  // Navigation vers le jeu (quand on clique sur un niveau)
  const startGame = (level) => {
    setCurrentLevel(level);
    setCurrentPage('game');
  };

  // Retour (Menu ou Select)
  const goBack = () => {
    if (currentPage === 'game') setCurrentPage('select');
    else setCurrentPage('home');
  };

  // Affichage conditionnel
  return (
    <>
      {currentPage === 'home' && <Home onStart={goToSelect} />}
      {currentPage === 'select' && <LevelSelect onBack={goBack} onPlayLevel={startGame} />}
      {currentPage === 'game' && <Game onBack={goBack} />}
    </>
  );
};

// Application Racine (avec le Provider)
function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;