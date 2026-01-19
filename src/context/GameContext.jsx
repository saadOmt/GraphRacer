import React, { createContext, useState, useContext } from 'react';
import { levelsData } from '../data/levels';

// 1. Création de la mémoire globale
const GameContext = createContext();

// 2. Le fournisseur de données (L'enveloppe)
export const GameProvider = ({ children }) => {
  // Stocke la progression (quelles étoiles pour quel niveau)
  const [progress, setProgress] = useState({
    1: 0, // Niveau 1 : 0 étoiles
    2: 0,
    3: 0,
    4: 0
  });

  // Stocke le niveau actuel que le joueur a choisi
  const [currentLevel, setCurrentLevel] = useState(null);

  // Fonction pour sauvegarder les étoiles à la fin d'une partie
  const saveStars = (levelId, starsEarned) => {
    setProgress(prev => ({
      ...prev,
      [levelId]: Math.max(prev[levelId], starsEarned) // Garde le meilleur score
    }));
  };

  return (
    <GameContext.Provider value={{ 
      progress, 
      saveStars, 
      currentLevel, 
      setCurrentLevel,
      allLevels: levelsData 
    }}>
      {children}
    </GameContext.Provider>
  );
};

// 3. Un petit raccourci pour utiliser le contexte plus facilement
export const useGame = () => useContext(GameContext);