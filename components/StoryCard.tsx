'use client';

import { forwardRef } from 'react';

interface StoryCardProps {
  wins: number;
  losses: number;
  rank: string;
  username: string;
  avatarUrl?: string;
  topScorers?: { name: string; count: number }[];
  topAssisters?: { name: string; count: number }[];
  topMvp?: { name: string; count: number } | null;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  ({ wins, losses, rank, username, avatarUrl, topScorers = [], topAssisters = [], topMvp }, ref) => {
    return (
      <div className="absolute -left-[9999px] top-0">
        <div 
          ref={ref} 
          className="w-[360px] h-[640px] bg-[#070507] text-white p-5 flex flex-col justify-between relative overflow-hidden border-4 border-amber-500 rounded-3xl shadow-2xl"
          style={{ backgroundImage: 'radial-gradient(circle, #171310 0%, #070507 100%)' }}
        >
          {/* HEADER */}
          <div className="text-center space-y-0.5 z-10 pt-2">
            <h1 className="text-2xl font-black italic tracking-wider text-amber-400 drop-shadow-lg">WL TRACKER</h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Resumo Oficial da Semana</p>
          </div>

          {/* PERFIL & RANK */}
          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-40 animate-pulse"></div>
              <img 
                src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover bg-zinc-800 relative z-10" 
                crossOrigin="anonymous"
              />
            </div>
            <h2 className="text-sm font-black text-white">@{username || 'Jogador'}</h2>
            
            <div className="bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(217,119,6,0.5)]">
              {rank || 'RANK FINAL'}
            </div>
          </div>

          {/* RECORD (VITÓRIAS - DERROTAS) */}
          <div className="bg-[#120f0d]/90 border border-amber-500/40 rounded-xl p-3 text-center backdrop-blur-md z-10">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Minha Campanha</p>
            <div className="flex justify-center items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="block text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{wins}</span>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Vitórias</span>
              </div>
              <span className="text-2xl font-black text-zinc-600">-</span>
              <div className="flex flex-col items-center">
                <span className="block text-3xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{losses}</span>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Derrotas</span>
              </div>
            </div>
          </div>

          {/* DESTAQUES DA WL (ARTILHEIROS, GARÇONS E MVP) */}
          <div className="grid grid-cols-2 gap-2 z-10">
            {/* ARTILHEIROS */}
            <div className="bg-[#120f0d]/90 border border-amber-500/30 rounded-xl p-2">
              <span className="block text-[8px] font-black text-emerald-400 uppercase border-b border-amber-500/20 pb-0.5 mb-1">
                ⚽ ARTILHEIROS
              </span>
              <div className="space-y-0.5">
                {topScorers.slice(0, 3).length > 0 ? (
                  topScorers.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[9px] font-bold">
                      <span className="text-zinc-200 truncate max-w-[70px]">{idx + 1}. {item.name}</span>
                      <span className="text-emerald-400">{item.count}G</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[8px] text-zinc-500 font-bold">Sem dados</span>
                )}
              </div>
            </div>

            {/* GARÇONS */}
            <div className="bg-[#120f0d]/90 border border-amber-500/30 rounded-xl p-2">
              <span className="block text-[8px] font-black text-amber-400 uppercase border-b border-amber-500/20 pb-0.5 mb-1">
                🎯 GARÇONS
              </span>
              <div className="space-y-0.5">
                {topAssisters.slice(0, 3).length > 0 ? (
                  topAssisters.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[9px] font-bold">
                      <span className="text-zinc-200 truncate max-w-[70px]">{idx + 1}. {item.name}</span>
                      <span className="text-amber-300">{item.count}A</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[8px] text-zinc-500 font-bold">Sem dados</span>
                )}
              </div>
            </div>

            {/* CRAQUE / MVP */}
            <div className="col-span-2 bg-[#120f0d]/90 border border-purple-500/40 rounded-xl p-2 flex justify-between items-center">
              <div>
                <span className="block text-[8px] font-black text-purple-400 uppercase">🏆 CRAQUE DA WL</span>
                <span className="text-[10px] font-black text-white truncate max-w-[150px] block">
                  {topMvp ? topMvp.name : 'SEM MVP'}
                </span>
              </div>
              <span className="text-[9px] font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                {topMvp ? `${topMvp.count}x MVP` : '-'}
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="text-center z-10 pb-1">
            <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest border-t border-amber-500/20 pt-2">
              Crie o seu card no nosso app! ⚽
            </p>
          </div>

        </div>
      </div>
    );
  }
);

StoryCard.displayName = 'StoryCard';