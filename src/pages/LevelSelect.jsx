import React from 'react';
import { LEVELS } from '../data/levels';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Play, Lock, CheckCircle } from 'lucide-react';

const LevelSelect = ({ onBack, onPlayLevel }) => {
  const { maxUnlockedLevel } = useGame();

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="flex-none p-6 flex items-center bg-slate-900 border-b border-slate-800 z-10 shadow-md">
        <button onClick={onBack} className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-6 text-3xl font-black text-white uppercase italic tracking-tighter">
          SÉLECTION <span className="text-cyan-400">NIVEAU</span>
        </h1>
      </div>

      {/* ZONE DE DÉFILEMENT HORIZONTAL (FORCÉE) */}
      <div 
        className="flex-grow w-full bg-slate-950 overflow-x-auto overflow-y-hidden p-8 scrollbar-thin scrollbar-thumb-cyan-900"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem' }}
      >
        
        {LEVELS.map((level) => {
          const isLocked = level.id > maxUnlockedLevel;
          
          return (
            <div 
              key={level.id}
              // min-width est CRUCIAL ici pour empêcher l'écrasement
              style={{ minWidth: '400px' }}
              className={`
                h-[500px] relative rounded-3xl p-8 border-2 flex flex-col justify-between transition-all duration-300 snap-center
                ${isLocked 
                  ? 'bg-slate-900/40 border-slate-800 opacity-50 grayscale' 
                  : 'bg-slate-900 border-cyan-500/30 hover:border-cyan-400 hover:scale-105 hover:shadow-[0_0_50px_rgba(34,211,238,0.15)]'
                }
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1 rounded-full bg-slate-950 text-cyan-400 text-xs font-bold tracking-widest border border-cyan-900/50">
                    NIVEAU {level.id}
                  </span>
                  {level.id < maxUnlockedLevel && <CheckCircle className="text-green-500" size={28} />}
                  {isLocked && <Lock className="text-slate-600" size={28} />}
                </div>

                <h3 className="text-4xl font-black text-white mb-3 italic tracking-tight">
                  {level.title}
                </h3>
                
                <p className="text-slate-400 text-base leading-relaxed h-24 overflow-hidden">
                  {level.description}
                </p>

                {/* Stats */}
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 grid grid-cols-2 gap-4">
                   <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distance</div>
                      <div className="text-2xl font-mono font-bold text-white">{level.distance}m</div>
                   </div>
                   <div className="text-center border-l border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Danger</div>
                      <div className="text-2xl font-mono font-bold text-red-400">{level.obstacles?.length || 0}</div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => !isLocked && onPlayLevel(level)}
                disabled={isLocked}
                className={`
                  w-full py-5 font-bold rounded-xl flex items-center justify-center gap-3 transition-all text-lg
                  ${isLocked 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-900/20'
                  }
                `}
              >
                {isLocked ? 'VERROUILLÉ' : <><Play size={24} fill="currentColor" /> DÉMARRER</>}
              </button>
            </div>
          );
        })}

        {/* Espace vide fin */}
        <div style={{ minWidth: '50px' }}></div>
      </div>
    </div>
  );
};

export default LevelSelect;