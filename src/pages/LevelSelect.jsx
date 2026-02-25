import React from 'react';
import { LEVELS } from '../data/levels';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Play, Lock, CheckCircle } from 'lucide-react';

const LevelSelect = ({ onBack, onPlayLevel }) => {
  const { unlockedLevels } = useGame(); // Utilise bien unlockedLevels (Array)

  const containerStyle = {
    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
    backgroundColor: '#020617', color: 'white', fontFamily: 'monospace', overflow: 'hidden'
  };

  const headerStyle = {
    padding: '20px 40px', display: 'flex', alignItems: 'center',
    background: '#0f172a', borderBottom: '1px solid #1e293b', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  };

  const scrollContainerStyle = {
    flex: 1, display: 'flex', gap: '40px', padding: '40px',
    overflowX: 'auto', alignItems: 'center'
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <button onClick={onBack} style={{ background: '#1e293b', border: '1px solid #475569', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', marginRight: '20px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '2rem', fontStyle: 'italic', fontWeight: '900' }}>
          SÉLECTION <span style={{ color: '#22d3ee' }}>NIVEAU</span>
        </h1>
      </div>

      {/* CARDS */}
      <div style={scrollContainerStyle}>
        {LEVELS.map((level) => {
          const isLocked = !unlockedLevels.includes(level.id);
          
          return (
            <div 
              key={level.id}
              style={{
                minWidth: '350px', height: '450px', 
                background: isLocked ? '#0f172a' : 'linear-gradient(145deg, #0f172a, #1e293b)',
                borderRadius: '20px', padding: '30px',
                border: isLocked ? '1px solid #334155' : '2px solid #22d3ee',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                opacity: isLocked ? 0.6 : 1,
                boxShadow: isLocked ? 'none' : '0 0 20px rgba(34, 211, 238, 0.2)',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ padding: '5px 10px', background: '#020617', color: '#22d3ee', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #1e293b' }}>
                    NIVEAU {level.id}
                  </span>
                  {!isLocked && <CheckCircle size={24} color="#22c55e" />}
                  {isLocked && <Lock size={24} color="#64748b" />}
                </div>

                <h3 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', marginBottom: '10px' }}>{level.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', height: '60px', overflow: 'hidden' }}>{level.description}</p>

                {/* Info Box */}
                <div style={{ marginTop: '20px', background: '#020617', borderRadius: '10px', padding: '15px', display: 'flex', justifyContent: 'space-between', border: '1px solid #1e293b' }}>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>DISTANCE</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{level.distance}m</div>
                   </div>
                   <div style={{ width: '1px', background: '#334155' }}></div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>DANGER</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{level.obstacles?.length || 0}</div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => !isLocked && onPlayLevel(level)}
                disabled={isLocked}
                style={{
                  width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                  background: isLocked ? '#334155' : 'linear-gradient(90deg, #0891b2, #2563eb)',
                  color: isLocked ? '#94a3b8' : 'white',
                  fontWeight: 'bold', fontSize: '1rem', cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                {isLocked ? 'VERROUILLÉ' : <><Play size={20} fill="currentColor"/> DÉMARRER</>}
              </button>
            </div>
          );
        })}
        
        {/* Padding fin */}
        <div style={{ minWidth: '50px' }}></div>
      </div>
    </div>
  );
};

export default LevelSelect;