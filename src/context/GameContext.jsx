import React, { createContext, useState, useContext, useEffect } from 'react';
import { LEVELS } from '../data/levels';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0]);
  
  // On lit la sauvegarde, ou on met 1 par défaut
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem('graphracer_max_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Fonction pour débloquer le niveau suivant
  const unlockNextLevel = (currentId) => {
    if (currentId >= maxUnlockedLevel) {
        const nextId = currentId + 1;
        setMaxUnlockedLevel(nextId);
        localStorage.setItem('graphracer_max_level', nextId.toString());
    }
  };

  return (
    <GameContext.Provider value={{ currentLevel, setCurrentLevel, maxUnlockedLevel, unlockNextLevel }}>
      {children}
    </GameContext.Provider>
  );
};