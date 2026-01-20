import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Zap, Star, Plus, Trash2, Play, Trophy, AlertTriangle } from 'lucide-react';
import { LEVELS } from '../data/levels';

const Game = ({ onBack }) => {
  const { currentLevel, setCurrentLevel, unlockNextLevel } = useGame();
  
  // --- ÉTATS ---
  const [segments, setSegments] = useState([{ id: 1, eq: "0", start: 0, end: 100 }]);
  const [error, setError] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing'); 
  
  const [uiFuel, setUiFuel] = useState(100);
  const [uiStars, setUiStars] = useState(0);
  const [collectedStars, setCollectedStars] = useState([]);

  // --- REFS ---
  const gameState = useRef({ x: 0, fuel: 100, stars: [], lastFrame: 0 });
  const bgCanvasRef = useRef(null);
  const carCanvasRef = useRef(null);
  const keysPressed = useRef({});
  const requestRef = useRef();
  const gameDataRef = useRef(null);

  // Initialisation
  useEffect(() => {
    // Par défaut, on met un segment de 0 à 100 pour ne pas tomber tout de suite
    setSegments([{ id: Date.now(), eq: "0", start: 0, end: 100 }]);
    setGameStatus('playing');
    setUiFuel(100);
    setUiStars(0);
    setCollectedStars([]);
    
    gameState.current = { x: 0, fuel: 100, stars: [], lastFrame: 0 };
    gameDataRef.current = null;
    
    setTimeout(() => { calculateData([{ id: 1, eq: "0", start: 0, end: 100 }]); }, 50);
  }, [currentLevel]);

  // =========================================================
  // 1. EVALUATEUR MATHÉMATIQUE
  // =========================================================
  const evaluateFunction = (eqStr, xVal) => {
      try {
          let safe = eqStr.toLowerCase().trim();
          if(!safe) return 0;
          
          safe = safe.replace(/\s+/g, '')
             .replace(/sin/g, 'Math.sin')
             .replace(/cos/g, 'Math.cos')
             .replace(/tan/g, 'Math.tan')
             .replace(/abs/g, 'Math.abs')
             .replace(/sqrt/g, 'Math.sqrt')
             .replace(/pi/g, 'Math.PI')
             .replace(/\^/g, '**');
             
          safe = safe.replace(/(\d)([a-z(])/g, '$1*$2');
          
          const f = new Function('x', `return ${safe}`);
          const res = f(xVal);
          return (isFinite(res) && !isNaN(res)) ? res : 0;
      } catch (e) {
          return 0;
      }
  };

  // =========================================================
  // 2. MOTEUR "CHAÎNE" (RECURSIF)
  // =========================================================
  const getWorldY = (targetX, segmentList, memo = {}) => {
      const memoKey = Math.round(targetX * 10);
      if (memo[memoKey] !== undefined) return memo[memoKey];

      if (targetX <= 0) return 0;

      // On cherche le segment actif (priorité inverse)
      const activeSeg = [...segmentList].reverse().find(s => targetX >= s.start && targetX < s.end);

      // S'il n'y a pas de segment défini ici, on renvoie NULL (vide)
      if (!activeSeg) return null; 

      let startHeight = 0;
      if (activeSeg.start > 0) {
          // On cherche la hauteur juste avant le début du segment
          const prevY = getWorldY(activeSeg.start - 0.01, segmentList, memo);
          // Si le segment précédent n'existait pas (vide), on commence à 0
          startHeight = prevY === null ? 0 : prevY;
      }

      const localX = targetX - activeSeg.start;
      const localY = evaluateFunction(activeSeg.eq, localX);
      const finalY = startHeight + localY;
      
      memo[memoKey] = finalY;
      return finalY;
  };

  // =========================================================
  // 3. CALCUL GLOBAL DU TERRAIN
  // =========================================================
  const calculateData = (currentSegments) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const gameHeight = height - 180; 
    const distance = currentLevel?.distance || 20;
    
    // On génère jusqu'à la fin de l'écran, pas plus loin que nécessaire
    const maxDist = Math.max(100, distance + 20); 
    const step = 0.1;
    let points = [];
    const memo = {}; 

    for (let x = 0; x <= maxDist; x += step) {
        const y = getWorldY(x, currentSegments, memo);
        
        // On stocke le segment ID pour savoir quand couper le trait
        const activeSeg = [...currentSegments].reverse().find(s => x >= s.start && x < s.end);
        
        // Si Y est null (pas de fonction), on stocke null
        points.push({ realX: x, realY: y, segId: activeSeg ? activeSeg.id : null });
    }

    const fixedMinY = -10; const fixedMaxY = 40;
    const scaleY = (gameHeight * 0.7) / (fixedMaxY - fixedMinY); 
    const scaleX = (width * 0.9) / distance;
    let scale = Math.min(scaleY, scaleX);
    scale = Math.min(Math.max(scale, 15), 80); 
    let originY = gameHeight * 0.85; 

    gameDataRef.current = { points, scale, originY, width, height: gameHeight };
    
    drawBackground();
    drawCarFrame();
  };

  // =========================================================
  // 4. DESSIN FOND
  // =========================================================
  const drawBackground = () => {
    if (!gameDataRef.current || !bgCanvasRef.current) return;
    const ctx = bgCanvasRef.current.getContext('2d');
    const { points, scale, originY, width, height } = gameDataRef.current;
    
    bgCanvasRef.current.width = width;
    bgCanvasRef.current.height = window.innerHeight;
    
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height); 
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, height, width, window.innerHeight - height);

    ctx.save();
    ctx.translate(50, originY);

    // Sol Fixe
    ctx.fillStyle = '#334155';
    const holes = currentLevel.holes || [];
    if (holes.length === 0) {
        ctx.fillRect(-50 * scale, 0, width + 2000, height); 
    } else {
        let cursor = -50;
        const sortedHoles = [...holes].sort((a,b) => a.start - b.start);
        sortedHoles.forEach(hole => {
            if (hole.start > cursor) ctx.fillRect(cursor * scale, 0, (hole.start - cursor) * scale, height);
            cursor = hole.end;
        });
        ctx.fillRect(cursor * scale, 0, (width/scale + 100) * scale, height);
    }

    // Grille
    let step = 5; if(scale < 15) step = 10;
    const metersX = Math.ceil((width - 50) / scale);
    ctx.lineWidth = 1; ctx.textAlign = 'center'; ctx.font = '10px monospace';
    for (let i = 0; i <= metersX; i += step) {
      const x = i * scale;
      ctx.beginPath(); ctx.moveTo(x, -originY); ctx.lineTo(x, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
      if (i % 10 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(i + 'm', x, 20); }
    }

    // Fonction (Ligne Bleue) - CORRECTION ICI
    if (points.length > 0) {
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      
      let isDrawing = false;
      let lastSegId = null;

      for (let i = 0; i < points.length; i++) {
          const p = points[i];
          
          // Si le point n'a pas de segment (zone vide) ou change de segment
          if (p.segId === null || p.segId !== lastSegId) {
              ctx.stroke(); // On dessine ce qui est en cours
              ctx.beginPath(); // On coupe
              isDrawing = false;
          }

          if (p.segId !== null && p.realY !== null) {
              if (!isDrawing) {
                  ctx.moveTo(p.realX * scale, p.realY * -scale);
                  isDrawing = true;
              } else if (p.realX * scale < width) {
                  ctx.lineTo(p.realX * scale, p.realY * -scale);
              }
          }
          
          lastSegId = p.segId;
      }
      ctx.stroke();
    }

    // Obstacles & Drapeau
    if(currentLevel.obstacles) {
        ctx.fillStyle = '#ef4444'; 
        currentLevel.obstacles.forEach(obs => {
            ctx.fillRect(obs.x * scale, -obs.y * scale - (obs.height * scale), obs.width * scale, obs.height * scale);
        });
    }
    const finishX = (currentLevel?.distance || 20) * scale;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(finishX, -60, 4, 60);
    ctx.beginPath(); ctx.moveTo(finishX, -60); ctx.lineTo(finishX + 30, -45); ctx.lineTo(finishX, -30); ctx.fill();

    ctx.restore();
  };

  // =========================================================
  // 5. DESSIN VOITURE
  // =========================================================
  const drawCarFrame = () => {
    if (!gameDataRef.current || !carCanvasRef.current) return;
    const ctx = carCanvasRef.current.getContext('2d');
    const { points, scale, originY, width } = gameDataRef.current;
    
    if(carCanvasRef.current.width !== width) carCanvasRef.current.width = width;
    if(carCanvasRef.current.height !== window.innerHeight) carCanvasRef.current.height = window.innerHeight;

    ctx.clearRect(0, 0, width, window.innerHeight);
    ctx.save();
    ctx.translate(50, originY);

    // Etoiles
    const time = Date.now();
    (currentLevel.stars || []).forEach((star, index) => {
        if (!gameState.current.stars.includes(index)) {
            ctx.save();
            ctx.translate(star.x * scale, -star.y * scale);
            ctx.translate(0, Math.sin(time / 200) * 5); 
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    });

    // Joueur
    const currentX = gameState.current.x;
    const index = Math.floor(currentX * 10);
    
    if (points.length > 0 && currentX >= 0) {
        const point = points[index < points.length ? index : points.length - 1];
        const holes = currentLevel.holes || [];
        const inHole = holes.some(h => currentX > h.start && currentX < h.end);
        
        // Calcul Hauteur
        // Si point.realY est null (pas de fonction ici), la valeur est -infini
        const funcY = (point && point.realY !== null) ? point.realY : -1000;
        let effectiveY = funcY;
        
        // Physique Sol
        if (!inHole && effectiveY < 0) effectiveY = 0; // Le sol porte
        
        let angle = 0;
        if (point && index < points.length - 1) {
            const nextPoint = points[index+1];
            // Si on roule sur le sol plat
            if (!inHole && effectiveY === 0) angle = 0;
            else if (nextPoint && nextPoint.realY !== null && point.realY !== null) {
                const dy = -(nextPoint.realY - point.realY) * scale;
                const dx = (nextPoint.realX - point.realX) * scale;
                angle = Math.atan2(dy, dx);
            }
        }
        
        if (effectiveY > -20) {
            const px = currentX * scale; const py = effectiveY * -scale;
            ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
            const carSize = Math.max(scale, 40); ctx.translate(0, -carSize * 0.22 - 2); 
            ctx.fillStyle = '#facc15'; ctx.fillRect(-20, -10, 40, 20); 
            ctx.fillStyle = '#0ea5e9'; ctx.fillRect(0, -10, 15, 10); 
            ctx.fillStyle = '#333'; 
            ctx.beginPath(); ctx.arc(-15, 10, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(15, 10, 8, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
  };

  // =========================================================
  // 6. GAME LOOP
  // =========================================================
  const gameLoop = useCallback(() => {
    if (gameStatus !== 'playing' || !gameDataRef.current) {
        if (gameDataRef.current) drawCarFrame();
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    
    let moveAmount = 0;
    if (keysPressed.current['ArrowRight']) moveAmount = 0.3; 
    if (keysPressed.current['ArrowLeft']) moveAmount = -0.3;

    if (moveAmount !== 0) {
        let nextX = gameState.current.x + moveAmount;
        if (nextX < 0) nextX = 0;
        gameState.current.x = nextX;

        if (moveAmount > 0) {
            gameState.current.fuel -= 0.05;
            if (gameState.current.fuel <= 0) { setGameStatus('empty'); return; }
        }

        const points = gameDataRef.current.points;
        const index = Math.floor(nextX * 10);
        const point = points[index < points.length ? index : points.length - 1];
        
        // Physique
        const funcY = (point && point.realY !== null) ? point.realY : -1000;
        let groundY = 0;
        const holes = currentLevel.holes || [];
        const inHole = holes.some(h => nextX > h.start && nextX < h.end);
        if (inHole) groundY = -1000;

        const currentY = Math.max(groundY, funcY);

        if (currentY < -5) { setGameStatus('crashed'); return; }

        (currentLevel.obstacles || []).forEach(obs => {
            if (nextX >= obs.x && nextX <= obs.x + obs.width) {
                if (currentY < obs.y + obs.height) setGameStatus('crashed');
            }
        });
        if (gameStatus === 'crashed') return;

        (currentLevel.stars || []).forEach((star, idx) => {
            if (!gameState.current.stars.includes(idx)) {
                const dist = Math.sqrt(Math.pow(nextX - star.x, 2) + Math.pow(currentY - star.y, 2));
                if (dist < 2.5) {
                    gameState.current.stars.push(idx);
                    setUiStars(gameState.current.stars.length);
                }
            }
        });

        const dist = currentLevel?.distance || 20;
        if (nextX >= dist) {
             setCollectedStars(gameState.current.stars); 
             setGameStatus('won'); 
             unlockNextLevel(currentLevel.id);
             return;
        }
    }
    
    gameState.current.lastFrame++;
    if(gameState.current.lastFrame % 10 === 0) setUiFuel(gameState.current.fuel);

    drawCarFrame();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, currentLevel, unlockNextLevel]);

  // Listeners
  useEffect(() => {
    const handleKeyDown = (e) => { 
        if (e.target.tagName === 'INPUT') return; 
        keysPressed.current[e.key] = true; 
    };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);
  
  useEffect(() => {
    const handleResize = () => { if(segments) calculateData(segments); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [segments]);

  // Actions
  const updateSegment = (id, field, value) => {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const addSegment = () => {
      const last = segments[segments.length - 1];
      setSegments([...segments, { id: Date.now(), eq: "0", start: last ? last.end : 0, end: (last ? last.end : 0) + 20 }]);
  };
  const removeSegment = (id) => {
      if (segments.length > 1) setSegments(prev => prev.filter(s => s.id !== id));
  };
  
  const handleApply = () => {
      gameState.current.x = 0; gameState.current.fuel = 100; gameState.current.stars = [];
      setUiFuel(100); setUiStars(0); setGameStatus('playing'); setCollectedStars([]);
      calculateData(segments); 
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };
  const handleRetry = () => { handleApply(); };
  const handleNextLevel = () => {
    const currentIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
    const nextLevel = LEVELS[currentIndex + 1];
    if (nextLevel) setCurrentLevel(nextLevel); else { alert("Bravo ! Jeu terminé !"); onBack(); }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#0f172a' }}>
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
      <canvas ref={carCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }} />

      {/* HUD HAUT - Bouton Retour FIXÉ */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', padding: '20px', paddingRight: '60px', display: 'flex', justifyContent: 'space-between', zIndex: 5000, pointerEvents: 'none' }}>
          <button 
            onClick={onBack} 
            className="pointer-events-auto p-3 bg-slate-800 rounded-full border border-slate-600 hover:border-cyan-400 text-white shadow-xl hover:scale-110 transition-transform"
            style={{ pointerEvents: 'all' }} // Sécurité double
          >
            <ArrowLeft size={24}/>
          </button>
          <div className="flex gap-4 pointer-events-auto">
            <div className="bg-slate-800 px-3 py-1 rounded border border-yellow-600 flex items-center gap-2">
                <Star size={16} fill="gold" className="text-yellow-400" />
                <span className="font-bold text-white">{uiStars} / {(currentLevel.stars || []).length}</span>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-600 flex flex-col items-center w-24">
                 <div className="flex items-center gap-1 text-[10px] uppercase text-slate-400"><Zap size={10} /> Fuel</div>
                 <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1"><div style={{width: `${uiFuel}%`}} className={`h-full rounded-full transition-all duration-300 ${uiFuel<20?'bg-red-500':'bg-yellow-400'}`} /></div>
            </div>
          </div>
      </div>

      {/* INTERFACE BASSE */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '180px', backgroundColor: '#0f172a', borderTop: '2px solid #334155', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Équations</h3>
              <button onClick={addSegment} className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-cyan-400 rounded hover:bg-slate-700 text-xs font-bold"><Plus size={14}/> AJOUTER</button>
          </div>
          <div style={{ flex: 1, overflowX: 'auto', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '15px' }}>
              {segments.map((seg, idx) => (
                  <div key={seg.id} style={{ minWidth: '260px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div className="flex items-center gap-2 mb-2">
                          <span className="text-slate-500 font-mono text-xs">{idx+1}.</span>
                          <span className="text-cyan-400 font-serif italic font-bold">f(x)=</span>
                          <input type="text" value={seg.eq} onChange={(e) => updateSegment(seg.id, 'eq', e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 w-full font-mono text-sm focus:border-cyan-400 outline-none" placeholder="0" />
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <span className="text-xs text-yellow-500 font-bold uppercase">Sur</span>
                          <span className="font-mono text-lg">[</span>
                          <input type="number" value={seg.start} onChange={(e) => updateSegment(seg.id, 'start', parseFloat(e.target.value))} className="bg-slate-900 border border-slate-700 text-white rounded px-1 w-12 text-center text-xs" />
                          <span className="font-mono text-lg">;</span>
                          <input type="number" value={seg.end} onChange={(e) => updateSegment(seg.id, 'end', parseFloat(e.target.value))} className="bg-slate-900 border border-slate-700 text-white rounded px-1 w-12 text-center text-xs" />
                          <span className="font-mono text-lg">]</span>
                          {segments.length > 1 && <button onClick={() => removeSegment(seg.id)} className="ml-auto text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>}
                      </div>
                  </div>
              ))}
              <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleApply} className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg flex flex-col items-center justify-center text-white font-bold hover:scale-105 active:scale-95 border-2 border-slate-800"><Play size={20} fill="currentColor" className="ml-1"/><span className="text-[9px]">GO</span></button>
              </div>
          </div>
      </div>

      {/* POPUPS */}
      {gameStatus === 'won' && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}><div className="bg-slate-900 border-2 border-green-500 p-8 rounded-3xl text-center shadow-2xl"><Trophy size={64} className="text-green-400 mx-auto mb-4" /><h2 className="text-3xl font-black text-white italic mb-2">VICTOIRE !</h2><div className="flex justify-center gap-1 mb-6">{[...Array(3)].map((_, i) => <Star key={i} size={24} fill={i < collectedStars.length ? "gold" : "#334155"} className={i < collectedStars.length ? "text-yellow-400" : "text-slate-700"} />)}</div><button onClick={handleNextLevel} className="mt-4 px-8 py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl">NIVEAU SUIVANT</button></div></div>}
      {(gameStatus === 'crashed' || gameStatus === 'empty' || gameStatus === 'lost') && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}><div className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl text-center shadow-2xl"><AlertTriangle size={64} className="text-red-500 mx-auto mb-4" /><h2 className="text-3xl font-black text-white italic mb-2">PERDU !</h2><button onClick={handleRetry} className="mt-4 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">RÉESSAYER</button></div></div>}
      {error && <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translate(-50%)', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '10px', zIndex: 2000, fontWeight: 'bold' }}>{error}</div>}
    </div>
  );
};

export default Game;