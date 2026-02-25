import React from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Settings, Grid, Trash2, Volume2 } from 'lucide-react';

const SettingsPage = ({ onBack }) => {
  const { showGrid, setShowGrid, resetProgress } = useGame();

  const containerStyle = {
    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#020617', color: 'white', fontFamily: 'monospace'
  };

  const itemStyle = {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '400px',
      background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '15px'
  };

  return (
    <div style={containerStyle}>
      <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', background: '#1e293b', border: 'none', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
        <ArrowLeft />
      </button>

      <h1 style={{ fontSize: '3rem', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Settings /> PARAMÈTRES
      </h1>

      <div style={itemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Grid color="#94a3b8" />
              <span>Afficher la grille</span>
          </div>
          <button 
            onClick={() => setShowGrid(!showGrid)}
            style={{ width: '50px', height: '25px', background: showGrid ? '#22c55e' : '#475569', borderRadius: '25px', position: 'relative', border: 'none', cursor: 'pointer' }}
          >
              <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2.5px', left: showGrid ? '27px' : '2.5px', transition: 'left 0.2s' }} />
          </button>
      </div>

      <div style={{ ...itemStyle, opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 color="#94a3b8" />
              <span>Son (Désactivé)</span>
          </div>
      </div>

      <button 
        onClick={resetProgress}
        style={{ marginTop: '30px', padding: '15px 30px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
      >
          <Trash2 size={18} /> RÉINITIALISER LA PROGRESSION
      </button>

    </div>
  );
};

export default SettingsPage;