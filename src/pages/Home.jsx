import React from 'react';
import { ArrowRight } from 'lucide-react';

const Home = ({ onStart }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Effet de grille en fond */}
      <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="border-r border-cyan-500 h-full"></div>
        ))}
      </div>

      {/* Contenu Principal */}
      <div className="z-10 text-center space-y-8 animate-fade-in-up">
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          GRAPH<span className="text-slate-100">RACER</span>
        </h1>
        <p className="text-xl text-cyan-200 font-mono tracking-widest">ENGINEER EDITION v1.0</p>
        
        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-slate-900 border-2 border-cyan-500 text-cyan-400 font-bold font-mono text-xl hover:bg-cyan-500/10 hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-3">
            COMMENCER <ArrowRight />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Home;