import React from 'react';
import { ArrowRight, Settings, Users, User, CarFront } from 'lucide-react';

const Home = ({ onStart, onMultiplayer, onGarage, onSettings }) => {
  const containerStyle = {
    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617',
    color: 'white', fontFamily: 'monospace', position: 'relative', overflow: 'hidden'
  };

  const titleStyle = {
    fontSize: '4rem', fontWeight: '900', marginBottom: '10px',
    background: '-webkit-linear-gradient(left, #22d3ee, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  };

  const btnMainStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
    width: '300px', padding: '20px', fontSize: '1.2rem', fontWeight: 'bold',
    color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '15px',
    transition: 'all 0.2s'
  };

  const btnSecStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: '140px', padding: '15px', fontSize: '0.9rem', fontWeight: 'bold',
    color: '#cbd5e1', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '12px', cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      {/* Grille de fond */}
      <svg style={{ position: 'absolute', opacity: 0.1, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div style={{ zIndex: 10, textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={titleStyle}>GRAPH<span style={{WebkitTextFillColor: 'white'}}>RACER</span></h1>
        <p style={{ color: '#bae6fd', letterSpacing: '5px' }}>ENGINEER EDITION</p>
      </div>

      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        
        {/* BOUTON 1 JOUEUR */}
        <button onClick={onStart} style={{ ...btnMainStyle, background: 'linear-gradient(90deg, #0891b2, #2563eb)', boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' }}>
          <User /> 1 JOUEUR <ArrowRight />
        </button>

        {/* BOUTON 2 JOUEURS (ACTIF !) */}
        <button onClick={onMultiplayer} style={{ ...btnMainStyle, background: 'linear-gradient(90deg, #9333ea, #db2777)', boxShadow: '0 0 20px rgba(219, 39, 119, 0.3)' }}>
          <Users /> MULTI JOUEURS <ArrowRight />
        </button>

        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <button onClick={onGarage} style={btnSecStyle}>
              <CarFront size={24} style={{ marginBottom: '5px', color: '#facc15' }} /> GARAGE
            </button>
            <button onClick={onSettings} style={btnSecStyle}>
              <Settings size={24} style={{ marginBottom: '5px', color: '#22d3ee' }} /> OPTIONS
            </button>
        </div>
      </div>
    </div>
  );
};

export default Home;