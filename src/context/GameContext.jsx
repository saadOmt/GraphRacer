import React, { createContext, useState, useContext, useEffect } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // --- ÉTATS DU JEU ---
  const [currentLevel, setCurrentLevel] = useState(null);
  const [unlockedLevels, setUnlockedLevels] = useState([1]); // Niveau 1 débloqué par défaut

  // --- PERSONNALISATION (GARAGE) ---
  // On essaie de lire dans le navigateur, sinon valeurs par défaut
  const [carColor, setCarColor] = useState(localStorage.getItem('carColor') || '#facc15'); // Jaune
  const [lineColor, setLineColor] = useState(localStorage.getItem('lineColor') || '#22d3ee'); // Cyan
  const [bgColor, setBgColor] = useState(localStorage.getItem('bgColor') || '#020617'); // Bleu Nuit

  // --- PARAMÈTRES ---
  const [showGrid, setShowGrid] = useState(localStorage.getItem('showGrid') !== 'false'); // Vrai par défaut

  // Sauvegarde automatique quand on change une couleur
  useEffect(() => {
    localStorage.setItem('carColor', carColor);
    localStorage.setItem('lineColor', lineColor);
    localStorage.setItem('bgColor', bgColor);
    localStorage.setItem('showGrid', showGrid);
    localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
  }, [carColor, lineColor, bgColor, showGrid, unlockedLevels]);

  const unlockNextLevel = (levelId) => {
    if (!unlockedLevels.includes(levelId + 1)) {
      setUnlockedLevels(prev => [...prev, levelId + 1]);
    }
  };

  const resetProgress = () => {
    if(window.confirm("Êtes-vous sûr de vouloir tout effacer ?")) {
      setUnlockedLevels([1]);
      setCarColor('#facc15');
      setLineColor('#22d3ee');
      // On recharche la page pour être propre
      window.location.reload(); 
    }
  };

  const value = {
    currentLevel, setCurrentLevel,
    unlockedLevels, unlockNextLevel,
    carColor, setCarColor,
    lineColor, setLineColor,
    bgColor, setBgColor,
    showGrid, setShowGrid,
    resetProgress
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};