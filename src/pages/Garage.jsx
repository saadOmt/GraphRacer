import React from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, CarFront, PaintBucket, Palette } from 'lucide-react';

const COLORS = ['#facc15', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#ffffff', '#000000'];
const BG_COLORS = ['#020617', '#1e1e1e', '#0f172a', '#312e81'];

const Garage = ({ onBack }) => {
  const { carColor, setCarColor, lineColor, setLineColor, bgColor, setBgColor } = useGame();

  const containerStyle = {
    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center',
    backgroundColor: '#020617', color: 'white', fontFamily: 'monospace', position: 'relative'
  };

  const sectionStyle = {
    background: '#0f172a', padding: '20px', borderRadius: '15px', border: '1px solid #334155', marginBottom: '20px', width: '100%', maxWidth: '500px'
  };

  return (
    <div style={containerStyle}>
      <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', background: '#1e293b', border: 'none', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
        <ArrowLeft />
      </button>

      <h1 style={{ fontSize: '3rem', marginTop: '60px', marginBottom: '10px' }}>GARAGE</h1>
      
      {/* Aperçu */}
      <div style={{ width: '300px', height: '150px', background: bgColor, borderRadius: '20px', border: '2px solid #475569', marginBottom: '30px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '100%', height: '4px', background: lineColor, top: '60%', boxShadow: `0 0 10px ${lineColor}` }}></div>
          <div style={{ width: '50px', height: '25px', background: carColor, borderRadius: '5px 5px 0 0', position: 'relative', zIndex: 10, top: '-10px' }}>
             <div style={{ width: '10px', height: '10px', background: '#333', borderRadius: '50%', position: 'absolute', bottom: '-5px', left: '5px' }}></div>
             <div style={{ width: '10px', height: '10px', background: '#333', borderRadius: '50%', position: 'absolute', bottom: '-5px', right: '5px' }}></div>
          </div>
      </div>

      <div style={sectionStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}><PaintBucket size={18}/> VOITURE</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                  <button key={c} onClick={() => setCarColor(c)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: carColor === c ? '3px solid white' : 'none', cursor: 'pointer' }} />
              ))}
          </div>
      </div>

      <div style={sectionStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}><div style={{ width: '15px', height: '4px', background: 'white' }}></div> TRACÉ</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                  <button key={c} onClick={() => setLineColor(c)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: lineColor === c ? '3px solid white' : 'none', cursor: 'pointer' }} />
              ))}
          </div>
      </div>

      <div style={sectionStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}><Palette size={18}/> FOND</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {BG_COLORS.map(c => (
                  <button key={c} onClick={() => setBgColor(c)} style={{ flex: 1, height: '40px', borderRadius: '8px', background: c, border: bgColor === c ? '2px solid white' : '1px solid #334155', cursor: 'pointer' }} />
              ))}
          </div>
      </div>

    </div>
  );
};

export default Garage;