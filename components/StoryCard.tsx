'use client';

import { forwardRef } from 'react';

interface StoryCardProps {
  wins: number;
  losses: number;
  rank: string;
  username: string;
  avatarUrl?: string;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(({ wins, losses, rank, username, avatarUrl }, ref) => {
  return (
    <div className="absolute -left-[9999px] top-0">
      <div 
        ref={ref} 
        className="w-[360px] h-[640px] bg-[#070507] text-white p-6 flex flex-col justify-between relative overflow-hidden border-4 border-amber-500 rounded-3xl shadow-2xl"
        style={{ backgroundImage: 'radial-gradient(circle, #171310 0%, #070507 100%)' }}
      >
        <div className="text-center space-y-1 z-10 pt-4">
          <h1 className="text-3xl font-black italic tracking-wider text-amber-400 drop-shadow-lg">WL TRACKER</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Resumo Oficial da Semana</p>
        </div>

        <div className="flex flex-col items-center space-y-3 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-40 animate-pulse"></div>
            <img 
              src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
              className="w-24 h-24 rounded-full border-2 border-amber-400 object-cover bg-zinc-800 relative z-10" 
              crossOrigin="anonymous"
            />
          </div>
          <h2 className="text-lg font-black text-white">@{username || 'Jogador'}</h2>
          
          <div className="mt-2 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(217,119,6,0.5)]">
            {rank || 'RANK FINAL'}
          </div>
        </div>

        <div className="bg-[#120f0d]/90 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2 backdrop-blur-md z-10">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Minha Campanha</p>
          <div className="flex justify-center items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="block text-5xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{wins}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Vitórias</span>
            </div>
            <span className="text-3xl font-black text-zinc-600">-</span>
            <div className="flex flex-col items-center">
              <span className="block text-5xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{losses}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Derrotas</span>
            </div>
          </div>
        </div>

        <div className="text-center z-10 pb-2">
          <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest border-t border-amber-500/20 pt-4">
            Crie o seu card no nosso app! ⚽
          </p>
        </div>

      </div>
    </div>
  );
});

StoryCard.displayName = 'StoryCard';