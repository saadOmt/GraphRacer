import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Zap, Star, Plus, Trash2, Play, Trophy, AlertTriangle, Lightbulb, Calculator, X } from 'lucide-react';
import { LEVELS } from '../data/levels';

// =========================================================
// 1. FONCTIONS UTILITAIRES & MATHS
// =========================================================

const evaluateFunction = (eqStr, xVal) => {
    try {
        let safe = eqStr.toLowerCase().trim();
        if(!safe) return 0;
        
        safe = safe.replace(/\s+/g, '')
           .replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan')
           .replace(/abs/g, 'Math.abs').replace(/sqrt/g, 'Math.sqrt').replace(/pi/g, 'Math.PI')
           .replace(/\^/g, '**');
           
        safe = safe.replace(/(\d)([a-z(])/g, '$1*$2').replace(/([a-z)])(\d)/g, '$1*$2');
        
        // eslint-disable-next-line no-new-func
        const f = new Function('x', `return ${safe}`);
        const res = f(xVal);
        return (isFinite(res) && !isNaN(res)) ? res : 0;
    } catch (e) { return 0; }
};

// =========================================================
// 2. SYNTHÉTISEUR SONORE (AUDIO)
// =========================================================

const getAudioContext = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
};

const playWinSound = () => {
    const ctx = getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.start(now + i * 0.1); osc.stop(now + 0.6 + i * 0.1);
    });
};

const playStarSound = () => {
    const ctx = getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
};

const playCrashSound = () => {
    const ctx = getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
};

// =========================================================
// 3. COMPOSANT PRINCIPAL
// =========================================================

const Game = ({ onBack }) => {
  const { currentLevel, setCurrentLevel, unlockNextLevel, carColor, lineColor, bgColor, showGrid } = useGame();
  
  // --- ÉTATS ---
  const [segments, setSegments] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); 
  const [uiFuel, setUiFuel] = useState(100);
  const [uiStars, setUiStars] = useState(0);
  const [collectedStars, setCollectedStars] = useState([]);
  const [showMemo, setShowMemo] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // --- REFS (MOTEUR) ---
  // Ajout de 'particles' dans le state du moteur
  const gameState = useRef({ x: 0, fuel: 100, stars: [], particles: [], lastFrame: 0 });
  const autoDrive = useRef(false);
  const bgCanvasRef = useRef(null);
  const carCanvasRef = useRef(null);
  const keysPressed = useRef({});
  const requestRef = useRef();
  const gameDataRef = useRef(null);

  useEffect(() => { if (gameStatus === 'won') playWinSound(); }, [gameStatus]);

  // =========================================================
  // CALCUL TERRAIN
  // =========================================================
  const calculateTerrain = useCallback(() => {
    if (!currentLevel) return;
    const width = window.innerWidth; const height = window.innerHeight; const gameHeight = height - 180; const distance = currentLevel.distance;
    const maxDist = Math.max(100, distance + 20); const step = 0.1; let points = []; const memo = {}; 

    const getWorldY = (targetX) => {
        const memoKey = Math.round(targetX * 10);
        if (memo[memoKey] !== undefined) return memo[memoKey];
        if (targetX <= 0) return 0;
        const activeSeg = [...segments].reverse().find(s => targetX >= s.start && targetX < s.end);
        if (!activeSeg) return null; 
        let startHeight = 0;
        if (activeSeg.start > 0) {
            const prevY = getWorldY(activeSeg.start - 0.01); startHeight = prevY === null ? 0 : prevY;
        }
        const localX = targetX - activeSeg.start; const localY = evaluateFunction(activeSeg.eq, localX); const finalY = startHeight + localY;
        memo[memoKey] = finalY; return finalY;
    };

    for (let x = 0; x <= maxDist; x += step) {
        const y = getWorldY(x); const activeSeg = [...segments].reverse().find(s => x >= s.start && x < s.end);
        points.push({ realX: x, realY: y, segId: activeSeg ? activeSeg.id : null });
    }

    const scaleY = (gameHeight * 0.7) / 70; const scaleX = (width * 0.9) / distance; 
    let scale = Math.min(scaleY, scaleX); scale = Math.min(Math.max(scale, 15), 80); let originY = gameHeight * 0.85; 
    gameDataRef.current = { points, scale, originY, width, height: gameHeight };
  }, [segments, currentLevel]);

  // =========================================================
  // DESSIN FOND
  // =========================================================
  const drawBackground = useCallback(() => {
    if (!gameDataRef.current || !bgCanvasRef.current) return;
    const ctx = bgCanvasRef.current.getContext('2d');
    const { points, scale, originY, width, height } = gameDataRef.current;
    
    bgCanvasRef.current.width = width; bgCanvasRef.current.height = window.innerHeight;
    ctx.fillStyle = bgColor || '#020617'; ctx.fillRect(0, 0, width, height); 
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, height, width, window.innerHeight - height);

    ctx.save(); ctx.translate(50, originY);
    ctx.fillStyle = '#334155'; ctx.fillRect(-50 * scale, 0, (width / scale + 100) * scale, height); 
    
    (currentLevel.holes || []).forEach(hole => {
        ctx.fillStyle = bgColor || '#020617'; ctx.fillRect(hole.start * scale, 0, (hole.end - hole.start) * scale, height);
    });

    if (showGrid) {
        const metersX = Math.ceil((width - 50) / scale); ctx.lineWidth = 1; ctx.textAlign = 'center'; ctx.font = '10px monospace';
        for (let i = 0; i <= metersX; i += 5) {
          const x = i * scale; ctx.beginPath(); ctx.moveTo(x, -originY); ctx.lineTo(x, height);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
          if (i % 10 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(i + 'm', x, 20); }
        }
    }

    const finishX = (currentLevel?.distance || 20) * scale;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(finishX, -60, 4, 60); 
    ctx.beginPath(); ctx.moveTo(finishX, -60); ctx.lineTo(finishX + 30, -45); ctx.lineTo(finishX, -30); ctx.fill(); 

    ctx.fillStyle = '#ef4444'; 
    (currentLevel.obstacles || []).forEach(obs => { ctx.fillRect(obs.x * scale, -obs.y * scale - (obs.height * scale), obs.width * scale, obs.height * scale); });

    if (points.length > 0) {
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = lineColor || '#22d3ee'; ctx.beginPath();
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
    }
    ctx.restore();
  }, [currentLevel, lineColor, bgColor, showGrid]);

  // =========================================================
  // DESSIN VOITURE & PARTICULES
  // =========================================================
  const drawCarFrame = useCallback(() => {
    if (!gameDataRef.current || !carCanvasRef.current) return;
    const ctx = carCanvasRef.current.getContext('2d');
    const { points, scale, originY, width } = gameDataRef.current;
    
    if(carCanvasRef.current.width !== width) carCanvasRef.current.width = width;
    if(carCanvasRef.current.height !== window.innerHeight) carCanvasRef.current.height = window.innerHeight;

    ctx.clearRect(0, 0, width, window.innerHeight);
    ctx.save(); ctx.translate(50, originY);

    // DESSIN DES ÉTOILES
    const time = Date.now();
    (currentLevel.stars || []).forEach((star, index) => {
        if (!gameState.current.stars.includes(index)) {
            ctx.save();
            ctx.translate(star.x * scale, -star.y * scale); ctx.translate(0, Math.sin(time / 200) * 5); 
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill(); // Cœur brillant
            ctx.restore();
        }
    });

    // DESSIN DES PARTICULES (Fumée & Explosion)
    gameState.current.particles.forEach(p => {
        // Applique l'opacité (life) à la couleur
        ctx.fillStyle = p.color + p.life + ')';
        ctx.beginPath();
        ctx.arc(p.x * scale, -p.y * scale, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // DESSIN DU JOUEUR (Voiture Améliorée)
    const currentX = gameState.current.x;
    const index = Math.floor(currentX * 10);
    
    if (points.length > 0 && currentX >= 0) {
        const point = points[index < points.length ? index : points.length - 1];
        const holes = currentLevel.holes || [];
        const inHole = holes.some(h => currentX > h.start && currentX < h.end);
        
        const funcY = (point && point.realY !== null) ? point.realY : -1000;
        let effectiveY = funcY; if (!inHole && effectiveY < 0) effectiveY = 0; 
        
        let angle = 0;
        if (point && index < points.length - 1) {
            const nextPoint = points[index+1];
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
            
            // --- VOITURE STYLISÉE ---
            // Réacteur (Flamme)
            if (autoDrive.current && gameStatus === 'playing') {
                ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(-22, -5, 4 + Math.random()*2, 0, Math.PI*2); ctx.fill();
            }
            
            // Châssis principal (Arrondi)
            ctx.fillStyle = carColor || '#facc15'; 
            ctx.beginPath();
            ctx.roundRect(-20, -12, 40, 12, 4); // x, y, width, height, radius
            ctx.fill();
            
            // Cockpit (Vitre bleue)
            ctx.fillStyle = '#0ea5e9'; 
            ctx.beginPath(); ctx.roundRect(-5, -22, 20, 10, [8, 8, 0, 0]); ctx.fill();
            
            // Reflet sur la vitre
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(8, -18, 3, 0, Math.PI*2); ctx.fill();

            // Roues
            ctx.fillStyle = '#1e293b'; 
            ctx.beginPath(); ctx.arc(-12, 4, 8, 0, Math.PI*2); ctx.fill(); // Roue Arrière
            ctx.beginPath(); ctx.arc(12, 4, 8, 0, Math.PI*2); ctx.fill();  // Roue Avant
            
            // Jantes
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(-12, 4, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(12, 4, 3, 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }
    }
    ctx.restore();
  }, [currentLevel, carColor, collectedStars, gameStatus]);

  // =========================================================
  // BOUCLE DE JEU (PHYSIQUE & PARTICULES)
  // =========================================================
  const gameLoop = useCallback(() => {
    
    // Mise à jour des particules (Elles bougent même quand le jeu est en pause/crash)
    gameState.current.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.size *= 0.98; // Les particules rétrécissent
    });
    // Nettoyage des particules mortes
    gameState.current.particles = gameState.current.particles.filter(p => p.life > 0);

    if (gameStatus !== 'playing') {
        if (gameDataRef.current) drawCarFrame();
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    
    let moveAmount = 0;
    if (autoDrive.current || keysPressed.current['ArrowRight']) { moveAmount = 0.3; }
    if (keysPressed.current['ArrowLeft']) moveAmount = -0.3;

    if (moveAmount !== 0 && gameDataRef.current) {
        let nextX = gameState.current.x + moveAmount;
        if (nextX < 0) nextX = 0;
        gameState.current.x = nextX;

        // Consommation et Fumée
        if (moveAmount > 0) {
            gameState.current.fuel -= 0.15; 
            
            // Génération de fumée aléatoire
            if (Math.random() > 0.4) {
                gameState.current.particles.push({
                    x: nextX - 1, // Derrière la voiture
                    y: (gameDataRef.current.points[Math.floor(nextX*10)]?.realY || 0) + 0.5,
                    vx: -0.1 + (Math.random() * 0.05), // Recule un peu
                    vy: (Math.random() - 0.5) * 0.1,   // Monte/Descend un peu
                    life: 1, decay: 0.05,
                    color: 'rgba(200, 200, 200, ', // Gris
                    size: 2 + Math.random() * 3
                });
            }

            if (gameState.current.fuel <= 0) { autoDrive.current = false; setGameStatus('empty'); return; }
        }

        const holes = currentLevel.holes || [];
        const inHole = holes.some(h => nextX > h.start && nextX < h.end);
        const points = gameDataRef.current.points;
        const index = Math.floor(nextX * 10);
        const point = points[index < points.length ? index : points.length - 1];
        const funcY = (point && point.realY !== null) ? point.realY : -1000;

        let currentY = funcY;
        if (!inHole && funcY < 0) currentY = 0; 

        // GESTION DU CRASH
        let crashed = false;
        if (currentY < -5) crashed = true; // Tombe dans un trou
        
        // Check Obstacles
        (currentLevel.obstacles || []).forEach(obs => {
            if (nextX >= obs.x && nextX <= obs.x + obs.width && currentY < obs.y + obs.height) {
                crashed = true;
            }
        });

        if (crashed) { 
            autoDrive.current = false; 
            setGameStatus('crashed'); 
            playCrashSound(); // BOUM !
            
            // Explosion de particules rouges/oranges
            for(let i=0; i<30; i++) {
                gameState.current.particles.push({
                    x: nextX, y: currentY,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5 + 0.5, // Gicle vers le haut
                    life: 1, decay: 0.02 + Math.random() * 0.03,
                    color: Math.random() > 0.5 ? 'rgba(239, 68, 68, ' : 'rgba(245, 158, 11, ', 
                    size: 3 + Math.random() * 6
                });
            }
            return; 
        }

        const dist = currentLevel?.distance || 20;
        if (nextX >= dist) {
             autoDrive.current = false; 
             setCollectedStars(gameState.current.stars); 
             setGameStatus('won'); 
             unlockNextLevel(currentLevel.id);
             return;
        }

        // GESTION DES ÉTOILES
        (currentLevel.stars || []).forEach((star, idx) => {
            if (!gameState.current.stars.includes(idx)) {
                const distStar = Math.sqrt(Math.pow(nextX - star.x, 2) + Math.pow(currentY - star.y, 2));
                if (distStar < 2.5) {
                    gameState.current.stars.push(idx);
                    setUiStars(gameState.current.stars.length);
                    setCollectedStars([...gameState.current.stars]); 
                    playStarSound(); // DING !
                    
                    // Petite explosion d'étoile (Jaune)
                    for(let i=0; i<10; i++) {
                        gameState.current.particles.push({
                            x: star.x, y: star.y,
                            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                            life: 1, decay: 0.05, color: 'rgba(250, 204, 21, ', size: 2
                        });
                    }
                }
            }
        });
    }
    gameState.current.lastFrame++;
    if(gameState.current.lastFrame % 10 === 0) setUiFuel(gameState.current.fuel);
    drawCarFrame();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, currentLevel, unlockNextLevel, drawCarFrame]);

  // =========================================================
  // LISTENERS ET INIT
  // =========================================================
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.target.tagName !== 'INPUT') keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); cancelAnimationFrame(requestRef.current); };
  }, [gameLoop]);

  useEffect(() => {
      setSegments([]); setGameStatus('playing'); setUiFuel(100); setUiStars(0); setCollectedStars([]);
      gameState.current = { x: 0, fuel: 100, stars: [], particles: [], lastFrame: 0 };
      autoDrive.current = false;
      if (gameDataRef.current) { gameDataRef.current.points = []; drawBackground(); drawCarFrame(); }
      setTimeout(() => { calculateTerrain(); }, 50);
  }, [currentLevel]);

  useEffect(() => {
      calculateTerrain();
      setTimeout(() => { if (gameDataRef.current) { drawBackground(); drawCarFrame(); } }, 50);
  }, [calculateTerrain, drawBackground, drawCarFrame]);

  const updateSegment = (id, field, value) => setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addSegment = () => { const start = segments.length > 0 ? segments[segments.length - 1].end : 0; setSegments([...segments, { id: Date.now(), eq: "0", start: start, end: start + 20 }]); };
  const addPresetFunction = (equation) => { const start = segments.length > 0 ? segments[segments.length - 1].end : 0; setSegments([...segments, { id: Date.now(), eq: equation, start: start, end: start + 20 }]); setShowTools(false); };
  const removeSegment = (id) => { if (segments.length > 0) setSegments(prev => prev.filter(s => s.id !== id)); };
  
  const handleApply = () => {
      gameState.current.x = 0; gameState.current.fuel = 100; gameState.current.stars = []; gameState.current.particles = [];
      setUiFuel(100); setUiStars(0); setGameStatus('playing'); setCollectedStars([]);
      calculateTerrain(); autoDrive.current = true;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const handleRetry = () => {
      gameState.current.x = 0; gameState.current.fuel = 100; gameState.current.stars = []; gameState.current.particles = [];
      setUiFuel(100); setUiStars(0); setGameStatus('playing'); setCollectedStars([]);
      calculateTerrain(); autoDrive.current = false; 
  };
  
  const handleNextLevel = () => {
    setGameStatus('playing'); gameState.current.x = 0; gameState.current.fuel = 100; gameState.current.stars = []; gameState.current.particles = [];
    setUiFuel(100); setUiStars(0); setCollectedStars([]); autoDrive.current = false;
    if (gameDataRef.current) gameDataRef.current.points = [];
    const currentIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
    const nextLevel = LEVELS[currentIndex + 1];
    if (nextLevel) setCurrentLevel(nextLevel); else { alert("Bravo ! Jeu terminé !"); onBack(); }
  };

  // =========================================================
  // RENDU (JSX)
  // =========================================================
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: bgColor || '#0f172a', fontFamily: 'monospace' }}>
      
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
      <canvas ref={carCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }} />

      {/* HUD HAUT */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', padding: '20px', paddingRight: '250px', display: 'flex', justifyContent: 'space-between', zIndex: 50, pointerEvents: 'none', boxSizing: 'border-box' }}>
          <button onClick={onBack} style={{ pointerEvents: 'all', background: '#1e293b', border: '1px solid #475569', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><ArrowLeft size={24}/></button>
          
          <div style={{ display: 'flex', gap: '20px', pointerEvents: 'all' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={24} fill="gold" color="#facc15" />
                    <span style={{ fontWeight: 'bold', color: 'white', fontSize: '1.4rem' }}>{uiStars} / 2</span>
                </div>
                <div style={{ fontSize: '10px', color: '#fef08a', marginTop: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Objectif Fuel: &gt;{currentLevel.fuelObjective}%</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '1px solid #475569', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}><Zap size={12} /> Carburant</div>
                 <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '6px', overflow: 'hidden' }}><div style={{ width: `${uiFuel}%`, height: '100%', background: uiFuel < 30 ? '#ef4444' : '#facc15', transition: 'width 0.3s' }} /></div>
                 <div style={{ width: '100%', textAlign: 'right', fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>{Math.round(uiFuel)}%</div>
            </div>
          </div>
      </div>

      {/* INTERFACE BASSE */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '180px', backgroundColor: '#0f172a', borderTop: '2px solid #334155', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowMemo(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#3b82f6', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <Lightbulb size={16}/> AIDE
                  </button>
                  <button onClick={() => setShowTools(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#64748b', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <Calculator size={16}/> OUTILS
                  </button>
              </div>
              <button onClick={addSegment} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#1e293b', color: '#22d3ee', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}><Plus size={14}/> AJOUTER</button>
          </div>

          <div style={{ flex: 1, overflowX: 'auto', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '15px' }}>
              {segments.map((seg, idx) => (
                  <div key={seg.id} style={{ minWidth: '260px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>{idx+1}.</span>
                          <span style={{ color: '#22d3ee', fontStyle: 'italic', fontWeight: 'bold' }}>f(x)=</span>
                          <input type="text" value={seg.eq} onChange={(e) => updateSegment(seg.id, 'eq', e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px', padding: '4px 8px', width: '100%', fontFamily: 'monospace' }} placeholder="0" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#cbd5e1' }}>
                          <span style={{ color: '#eab308', fontWeight: 'bold' }}>Sur</span>
                          <span>[</span>
                          <input type="number" value={seg.start} onChange={(e) => updateSegment(seg.id, 'start', parseFloat(e.target.value))} style={{ background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px', padding: '2px', width: '40px', textAlign: 'center' }} />
                          <span>;</span>
                          <input type="number" value={seg.end} onChange={(e) => updateSegment(seg.id, 'end', parseFloat(e.target.value))} style={{ background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px', padding: '2px', width: '40px', textAlign: 'center' }} />
                          <span>]</span>
                          {segments.length > 0 && <button onClick={() => removeSegment(seg.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Trash2 size={14}/></button>}
                      </div>
                  </div>
              ))}
              <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleApply} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(to right, #0891b2, #2563eb)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><Play size={20} fill="currentColor" /><span style={{ fontSize: '9px' }}>GO</span></button>
              </div>
          </div>
      </div>

      {/* POPUP AIDE (MEMO) */}
      {showMemo && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '90%', border: '1px solid #3b82f6', position: 'relative', color: 'white' }}>
                <button onClick={() => setShowMemo(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#3b82f6' }}><Lightbulb /> MEMO NIVEAU {currentLevel.id}</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: '#cbd5e1' }}>{currentLevel.memo || "Pas de conseil disponible."}</div>
            </div>
        </div>
      )}

      {/* POPUP OUTILS */}
      {showTools && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', maxWidth: '600px', width: '90%', border: '1px solid #64748b', position: 'relative', color: 'white' }}>
                <button onClick={() => setShowTools(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#94a3b8' }}><Calculator /> FONCTIONS UTILES</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {[
                        { label: 'Linéaire', code: '0.5 * x', desc: 'Ligne droite' }, { label: 'Parabole', code: '0.1 * x^2', desc: 'Courbe en U' },
                        { label: 'Racine', code: 'sqrt(x)', desc: 'Courbe douce' }, { label: 'Sinus', code: '2 * sin(x/2)', desc: 'Vagues' },
                        { label: 'Cosinus', code: '2 * cos(x/2)', desc: 'Vagues décalées' }, { label: 'Absolue', code: 'abs(x)', desc: 'Forme en V' }
                    ].map(f => (
                        <button key={f.label} onClick={() => addPresetFunction(f.code)} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#22d3ee'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}>
                            <div style={{ fontWeight: 'bold', color: '#22d3ee', display: 'flex', justifyContent: 'space-between' }}>{f.label} <Plus size={16}/></div>
                            <div style={{ fontFamily: 'monospace', background: '#000', padding: '4px', borderRadius: '4px', margin: '5px 0', fontSize: '12px', color: 'white' }}>{f.code}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{f.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* POPUPS VICTOIRE / DEFAITE */}
      {gameStatus === 'won' && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}><div style={{ background: '#0f172a', border: '2px solid #22c55e', padding: '30px', borderRadius: '20px', textAlign: 'center', color: 'white' }}><Trophy size={64} style={{ margin: '0 auto 15px', color: '#4ade80' }} /><h2>VICTOIRE !</h2><div style={{ display: 'flex', justifyContent: 'center', gap: '5px', margin: '15px 0' }}>{[...Array(3)].map((_, i) => <Star key={i} size={24} fill={i < collectedStars.length || (i===2 && uiFuel > currentLevel.fuelObjective) ? "gold" : "#334155"} color={i < collectedStars.length || (i===2 && uiFuel > currentLevel.fuelObjective) ? "#facc15" : "#334155"} />)}</div><button onClick={handleNextLevel} style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>NIVEAU SUIVANT</button></div></div>}
      {(gameStatus === 'crashed' || gameStatus === 'empty') && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}><div style={{ background: '#0f172a', border: '2px solid #ef4444', padding: '30px', borderRadius: '20px', textAlign: 'center', color: 'white' }}><AlertTriangle size={64} style={{ margin: '0 auto 15px', color: '#ef4444' }} /><h2>{gameStatus === 'empty' ? 'PANNE SÈCHE !' : 'CRASH !'}</h2><button onClick={handleRetry} style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>RÉESSAYER</button></div></div>}
    </div>
  );
};

export default Game;