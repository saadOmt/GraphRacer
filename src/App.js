import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';

import Home from './pages/Home';
import LevelSelect from './pages/LevelSelect';
import Game from './pages/Game';
import Garage from './pages/Garage';
import SettingsPage from './pages/Settings';
import RemoteController from './pages/RemoteController';
import MultiplayerHost from './pages/MultiplayerHost';





// --- LE SYSTÈME DE NAVIGATION ---
const AppRoutes = () => {
  const navigate = useNavigate();
  const { setCurrentLevel } = useGame();

  return (
    <Routes>
      {/* Menu Principal */}
      <Route path="/" element={
        <Home 
          onStart={() => navigate('/select')} 
          onMultiplayer={() => navigate('/multi-host')}
          onGarage={() => navigate('/garage')}
          onSettings={() => navigate('/settings')}
        />
      } />
      
      {/* Mode Solo */}
      <Route path="/select" element={
        <LevelSelect 
          onBack={() => navigate('/')} 
          onPlayLevel={(level) => { setCurrentLevel(level); navigate('/game'); }} 
        />
      } />
      <Route path="/game" element={<Game onBack={() => navigate('/select')} />} />
      
      {/* Personnalisation */}
      <Route path="/garage" element={<Garage onBack={() => navigate('/')} />} />
      <Route path="/settings" element={<SettingsPage onBack={() => navigate('/')} />} />
      
      {/* Mode Multijoueur */}
      <Route path="/multi-host" element={<MultiplayerHost onBack={() => navigate('/')} />}  />
      <Route path="/join" element={<RemoteController />} />
    </Routes>
  );
};

function App() {
  return (
    <GameProvider>
      <Router>
        <AppRoutes />
      </Router>
    </GameProvider>
  );
}

export default App;