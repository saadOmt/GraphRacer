import React from 'react';
import { useGame } from '../context/GameContext'; // On se connecte au cerveau
import { Star, Lock, Play } from 'lucide-react';

const LevelSelect = ({ onBack, onPlayLevel }) => {
  const { allLevels, progress } = useGame(); // On récupère les données

  return (
    <div className="min-h-screen bg-slate-950 p-10 font-mono">
      {/* En-tête */}
      <button onClick={onBack} className="text-slate-500 hover:text-cyan-400 mb-8 transition-colors">
        ← RETOUR ACCUEIL
      </button>
      <h2 className="text-4xl text-white font-bold mb-2 border-b border-cyan-900 pb-4">
        SÉLECTION DU PROJET
      </h2>

      {/* Grille des niveaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {allLevels.map((level) => (
          <div key={level.id} className="bg-slate-900 border border-cyan-800 p-6 rounded hover:border-cyan-400 group transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl font-black text-slate-700 group-hover:text-cyan-900 transition-colors">
                0{level.id}
              </span>
              {/* Étoiles gagnées */}
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < progress[level.id] ? "fill-yellow-400 text-yellow-400" : "text-slate-700"} 
                  />
                ))}
              </div>
            </div>

            <h3 className="text-xl text-white font-bold mb-1">{level.name}</h3>
            <p className="text-sm text-slate-400 mb-6">{level.desc}</p>

            <button 
              onClick={() => onPlayLevel(level)}
              className="w-full py-3 bg-cyan-900/30 text-cyan-400 border border-cyan-700 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 transition-all flex justify-center items-center gap-2 font-bold"
            >
              <Play size={16} /> CHARGER LE PROJET
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelSelect;