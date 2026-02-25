import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Plus, Trash2, Play, Activity, Lightbulb, Calculator, X, User } from 'lucide-react';
import { LEVELS } from '../data/levels';

const RemoteController = () => {
  // --- ÉTATS RÉSEAU ---
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // --- ÉTATS JOUEUR (NOUVEAU) ---
  const [playerName, setPlayerName] = useState('');
  // Génère une couleur aléatoire par défaut pour gagner du temps
  const [carColor, setCarColor] = useState('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
  const [hasJoined, setHasJoined] = useState(false);

  // --- ÉTATS JEU ---
  const [segments, setSegments] = useState([{ id: Date.now(), eq: "0", start: 0, end: 20 }]);
  const [hasSent, setHasSent] = useState(false);
  const [levelId, setLevelId] = useState(1);
  const currentLevel = LEVELS.find(l => l.id === levelId) || LEVELS[0];

  const [showMemo, setShowMemo] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // --- CONNEXION SERVEUR ---
  useEffect(() => {
    const newSocket = io(`http://${window.location.hostname}:4000`);
    setSocket(newSocket);
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    
    // Le PC nous informe si le niveau change
    newSocket.on('host_update', (data) => {
        if (data.levelId) {
            setLevelId(data.levelId);
            setHasSent(false); // On réactive le bouton GO si le niveau change
        }
    });

    return () => newSocket.close(); 
  }, []);

  // --- ACTIONS ---
  const handleJoin = (e) => {
      e.preventDefault();
      if (playerName.trim() !== '' && socket && isConnected) {
          // On envoie notre identité au serveur
          socket.emit('join_game', { 
              name: playerName.trim().substring(0, 10).toUpperCase(), // Limite à 10 lettres, en MAJUSCULES
              color: carColor 
          });
          setHasJoined(true);
      }
  };

  const updateSegment = (id, field, value) => { setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s)); setHasSent(false); };
  const addSegment = () => { const start = segments.length > 0 ? segments[segments.length - 1].end : 0; setSegments([...segments, { id: Date.now(), eq: "0", start: start, end: start + 20 }]); setHasSent(false); };
  const removeSegment = (id) => { if (segments.length > 1) setSegments(prev => prev.filter(s => s.id !== id)); setHasSent(false); };
  const addPresetFunction = (equation) => { const start = segments.length > 0 ? segments[segments.length - 1].end : 0; setSegments([...segments, { id: Date.now(), eq: equation, start: start, end: start + 20 }]); setShowTools(false); setHasSent(false); };

  const handleSend = () => {
    if (socket && isConnected) {
      socket.emit('submit_functions', { segments: segments }); // L'ID est géré par le serveur maintenant
      setHasSent(true);
    }
  };

  // =================================================================
  // ÉCRAN 1 : CONNEXION (Saisie du Pseudo)
  // =================================================================
  if (!hasJoined) {
      return (
          <div style={{ height: '100dvh', width: '100vw', backgroundColor: '#0f172a', color: 'white', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#22d3ee' }}>REJOINDRE</h1>
                  <p style={{ color: '#94a3b8' }}>{isConnected ? '🟢 Connecté au serveur' : '🔴 Connexion en cours...'}</p>
              </div>

              <form onSubmit={handleJoin} style={{ width: '100%', maxWidth: '350px', background: '#1e293b', padding: '30px', borderRadius: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div>
                      <label style={{ display: 'block', marginBottom: '10px', color: '#cbd5e1', fontWeight: 'bold' }}><User size={16} style={{verticalAlign:'middle'}}/> TON PSEUDO</label>
                      <input 
                          type="text" 
                          value={playerName} 
                          onChange={(e) => setPlayerName(e.target.value)} 
                          placeholder="Ex: INGENIEUR_1"
                          maxLength={10}
                          style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #334155', background: '#020617', color: 'white', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          required
                      />
                  </div>

                  <div>
                      <label style={{ display: 'block', marginBottom: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>🎨 COULEUR DE TA VOITURE</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <input 
                              type="color" 
                              value={carColor} 
                              onChange={(e) => setCarColor(e.target.value)} 
                              style={{ width: '60px', height: '60px', padding: '0', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'transparent' }}
                          />
                          <span style={{ color: carColor, fontWeight: 'bold', fontSize: '1.2rem' }}>MA COULEUR</span>
                      </div>
                  </div>

                  <button 
                      type="submit" 
                      disabled={!isConnected || !playerName.trim()} 
                      style={{ width: '100%', padding: '15px', marginTop: '10px', borderRadius: '10px', background: isConnected && playerName.trim() ? carColor : '#334155', color: 'white', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: isConnected && playerName.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.3s' }}
                  >
                      PRÊT !
                  </button>
              </form>
          </div>
      );
  }

  // =================================================================
  // ÉCRAN 2 : LA MANETTE (En Jeu)
  // =================================================================
  return (
    <div style={{ height: '100dvh', width: '100vw', backgroundColor: '#020617', color: 'white', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER : NOM ET COULEUR DU JOUEUR */}
      <div style={{ padding: '15px', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${carColor}` }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: carColor, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
          <Activity size={20} color={carColor} /> {playerName}
        </h1>
      </div>

      {/* BARRE D'OUTILS (Aide & Fonctions) */}
      <div style={{ padding: '10px 15px', display: 'flex', gap: '10px', background: '#1e293b' }}>
          <button onClick={() => setShowMemo(true)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '10px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <Lightbulb size={18}/> AIDE
          </button>
          <button onClick={() => setShowTools(true)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '10px', background: '#64748b', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <Calculator size={18}/> OUTILS
          </button>
      </div>

      {/* ZONES D'ÉQUATIONS */}
      <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {segments.map((seg, idx) => (
              <div key={seg.id} style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: `1px solid ${carColor}50` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ color: carColor, fontStyle: 'italic', fontWeight: 'bold', fontSize: '1.2rem' }}>f(x)=</span>
                      <input type="text" value={seg.eq} onChange={(e) => updateSegment(seg.id, 'eq', e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', padding: '10px', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none' }} autoCapitalize="none" autoCorrect="off" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem', flexWrap: 'wrap', color: '#94a3b8' }}>
                      <span>Sur [</span>
                      <input type="number" value={seg.start} onChange={(e) => updateSegment(seg.id, 'start', parseFloat(e.target.value))} style={{ width: '50px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px', padding: '8px', textAlign: 'center' }} />
                      <span>;</span>
                      <input type="number" value={seg.end} onChange={(e) => updateSegment(seg.id, 'end', parseFloat(e.target.value))} style={{ width: '50px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px', padding: '8px', textAlign: 'center' }} />
                      <span>]</span>
                      <button onClick={() => removeSegment(seg.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', padding: '5px' }}><Trash2 size={20}/></button>
                  </div>
              </div>
          ))}
          <button onClick={addSegment} style={{ padding: '15px', background: 'transparent', border: `2px dashed ${carColor}80`, color: 'white', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
              <Plus size={20}/> Ajouter un tronçon
          </button>
      </div>

      {/* BOUTON GO GÉANT */}
      <div style={{ padding: '15px', backgroundColor: '#0f172a', borderTop: '2px solid #1e293b' }}>
        <button onClick={handleSend} disabled={!isConnected} style={{ width: '100%', padding: '20px', borderRadius: '15px', backgroundColor: hasSent ? '#166534' : carColor, border: 'none', color: 'white', fontSize: '1.5rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: `0 5px 15px rgba(0,0,0,0.3)`, opacity: isConnected ? 1 : 0.5, transition: 'all 0.2s' }}>
          {hasSent ? 'ENVOYÉ !' : <><Play fill="currentColor" size={28}/> GO !</>}
        </button>
      </div>

      {/* MODAL MEMO */}
      {showMemo && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '400px', border: '2px solid #3b82f6', position: 'relative' }}>
                <button onClick={() => setShowMemo(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>
                <h2 style={{ color: '#3b82f6', fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems:'center', gap:'10px' }}><Lightbulb size={24}/> MÉMO NIV. {currentLevel.id}</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: '1.6', color: '#cbd5e1' }}>{currentLevel.memo || "Pas de conseil pour ce niveau."}</div>
            </div>
        </div>
      )}

      {/* MODAL OUTILS */}
      {showTools && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#1e293b', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '400px', border: '2px solid #64748b', position: 'relative' }}>
                <button onClick={() => setShowTools(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>
                <h2 style={{ color: '#94a3b8', fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems:'center', gap:'10px' }}><Calculator size={24}/> OUTILS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {[
                        { label: 'Linéaire', code: '0.5 * x' }, { label: 'Parabole', code: '0.1 * x^2' },
                        { label: 'Racine', code: 'sqrt(x)' }, { label: 'Sinus', code: '2 * sin(x/2)' },
                        { label: 'Cosinus', code: '2 * cos(x/2)' }, { label: 'Absolue', code: 'abs(x)' }
                    ].map(f => (
                        <button key={f.label} onClick={() => addPresetFunction(f.code)} style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155', color: 'white', textAlign: 'left' }}>
                            <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize:'1rem' }}>{f.label}</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop:'5px' }}>{f.code}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RemoteController;