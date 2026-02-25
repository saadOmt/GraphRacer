import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, CheckCircle, Wifi, Play, Trophy, History, AlertTriangle } from 'lucide-react';
import { LEVELS } from '../data/levels';

// --- OUTILS MATHS ---
const evaluateFunction = (eqStr, xVal) => {
    try {
        let safe = eqStr.toLowerCase().trim();
        if(!safe) return 0;
        safe = safe.replace(/\s+/g, '').replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/abs/g, 'Math.abs').replace(/sqrt/g, 'Math.sqrt').replace(/pi/g, 'Math.PI').replace(/\^/g, '**');
        safe = safe.replace(/(\d)([a-z(])/g, '$1*$2').replace(/([a-z)])(\d)/g, '$1*$2');
        // eslint-disable-next-line no-new-func
        const f = new Function('x', `return ${safe}`);
        const res = f(xVal);
        return (isFinite(res) && !isNaN(res)) ? res : 0;
    } catch (e) { return 0; }
};

const MultiplayerHost = ({ onBack }) => {
  const [ipAddress, setIpAddress] = useState(window.location.hostname);
  const [racePhase, setRacePhase] = useState('lobby'); // lobby, waiting_functions, racing, finished
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0]);
  
  // --- ÉTATS MULTIJOUEURS ---
  const [connectedPlayers, setConnectedPlayers] = useState([]); // Liste des joueurs {id, name, color}
  const [readyPlayers, setReadyPlayers] = useState({}); // Dictionnaire { id: segments }
  const [matchHistory, setMatchHistory] = useState([]);

  // --- REFS DU MOTEUR ---
  const socketRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const carCanvasRef = useRef(null);
  const requestRef = useRef();
  const gameDataRef = useRef({ scale: 30, originY: 500, width: 1000, height: 600 });
  
  // Mémoire physique de toutes les voitures : { id: { x, fuel, status, points, color, name } }
  const physicsStateRef = useRef({});

  // --- CONNEXION SERVEUR ---
  useEffect(() => {
    socketRef.current = io(`http://${window.location.hostname}:4000`);
    
    socketRef.current.on('connect', () => console.log("🖥️ Écran Hôte connecté"));

    // Quand la liste des joueurs change (quelqu'un rejoint ou quitte)
    socketRef.current.on('players_update', (players) => {
        setConnectedPlayers(players);
    });

    // Quand un joueur valide ses équations
    socketRef.current.on('receive_functions', (data) => {
        setReadyPlayers(prev => ({ ...prev, [data.playerId]: data.segments }));
    });

    return () => socketRef.current.close();
  }, []);

  // --- SYNCHRONISATION NIVEAU ---
  useEffect(() => {
      if (socketRef.current) socketRef.current.emit('host_update', { levelId: selectedLevel.id });
  }, [selectedLevel]);

  // --- CALCUL DES TRAJECTOIRES ---
  const calculatePlayerPoints = useCallback((segments) => {
      if (!segments) return [];
      const distance = selectedLevel.distance;
      const maxDist = Math.max(100, distance + 20); const step = 0.1; let points = []; const memo = {}; 

      const getWorldY = (targetX) => {
          const memoKey = Math.round(targetX * 10);
          if (memo[memoKey] !== undefined) return memo[memoKey];
          if (targetX <= 0) return 0;
          const activeSeg = [...segments].reverse().find(s => targetX >= s.start && targetX < s.end);
          if (!activeSeg) return null; 
          let startHeight = 0; if (activeSeg.start > 0) { const prevY = getWorldY(activeSeg.start - 0.01); startHeight = prevY === null ? 0 : prevY; }
          const localY = evaluateFunction(activeSeg.eq, targetX - activeSeg.start);
          const finalY = startHeight + localY; memo[memoKey] = finalY; return finalY;
      };

      for (let x = 0; x <= maxDist; x += step) {
          const y = getWorldY(x); const activeSeg = [...segments].reverse().find(s => x >= s.start && x < s.end);
          points.push({ realX: x, realY: y, segId: activeSeg ? activeSeg.id : null });
      }
      return points;
  }, [selectedLevel]);

  // Initialisation de la course
  useEffect(() => {
      if (racePhase === 'waiting_functions' || racePhase === 'racing') {
          const width = window.innerWidth; const height = window.innerHeight; const gameHeight = height - 150; 
          const scaleY = (gameHeight * 0.7) / 70; const scaleX = (width * 0.9) / selectedLevel.distance;
          let scale = Math.min(scaleY, scaleX); scale = Math.min(Math.max(scale, 15), 80); 
          gameDataRef.current = { scale, originY: gameHeight * 0.85, width, height: gameHeight };
          
          // Calculer les points pour tous les joueurs prêts
          Object.keys(physicsStateRef.current).forEach(id => {
              const segments = readyPlayers[id];
              physicsStateRef.current[id].points = calculatePlayerPoints(segments);
          });
          
          drawBackground(); drawCarFrame();
      }
  }, [racePhase, readyPlayers, selectedLevel, calculatePlayerPoints]); // eslint-disable-line

  // --- DESSIN FOND ET COURBES MULTIPLES ---
  const drawBackground = useCallback(() => {
    if (!bgCanvasRef.current) return;
    const ctx = bgCanvasRef.current.getContext('2d');
    const { scale, originY, width, height } = gameDataRef.current;
    
    bgCanvasRef.current.width = width; bgCanvasRef.current.height = window.innerHeight;
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height); 
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, height, width, window.innerHeight - height);

    ctx.save(); ctx.translate(50, originY);
    ctx.fillStyle = '#334155'; ctx.fillRect(-50 * scale, 0, (width / scale + 100) * scale, height); 
    (selectedLevel.holes || []).forEach(hole => { ctx.fillStyle = '#020617'; ctx.fillRect(hole.start * scale, 0, (hole.end - hole.start) * scale, height); });

    const metersX = Math.ceil((width - 50) / scale);
    ctx.lineWidth = 1; ctx.textAlign = 'center'; ctx.font = '10px monospace';
    for (let i = 0; i <= metersX; i += 5) {
      const x = i * scale; ctx.beginPath(); ctx.moveTo(x, -originY); ctx.lineTo(x, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
      if (i % 10 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(i + 'm', x, 20); }
    }

    const finishX = (selectedLevel?.distance || 20) * scale;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(finishX, -60, 4, 60); ctx.beginPath(); ctx.moveTo(finishX, -60); ctx.lineTo(finishX + 30, -45); ctx.lineTo(finishX, -30); ctx.fill(); 
    ctx.fillStyle = '#ef4444'; (selectedLevel.obstacles || []).forEach(obs => { ctx.fillRect(obs.x * scale, -obs.y * scale - (obs.height * scale), obs.width * scale, obs.height * scale); });

    // Dessin de toutes les courbes de tous les joueurs
    Object.values(physicsStateRef.current).forEach(player => {
        const points = player.points;
        if (!points || points.length === 0) return;
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = player.color; ctx.beginPath();
        let isDrawing = false; let lastSegId = null;
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p.segId === null || p.segId !== lastSegId) { ctx.stroke(); ctx.beginPath(); isDrawing = false; }
            if (p.segId !== null && p.realY !== null) {
                if (!isDrawing) { ctx.moveTo(p.realX * scale, p.realY * -scale); isDrawing = true; } else { ctx.lineTo(p.realX * scale, p.realY * -scale); }
            }
            lastSegId = p.segId;
        }
        ctx.stroke();
    });
    ctx.restore();
  }, [selectedLevel]);

  // --- DESSIN VOITURES MULTIPLES ---
  const drawCarFrame = useCallback(() => {
    if (!carCanvasRef.current) return;
    const ctx = carCanvasRef.current.getContext('2d');
    const { scale, originY, width } = gameDataRef.current;
    
    if(carCanvasRef.current.width !== width) carCanvasRef.current.width = width;
    if(carCanvasRef.current.height !== window.innerHeight) carCanvasRef.current.height = window.innerHeight;

    ctx.clearRect(0, 0, width, window.innerHeight);
    ctx.save(); ctx.translate(50, originY);

    Object.values(physicsStateRef.current).forEach((player, playerIndex) => {
        const currentX = player.x; const points = player.points; const index = Math.floor(currentX * 10);
        if (points && points.length > 0 && currentX >= 0) {
            const point = points[index < points.length ? index : points.length - 1];
            const inHole = (selectedLevel.holes || []).some(h => currentX > h.start && currentX < h.end);
            let effectiveY = (point && point.realY !== null) ? point.realY : -1000; if (!inHole && effectiveY < 0) effectiveY = 0; 
            
            let angle = 0;
            if (point && index < points.length - 1) {
                const nextPoint = points[index+1];
                if (!inHole && effectiveY === 0) angle = 0;
                else if (nextPoint && nextPoint.realY !== null && point.realY !== null) {
                    const dy = -(nextPoint.realY - point.realY) * scale; const dx = (nextPoint.realX - point.realX) * scale; angle = Math.atan2(dy, dx);
                }
            }
            if (effectiveY > -20) {
                ctx.save(); ctx.translate(currentX * scale, effectiveY * -scale); ctx.rotate(angle);
                
                // Petit décalage Y pour voir les voitures si elles sont superposées (ex: 3 voitures = -10, 0, +10)
                const offset = (playerIndex % 3) * -5; 
                ctx.translate(0, offset);

                ctx.fillStyle = player.color; ctx.beginPath(); ctx.roundRect(-15, -10, 30, 10, 4); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillRect(-5, -18, 15, 8); 
                ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-10, 2, 6, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, 2, 6, 0, Math.PI*2); ctx.fill();
                
                // Pseudo au-dessus de la voiture
                ctx.fillStyle = 'white'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; 
                ctx.fillText(player.name, 0, -25);
                ctx.restore();
            }
        }
    });
    ctx.restore();
  }, [selectedLevel]);

  // --- MOTEUR DE COURSE MULTIJOUEUR ---
  const gameLoop = useCallback(() => {
    if (racePhase !== 'racing') { drawCarFrame(); requestRef.current = requestAnimationFrame(gameLoop); return; }

    let allFinished = true;
    const players = Object.values(physicsStateRef.current);

    players.forEach(player => {
        if (player.status !== 'playing') return;
        allFinished = false; // Il reste au moins un joueur en course

        let nextX = player.x + 0.3; player.x = nextX; player.fuel -= 0.15; 
        if (player.fuel <= 0) { player.status = 'empty'; return; }

        const inHole = (selectedLevel.holes || []).some(h => nextX > h.start && nextX < h.end);
        const points = player.points; const index = Math.floor(nextX * 10);
        const point = points[index < points.length ? index : points.length - 1];
        let currentY = (point && point.realY !== null) ? point.realY : -1000;
        if (!inHole && currentY < 0) currentY = 0; 

        let crashed = false;
        if (currentY < -5) crashed = true;
        (selectedLevel.obstacles || []).forEach(obs => { if (nextX >= obs.x && nextX <= obs.x + obs.width && currentY < obs.y + obs.height) crashed = true; });

        if (crashed) { player.status = 'crashed'; return; }
        if (nextX >= selectedLevel.distance) { player.status = 'won'; return; }
    });

    if (allFinished && players.length > 0) {
        setRacePhase('finished');
        
        // --- MISE À JOUR HISTORIQUE ---
        setMatchHistory(prev => {
            const winners = players.filter(p => p.status === 'won');
            let winnerText = 'Crash Général 💥';
            let winnerColor = '#94a3b8';

            if (winners.length > 0) {
                // S'il y a des gagnants, on les trie par carburant restant (le plus grand)
                winners.sort((a, b) => b.fuel - a.fuel);
                winnerText = winners.map(w => w.name).join(', ') + ' 🏆';
                winnerColor = winners[0].color;
            }

            return [...prev, {
                race: prev.length + 1,
                level: selectedLevel.title,
                winner: winnerText,
                color: winnerColor
            }];
        });
    }

    drawCarFrame(); requestRef.current = requestAnimationFrame(gameLoop);
  }, [racePhase, selectedLevel, drawCarFrame]);

  useEffect(() => { requestRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(requestRef.current); }, [gameLoop]);

  // --- ACTIONS LOBBY ---
  const startLobbyToWait = () => {
      setReadyPlayers({});
      
      // On initialise le dictionnaire des joueurs avec tous ceux connectés
      const initialState = {};
      connectedPlayers.forEach(p => {
          initialState[p.id] = { id: p.id, name: p.name, color: p.color, x: 0, fuel: 100, status: 'playing', points: [] };
      });
      physicsStateRef.current = initialState;
      
      setRacePhase('waiting_functions');
  };

  const startActualRace = () => setRacePhase('racing');
  const cancelRace = () => setRacePhase('lobby');

  // --- RENDU 1 : LOBBY ---
  if (racePhase === 'lobby') {
    const port = window.location.port ? `:${window.location.port}` : '';
    const joinUrl = `http://${ipAddress}${port}/join`; // L'URL UNIQUE !

    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: 'white', fontFamily: 'monospace' }}>
        
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <button onClick={onBack} style={{ background: '#1e293b', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><ArrowLeft size={24}/></button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a855f7', margin: 0 }}><Users /> LOBBY (PARTY GAME)</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}>
            <Wifi size={16} color="#22d3ee" /><span>IP:</span>
            <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#22d3ee', fontWeight: 'bold', width: '120px', outline: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '30px' }}>
            
            {/* GAUCHE : QR CODE UNIQUE ET LISTE JOUEURS */}
            <div style={{ flex: 2, display: 'flex', gap: '30px' }}>
                {/* QR CODE */}
                <div style={{ background: '#0f172a', padding: '30px', borderRadius: '20px', border: `2px solid #334155`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '20px' }}>REJOINDRE LA PARTIE</h2>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
                        <QRCodeSVG value={joinUrl} size={220} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>Scannez le QR Code ou allez sur :<br/><strong style={{color:'#22d3ee'}}>{joinUrl}</strong></p>
                </div>
                
                {/* LISTE DES JOUEURS CONNECTÉS */}
                <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}><Users size={20}/> JOUEURS CONNECTÉS ({connectedPlayers.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', overflowY: 'auto' }}>
                        {connectedPlayers.length === 0 ? (
                            <div style={{ color: '#64748b', fontStyle: 'italic', width: '100%', textAlign: 'center', marginTop: '20px' }}>En attente des joueurs...</div>
                        ) : (
                            connectedPlayers.map((p, i) => (
                                <div key={i} style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.3)', borderLeft: `5px solid ${p.color}`, borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: p.color }}></div>
                                    {p.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* DROITE : HISTORIQUE ET LANCEMENT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flex: 1, background: '#0f172a', borderRadius: '20px', padding: '20px', border: '1px solid #1e293b', overflowY: 'auto' }}>
                    <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#a855f7' }}><History /> HISTORIQUE</h2>
                    {matchHistory.length === 0 ? (
                        <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>Aucune course terminée.</p>
                    ) : (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px 5px' }}>#</th>
                                    <th style={{ padding: '10px 5px' }}>Niveau</th>
                                    <th style={{ padding: '10px 5px' }}>Gagnant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchHistory.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '12px 5px', color: '#cbd5e1' }}>{m.race}</td>
                                        <td style={{ padding: '12px 5px', color: '#cbd5e1' }}>{m.level}</td>
                                        <td style={{ padding: '12px 5px', fontWeight: 'bold', color: m.color }}>{m.winner}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* MENU START */}
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ color: '#94a3b8' }}>Choisir le niveau :</label>
                    <select value={selectedLevel.id} onChange={(e) => setSelectedLevel(LEVELS.find(l => l.id === parseInt(e.target.value)))} style={{ padding: '15px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', fontSize: '1.1rem', fontFamily: 'monospace', cursor: 'pointer' }}>
                        {LEVELS.map(l => <option key={l.id} value={l.id}>Niveau {l.id} : {l.title}</option>)}
                    </select>
                    <button onClick={startLobbyToWait} disabled={connectedPlayers.length === 0} style={{ padding: '15px', fontSize: '1.2rem', fontWeight: '900', background: connectedPlayers.length === 0 ? '#334155' : 'linear-gradient(90deg, #9333ea, #db2777)', border: 'none', borderRadius: '10px', color: 'white', cursor: connectedPlayers.length === 0 ? 'not-allowed' : 'pointer' }}>
                        PRÉPARER LA COURSE
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDU 2 : LA COURSE ---
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: '#020617', color: 'white', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 50, pointerEvents: 'none' }}>
        <button onClick={cancelRace} style={{ pointerEvents: 'auto', background: '#1e293b', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><ArrowLeft size={16} style={{display:'inline', verticalAlign:'middle'}}/> ABANDONNER</button>
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#a855f7', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>NIVEAU : {selectedLevel.title}</h2>
        </div>
        <div style={{ width: '150px' }}></div> 
      </div>

      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
      <canvas ref={carCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} />

      {/* OVERLAY : ATTENTE (Affichage dynamique de tous les joueurs) */}
      {racePhase === 'waiting_functions' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '160px', backgroundColor: '#0f172a', borderTop: '2px solid #334155', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px', width: '90%', justifyContent: 'center' }}>
                {Object.values(physicsStateRef.current).map(player => (
                    <div key={player.id} style={{ padding: '10px 20px', background: readyPlayers[player.id] ? '#166534' : 'rgba(0,0,0,0.5)', border: `2px solid ${player.color}`, borderRadius: '10px', minWidth: '150px', textAlign: 'center' }}>
                        <h4 style={{ color: player.color, margin: '0 0 5px 0' }}>{player.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{readyPlayers[player.id] ? "✅ Prêt" : "⏳ Attend..."}</div>
                    </div>
                ))}
            </div>
            
            {Object.keys(readyPlayers).length > 0 && Object.keys(readyPlayers).length === connectedPlayers.length && (
                <button onClick={startActualRace} style={{ position: 'absolute', right: '40px', padding: '15px 30px', fontSize: '1.2rem', fontWeight: '900', background: '#22c55e', border: 'none', borderRadius: '15px', color: 'white', cursor: 'pointer', boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)', animation: 'pulse 1.5s infinite' }}>
                    <Play size={20} fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '5px' }} /> DÉMARRER
                </button>
            )}
        </div>
      )}

      {/* OVERLAY : RÉSULTATS DYNAMIQUES */}
      {racePhase === 'finished' && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={60} color="#facc15" style={{ marginBottom: '10px' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>RÉSULTATS DE LA COURSE</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '80%', marginBottom: '40px' }}>
                {Object.values(physicsStateRef.current).sort((a,b) => b.fuel - a.fuel).map(player => (
                    <div key={player.id} style={{ padding: '20px', background: player.status === 'won' ? '#166534' : '#450a0a', border: `3px solid ${player.color}`, borderRadius: '15px', width: '220px', textAlign: 'center' }}>
                        <h2 style={{ color: player.color, margin: '0 0 10px 0', fontSize: '1.2rem' }}>{player.name}</h2>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {player.status === 'won' ? '🏁 ARRIVÉ' : player.status === 'empty' ? '⛽ PANNE' : '💥 CRASH'}
                        </div>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#cbd5e1' }}>Fuel : {Math.max(0, Math.round(player.fuel))}%</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={startLobbyToWait} style={{ padding: '15px 30px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>REVANCHE</button>
                <button onClick={cancelRace} style={{ padding: '15px 30px', background: '#1e293b', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>RETOUR LOBBY</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerHost;