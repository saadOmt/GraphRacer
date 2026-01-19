import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { generateCurve } from '../engine/MathParser';
import { ArrowLeft, RefreshCw, Play, Square } from 'lucide-react';

const Game = ({ onBack }) => {
  const { currentLevel } = useGame();
  
  // --- ÉTATS ---
  const [equation, setEquation] = useState(currentLevel?.suggested || "sin(x)");
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerX, setPlayerX] = useState(0);

  // --- REFS ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  
  // Données calculées
  const [curveData, setCurveData] = useState(null);

  // =========================================================
  // 1. CALCUL MATHÉMATIQUE & ZOOM INTELLIGENT
  // =========================================================
  const calculateData = useCallback(() => {
    if (!containerRef.current) return;

    const distance = (currentLevel && currentLevel.distance) ? currentLevel.distance : 20;
    
    // Génération des points
    const { points, error: calcError } = generateCurve(equation, distance);

    if (calcError) {
      setError(calcError);
      setCurveData(null);
      return;
    }
    setError(null);

    // --- LOGIQUE DE ZOOM ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // A. Trouver les extrêmes
    let minY = 0; 
    let maxY = 0;
    
    if (points.length > 0) {
      points.forEach(p => {
        if (p.realY < minY) minY = p.realY;
        if (p.realY > maxY) maxY = p.realY;
      });
    }

    // B. Zoom Hauteur
    const verticalSpan = (maxY - minY); 
    const effectiveHeight = verticalSpan < 2 ? 4 : verticalSpan; 
    const scaleY = (height * 0.6) / effectiveHeight;

    // C. Zoom Largeur
    const scaleX = (width * 0.9) / distance;

    // D. Zoom Final (Min/Max clamp)
    let scale = Math.min(scaleY, scaleX);
    scale = Math.min(Math.max(scale, 2), 100); 

    // E. Centrage
    const midCurveY = (minY + maxY) / 2;
    const originY = (height / 2) + (midCurveY * scale);

    setCurveData({ points, scale, originY });

  }, [equation, currentLevel]);


  // =========================================================
  // 2. DESSIN
  // =========================================================
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !curveData) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const { points, scale, originY } = curveData;

    // Fond
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const originX = 50;
    
    ctx.save();
    ctx.translate(originX, originY);

    // Grille Adaptative
    let step = 1;
    if (scale < 20) step = 5;
    if (scale < 5) step = 10;

    const metersVisibleX = Math.ceil((width - originX) / scale);

    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // Verticales
    for (let i = 0; i <= metersVisibleX; i += step) {
      const x = i * scale;
      
      ctx.beginPath(); 
      ctx.moveTo(x, -originY); 
      ctx.lineTo(x, height - originY);
      
      if (i % 5 === 0) {
          ctx.strokeStyle = '#334155';
      } else {
          ctx.strokeStyle = '#1e293b';
      }
      ctx.stroke();
      
      // Chiffres
      if (i % (step * (scale < 10 ? 2 : 5)) === 0 || i === 0) {
        ctx.fillStyle = '#64748b'; 
        if(i % 5 === 0) ctx.fillText(i, x, (height - originY) - 15);
      }
    }

    // Sol
    ctx.beginPath(); ctx.moveTo(-originX, 0); ctx.lineTo(width, 0);
    ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2; ctx.stroke();

    // Courbe
    if (points.length > 0) {
      ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].realX * scale, points[0].realY * -scale);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].realX * scale, points[i].realY * -scale);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Drapeau
      const finishX = ((currentLevel && currentLevel.distance) ? currentLevel.distance : 20) * scale;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(finishX, -40, 4, 40);
      ctx.beginPath(); ctx.moveTo(finishX, -40); ctx.lineTo(finishX + 25, -30); ctx.lineTo(finishX, -20); ctx.fill();
    }

    // Joueur
    if (points.length > 0 && playerX > 0) {
        const index = Math.floor(playerX * 10); 
        const point = points[index < points.length ? index : points.length - 1];
        
        if (point) {
            const px = point.realX * scale;
            const py = point.realY * -scale;

            ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore();
  }, [curveData, playerX, currentLevel]);


  // =========================================================
  // 3. LOGIQUE & ANIMATION
  // =========================================================
  
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
            calculateData(); 
        }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 10);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateData]);

  const animate = useCallback(() => {
    if (!isPlaying) return;

    setPlayerX(prev => {
        const nextX = prev + 0.15;
        const dist = (currentLevel && currentLevel.distance) ? currentLevel.distance : 20;
        if (nextX > dist + 5) {
            setIsPlaying(false);
            return 0;
        }
        return nextX;
    });
    
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, currentLevel]);

  useEffect(() => {
    if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleTraceClick = () => {
    setPlayerX(0);
    setIsPlaying(false);
    calculateData();
  };

  const handlePlayClick = () => {
    if (isPlaying) {
        setIsPlaying(false);
        setPlayerX(0);
    } else {
        if (!curveData) calculateData();
        setPlayerX(0);
        setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 overflow-hidden text-white font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER */}
      <div className="flex-none h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 z-20 backdrop-blur-md">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
           <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Objectif</span>
           <span className="text-2xl font-black text-white drop-shadow-lg">
             {(currentLevel && currentLevel.distance) ? currentLevel.distance : 20}m
           </span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* ZONE GRAPHIQUE */}
      <div ref={containerRef} className="flex-grow relative z-0 cursor-crosshair">
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {error && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500 text-red-200 px-6 py-3 rounded-lg backdrop-blur-md font-mono text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <span>⚠️</span> {error}
            </div>
        )}
      </div>

      {/* ZONE DE CONTRÔLE */}
      <div className="flex-none bg-slate-900 border-t border-cyan-900/50 p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-stretch">
            
            <div className="flex-1 flex items-center bg-slate-950 rounded-lg border border-slate-700 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all px-4 py-3 group">
              <span className="text-slate-500 font-serif italic text-xl mr-3 group-focus-within:text-cyan-400 transition-colors">f(x) =</span>
              <input 
                type="text" 
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTraceClick()}
                className="flex-1 bg-transparent border-none outline-none text-white text-xl font-mono tracking-wide placeholder-slate-700"
                placeholder="Ex: 0.5 * x"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleTraceClick}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg border border-slate-700 hover:border-cyan-400 transition-all flex items-center gap-2 active:scale-95"
                title="Redessiner"
              >
                <RefreshCw size={20} className={!curveData ? "animate-spin" : ""} />
              </button>

              <button 
                onClick={handlePlayClick}
                className={`px-8 py-3 font-black rounded-lg border transition-all flex items-center gap-2 min-w-[140px] justify-center active:scale-95 shadow-lg ${
                    isPlaying 
                    ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" 
                    : "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-cyan-900/20"
                }`}
              >
                {isPlaying ? (
                    <> <Square size={20} fill="currentColor" /> STOP </>
                ) : (
                    <> <Play size={20} fill="currentColor" /> LANCER </>
                )}
              </button>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Game;