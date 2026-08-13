'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface Match {
  id: string;
  match_number: number;
  goals_for: number;
  goals_against: number;
  result: 'WIN' | 'LOSS';
  mvp_player: string;
  user_id?: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [matches, setMatches] = useState<Match[]>([]);
  const [goalsFor, setGoalsFor] = useState('');
  const [goalsAgainst, setGoalsAgainst] = useState('');
  const [mvp, setMvp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Estados para edição
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // 1. CHECAR SESSÃO DO USUÁRIO
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
      setLoadingUser(false);
      fetchMatches();
    }
  };

  // 2. BUSCAR PARTIDAS DO BANCO
  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_number', { ascending: true });

    if (!error && data) {
      setMatches(data);
    }
  };

  // 3. ADICIONAR OU EDITAR PARTIDA
  const handleAddOrEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalsFor || !goalsAgainst) return;

    setLoading(true);
    const gf = parseInt(goalsFor);
    const ga = parseInt(goalsAgainst);
    const result = gf > ga ? 'WIN' : 'LOSS';

    if (editingMatch) {
      // ATUALIZAR PARTIDA EXISTENTE
      const { error } = await supabase
        .from('matches')
        .update({
          goals_for: gf,
          goals_against: ga,
          result,
          mvp_player: mvp,
        })
        .eq('id', editingMatch.id);

      if (!error) {
        closeModal();
        fetchMatches();
      } else {
        alert('Erro ao editar partida: ' + error.message);
      }
    } else {
      // CRIAR NOVA PARTIDA
      const nextMatchNumber = matches.length + 1;
      const { error } = await supabase.from('matches').insert([
        {
          match_number: nextMatchNumber,
          goals_for: gf,
          goals_against: ga,
          result,
          mvp_player: mvp,
          user_id: user?.id,
        },
      ]);

      if (!error) {
        closeModal();
        fetchMatches();
      } else {
        alert('Erro ao salvar partida: ' + error.message);
      }
    }
    setLoading(false);
  };

  // 4. DELETAR PARTIDA
  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Deseja realmente apagar esta partida?')) return;

    setLoading(true);
    const { error } = await supabase.from('matches').delete().eq('id', id);

    if (!error) {
      fetchMatches();
    } else {
      alert('Erro ao deletar partida: ' + error.message);
    }
    setLoading(false);
  };

  // 5. RESETAR CAMPANHA
  const handleResetCampaign = async () => {
    if (matches.length === 0) return alert('Nenhuma partida registrada para zerar!');
    
    const confirmReset = confirm(
      '⚠️ ATENÇÃO: Deseja apagar todas as partidas e iniciar uma nova Weekend League?'
    );
    if (!confirmReset) return;

    setLoading(true);
    const matchIds = matches.map((m) => m.id);
    const { error } = await supabase.from('matches').delete().in('id', matchIds);

    if (!error) {
      setMatches([]);
      alert('Weekend League zerada com sucesso! Boa sorte na nova campanha. 🔥');
    } else {
      alert('Erro ao zerar campanha: ' + error.message);
    }
    setLoading(false);
  };

  // 6. LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const openEditModal = (match: Match) => {
    setEditingMatch(match);
    setGoalsFor(match.goals_for.toString());
    setGoalsAgainst(match.goals_against.toString());
    setMvp(match.mvp_player || '');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMatch(null);
    setGoalsFor('');
    setGoalsAgainst('');
    setMvp('');
  };

  const wins = matches.filter((m) => m.result === 'WIN').length;
  const losses = matches.filter((m) => m.result === 'LOSS').length;
  const totalGoalsFor = matches.reduce((acc, m) => acc + m.goals_for, 0);
  const totalGoalsAgainst = matches.reduce((acc, m) => acc + m.goals_against, 0);

  const mvpCounts: { [key: string]: number } = {};
  matches.forEach((m) => {
    if (m.mvp_player) {
      mvpCounts[m.mvp_player] = (mvpCounts[m.mvp_player] || 0) + 1;
    }
  });
  const topMvp = Object.entries(mvpCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VINI JR.';

  const progressPercentage = Math.min(100, (matches.length / 15) * 100);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-24 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      
      {/* 1. BACKGROUND LIMPO (BELLINGHAM + MBAPPÉ SEM PONTOS/BOLINHAS) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/bg-hero.png" 
          alt="EA FC Background" 
          className="w-full h-full object-cover object-center opacity-50 filter contrast-105 saturate-[1.1]"
        />
      </div>

      {/* 2. GRADIENTE DE INTEGRAÇÃO ESCURO E SUAVE */}
      <div className="fixed inset-0 opacity-50 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-[#0a0709]/80 to-[#040305] z-0" />

      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* BARRA DE PERFIL DO USUÁRIO + SAIR */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#171310]/90 to-[#0b0907]/90 border border-amber-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="User" className="w-6 h-6 rounded-full border border-amber-400" />
            )}
            <span className="text-xs font-bold text-amber-100 truncate max-w-[180px]">
              {user?.user_metadata?.full_name || 'Jogador'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] font-black uppercase text-rose-400 hover:text-white bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded transition cursor-pointer"
          >
            SAIR 🚪
          </button>
        </div>

        {/* HEADER BRANDING */}
        <header className="text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="text-amber-400 text-3xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">WL</span>
            <h1 className="text-3xl font-black italic tracking-wider text-white uppercase drop-shadow-[0_2px_15px_rgba(217,119,6,0.6)]">
              TRACKER
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.35em] font-black text-amber-500 uppercase">
            EA FC ULTIMATE TEAM
          </p>
        </header>

        {/* CARD PRINCIPAL DE RECORD */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 p-5 shadow-[0_0_30px_rgba(251,191,36,0.4)] backdrop-blur-md">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src="/champs-logo.png" 
              alt="FUT Champions Background" 
              className="w-full h-full object-cover object-center opacity-75 filter saturate-150 contrast-125 scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-950/70 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="space-y-1 max-w-[60%]">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)] inline-block">
                FUT CHAMPIONS
              </span>
              <p className="text-[10px] font-black text-zinc-200 uppercase tracking-wider pt-1">YOUR RECORD</p>
              
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]">
                  {wins}W
                </span>
                <span className="text-xl font-black text-zinc-400">-</span>
                <span className="text-3xl font-black text-rose-500 tracking-tight drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">
                  {losses}L
                </span>
              </div>
            </div>

            {/* BARRA DE PROGRESSO DE JOGOS */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs font-black tracking-wider">
                <span className="text-zinc-200 drop-shadow">MATCHES</span>
                <span className="text-amber-300 font-extrabold">{matches.length} / 15</span>
              </div>
              <div className="h-3 w-full bg-zinc-950/90 rounded-full overflow-hidden border border-amber-400/70 p-[1px] shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(251,191,36,1)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARDS DE ESTATÍSTICAS E CARTA DO MVP */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-b from-[#1c1611]/95 to-[#0b0806]/95 border border-amber-500/30 rounded-xl p-3 text-center shadow-lg backdrop-blur-md flex flex-col justify-between items-center">
            <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              GOALS SCORED
            </span>
            <span className="text-3xl font-black text-white">{totalGoalsFor}</span>
            <div className="text-2xl">⚽</div>
          </div>

          <div className="bg-gradient-to-b from-[#1c1611]/95 to-[#0b0806]/95 border border-amber-500/30 rounded-xl p-3 text-center shadow-lg backdrop-blur-md flex flex-col justify-between items-center">
            <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              CONCEDED
            </span>
            <span className="text-3xl font-black text-white">{totalGoalsAgainst}</span>
            <div className="text-2xl">🥅</div>
          </div>

          <div className="bg-gradient-to-b from-amber-950/80 via-[#1c1611]/95 to-[#0b0806]/95 border-2 border-amber-500/80 rounded-xl p-2 text-center shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col items-center justify-between">
            <span className="block text-[9px] font-black text-amber-400 uppercase tracking-wider">
              MVP
            </span>
            <span className="text-[11px] font-black text-amber-200 uppercase truncate max-w-full">
              {topMvp}
            </span>

            <div className="w-full h-20 rounded-lg bg-gradient-to-b from-amber-400/20 via-amber-600/10 to-transparent p-[1px] overflow-hidden relative mt-1 border border-amber-400/40 flex items-center justify-center">
              <img 
                src="/vini.png" 
                alt="MVP" 
                className="w-full h-full object-cover object-top filter contrast-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* DICA DO COACH */}
        <div className="bg-gradient-to-r from-[#221912]/95 to-[#0d0906]/95 border border-amber-500/40 p-3 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-800 p-[1.5px] flex-shrink-0">
            <div className="w-full h-full bg-[#0a0807] rounded-full flex items-center justify-center text-lg">
              👨‍🏫
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">
              COACH TIPS
            </span>
            <p className="text-[11px] text-zinc-300 leading-tight font-medium">
              Mandando bem! Fortaleça o meio campo no 2º tempo e use ataques rápidos pelas pontas.
            </p>
          </div>
        </div>

        {/* BOTÃO ADICIONAR PARTIDA */}
        <button
          onClick={() => {
            setEditingMatch(null);
            setShowAddModal(true);
          }}
          className="w-full py-4 rounded-xl font-black text-white text-sm tracking-widest uppercase bg-gradient-to-r from-red-700 via-red-600 to-rose-700 border-2 border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative z-10 cursor-pointer hover:brightness-110"
        >
          <span className="text-xl">+</span> ADD MATCH
        </button>

        {/* HISTÓRICO DE JOGOS COM EDITA/DELETA */}
        <section className="space-y-2 pt-1 relative z-10">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Match History
            </h2>
            
            {/* BOTÃO DE RESET DA WL */}
            {matches.length > 0 && (
              <button
                onClick={handleResetCampaign}
                className="text-[10px] font-extrabold text-rose-400 hover:text-rose-300 uppercase tracking-wider bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded transition active:scale-95 cursor-pointer"
              >
                🔄 Reset WL
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-6 bg-[#120f0d]/90 border border-amber-900/30 rounded-xl text-zinc-500 text-xs font-bold backdrop-blur-md">
              Nenhuma partida registrada ainda. Toque no botão acima!
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-gradient-to-r from-[#171310]/95 to-[#0b0907]/95 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between shadow-md backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black text-[11px] px-2.5 py-1 rounded border ${
                        match.result === 'WIN'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                      }`}
                    >
                      {match.result === 'WIN' ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      Match #{match.match_number}
                    </span>
                  </div>

                  <div className="text-base font-black tracking-wider text-white">
                    {match.goals_for} - {match.goals_against}
                  </div>

                  {/* AÇÕES DA PARTIDA (EDITAR / DELETAR) */}
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-bold text-amber-300 truncate max-w-[70px]">
                      {match.mvp_player ? `⭐ ${match.mvp_player}` : '-'}
                    </div>

                    <button
                      onClick={() => openEditModal(match)}
                      className="text-xs bg-amber-500/20 text-amber-300 p-1.5 rounded border border-amber-500/30 hover:bg-amber-500/40 transition cursor-pointer"
                      title="Editar Partida"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="text-xs bg-rose-500/20 text-rose-400 p-1.5 rounded border border-rose-500/30 hover:bg-rose-500/40 transition cursor-pointer"
                      title="Apagar Partida"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL PARA ADICIONAR OU EDITAR PARTIDA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(217,119,6,0.3)]">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {editingMatch ? `EDIT MATCH #${editingMatch.match_number}` : `ADD MATCH #${matches.length + 1}`}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOrEditMatch} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Goals Scored
                </label>
                <input
                  type="number"
                  min="0"
                  value={goalsFor}
                  onChange={(e) => setGoalsFor(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Goals Conceded
                </label>
                <input
                  type="number"
                  min="0"
                  value={goalsAgainst}
                  onChange={(e) => setGoalsAgainst(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Match MVP
                </label>
                <input
                  type="text"
                  value={mvp}
                  onChange={(e) => setMvp(e.target.value)}
                  placeholder="Ex: Vini Jr."
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/3 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black rounded-lg text-xs tracking-wider uppercase shadow-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'SAVING...' : editingMatch ? 'UPDATE MATCH' : 'SAVE MATCH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}