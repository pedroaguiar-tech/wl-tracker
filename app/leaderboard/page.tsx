'use client';

import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  region: string;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [allUsersRanking, setAllUsersRanking] = useState<LeaderboardUser[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: matches } = await supabase.from('matches').select('*');

    if (profiles && matches) {
      const statsMap: { [userId: string]: LeaderboardUser } = {};

      profiles.forEach((p) => {
        statsMap[p.id] = {
          user_id: p.id,
          full_name: p.full_name || 'Jogador',
          username: p.username || 'sem_nick',
          avatar_url: p.avatar_url || '',
          role: p.role || 'USER',
          region: p.region || 'BR',
          wins: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
        };
      });

      matches.forEach((m) => {
        if (m.user_id && statsMap[m.user_id]) {
          if (m.result === 'WIN') statsMap[m.user_id].wins += 1;
          if (m.result === 'LOSS') statsMap[m.user_id].losses += 1;
          statsMap[m.user_id].goals_for += m.goals_for || 0;
          statsMap[m.user_id].goals_against += m.goals_against || 0;
        }
      });

      const sorted = Object.values(statsMap)
        .filter((u) => u.wins > 0 || u.losses > 0)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          const diffB = b.goals_for - b.goals_against;
          const diffA = a.goals_for - a.goals_against;
          return diffB - diffA;
        });

      setAllUsersRanking(sorted);
    }

    setLoading(false);
  };

  const getRoleBadge = (roleStr: string) => {
    const r = roleStr.toUpperCase();
    if (r.includes('ADMIN') || r.includes('ADM')) return <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black">👑 ADM</span>;
    if (r.includes('PRO')) return <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded font-black">⚡ PRO</span>;
    if (r.includes('COACH')) return <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black">👨‍🏫 COACH</span>;
    if (r.includes('STREAMER')) return <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-black">🔴 LIVE</span>;
    return null;
  };

  const filteredRanking = selectedRegion === 'ALL'
    ? allUsersRanking
    : allUsersRanking.filter(u => u.region?.toUpperCase() === selectedRegion);

  const top100Ranking = filteredRanking.slice(0, 100);

  const top1 = top100Ranking[0];
  const top2 = top100Ranking[1];
  const top3 = top100Ranking[2];
  const restList = top100Ranking.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-28 relative overflow-hidden">
      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* HEADER */}
        <header className="bg-gradient-to-r from-amber-950/80 via-[#171310] to-[#0b0907] border border-amber-500/40 rounded-2xl p-4 shadow-xl text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h1 className="text-xl font-black italic tracking-wider text-amber-400 uppercase">
              TOP 100 LEADERBOARD
            </h1>
          </div>
          <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            RANKING REGIONAL DA COMUNIDADE
          </p>
        </header>

        {/* FILTRO DE REGIÃO (COM ROLAGEM HORIZONTAL SUAVE) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
          {[
            { id: 'ALL', label: '🌐 GLOBAL' },
            { id: 'BR', label: '🇧🇷 BRASIL' },
            { id: 'EU', label: '🇪🇺 EUROPA' },
            { id: 'NA', label: '🇺🇸 N. AMERICA' },
            { id: 'SA', label: '🇦🇷 SUL-AMERICA' },
          ].map((reg) => (
            <button
              key={reg.id}
              onClick={() => setSelectedRegion(reg.id)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-xl border flex-shrink-0 transition cursor-pointer ${
                selectedRegion === reg.id
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                  : 'bg-[#120f0d] text-zinc-400 border-amber-500/20 hover:text-white'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>

        {/* PÓDIO TOP 3 */}
        {top100Ranking.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
            
            {/* 2º LUGAR (PRATA) */}
            <div className="bg-gradient-to-b from-zinc-800/80 to-[#120f0d] border border-zinc-400/50 rounded-xl p-2 text-center flex flex-col items-center justify-end h-36 shadow-lg relative">
              <span className="absolute -top-3 text-lg">🥈</span>
              <img 
                src={top2?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                alt="2nd" 
                className="w-10 h-10 rounded-full border-2 border-zinc-400 object-cover object-top mb-1" 
              />
              <p className="text-[10px] font-black text-white truncate max-w-full">{top2 ? top2.full_name : '-'}</p>
              <p className="text-[11px] font-black text-zinc-300">{top2 ? `${top2.wins}W - ${top2.losses}L` : '0W'}</p>
            </div>

            {/* 1º LUGAR (OURO) */}
            <div className="bg-gradient-to-b from-amber-950/90 via-[#1e1710] to-[#120f0d] border-2 border-amber-400 rounded-2xl p-2 text-center flex flex-col items-center justify-end h-44 shadow-[0_0_25px_rgba(251,191,36,0.4)] relative">
              <span className="absolute -top-4 text-2xl">👑</span>
              <img 
                src={top1?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                alt="1st" 
                className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover object-top mb-1 shadow-md" 
              />
              <p className="text-[11px] font-black text-amber-300 truncate max-w-full">{top1 ? top1.full_name : '-'}</p>
              <p className="text-xs font-black text-amber-400">{top1 ? `${top1.wins}W - ${top1.losses}L` : '0W'}</p>
            </div>

            {/* 3º LUGAR (BRONZE) */}
            <div className="bg-gradient-to-b from-amber-950/40 to-[#120f0d] border border-amber-700/50 rounded-xl p-2 text-center flex flex-col items-center justify-end h-32 shadow-lg relative">
              <span className="absolute -top-3 text-lg">🥉</span>
              <img 
                src={top3?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                alt="3rd" 
                className="w-9 h-9 rounded-full border-2 border-amber-700 object-cover object-top mb-1" 
              />
              <p className="text-[10px] font-black text-white truncate max-w-full">{top3 ? top3.full_name : '-'}</p>
              <p className="text-[11px] font-black text-amber-600">{top3 ? `${top3.wins}W - ${top3.losses}L` : '0W'}</p>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 bg-[#120f0d] border border-amber-500/20 rounded-xl text-zinc-500 text-xs font-bold">
            Nenhum jogador classificado nesta região ainda.
          </div>
        )}

        {/* TABELA TOP 4 AO TOP 100 */}
        {restList.length > 0 && (
          <section className="space-y-2 pt-2">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest px-1">
              Classificação ({restList.length + 3} de 100)
            </h2>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
              {restList.map((item, idx) => {
                const position = idx + 4;
                const diff = item.goals_for - item.goals_against;
                return (
                  <div 
                    key={item.user_id}
                    className="bg-gradient-to-r from-[#171310]/95 to-[#0b0907]/95 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-black text-zinc-500 w-5 text-center">#{position}</span>
                      <img 
                        src={item.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                        alt="User"
                        className="w-8 h-8 rounded-full border border-amber-500/30 object-cover object-center flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-white truncate">{item.full_name}</p>
                          {getRoleBadge(item.role)}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold truncate">@{item.username}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-amber-400">{item.wins}W - {item.losses}L</p>
                      <p className="text-[9px] font-bold text-zinc-500">Saldo: {diff > 0 ? `+${diff}` : diff}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      <BottomNav />
    </main>
  );
}