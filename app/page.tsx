'use client';

import BottomNav from '@/components/BottomNav';
import { StoryCard } from '@/components/StoryCard';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toPng } from 'html-to-image';

interface Match {
  id: string;
  match_number: number;
  goals_for: number;
  goals_against: number;
  possession?: number;
  result: 'WIN' | 'LOSS';
  mvp_player: string;
  user_id?: string;
}

interface Profile {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  role?: string;
}

interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  url: string;
  is_live: boolean;
  profiles?: Profile | null;
}

interface MatchStatItem {
  player_name: string;
  quantity: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [matches, setMatches] = useState<Match[]>([]);
  const [goalsFor, setGoalsFor] = useState('');
  const [goalsAgainst, setGoalsAgainst] = useState('');
  const [possession, setPossession] = useState('50');
  const [mvp, setMvp] = useState('');
  
  // Múltiplos marcadores e assistentes no modal
  const [scorers, setScorers] = useState<MatchStatItem[]>([]);
  const [assisters, setAssisters] = useState<MatchStatItem[]>([]);
  const [newScorerName, setNewScorerName] = useState('');
  const [newScorerQty, setNewScorerQty] = useState('1');
  const [newAssisterName, setNewAssisterName] = useState('');
  const [newAssisterQty, setNewAssisterQty] = useState('1');

  // Listas agregadas da campanha toda
  const [topScorersList, setTopScorersList] = useState<{ name: string; count: number }[]>([]);
  const [topAssistersList, setTopAssistersList] = useState<{ name: string; count: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  
  // Estados de Lives
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [livePlatform, setLivePlatform] = useState('Twitch');
  const [liveUrl, setLiveUrl] = useState('');
  const [myCurrentLive, setMyCurrentLive] = useState<LiveStream | null>(null);

  // Estados para edição
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Referência para o Gerador de Card pro Instagram
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const syncProfile = async (sessionUser: any) => {
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    const currentRole = existingProf?.role || 'ADMIN';

    const { data: prof, error } = await supabase.from('profiles').upsert(
      {
        id: sessionUser.id,
        full_name: sessionUser.user_metadata?.full_name || 'Jogador',
        avatar_url: sessionUser.user_metadata?.avatar_url || '',
        region: 'BR',
        role: currentRole,
      },
      { onConflict: 'id' }
    ).select().single();

    if (!error && prof) {
      setProfile(prof);
    } else if (existingProf) {
      setProfile(existingProf);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
      await syncProfile(session.user);
      await fetchLives(session.user.id);
      await fetchMatches(session.user.id);
      setLoadingUser(false);
    }
  };

  const fetchLives = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('lives')
      .select(`
        *,
        profiles ( id, full_name, avatar_url, role, username )
      `)
      .eq('is_live', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLives(data as any);
      const myLive = data.find((l: any) => l.user_id === currentUserId);
      if (myLive) setMyCurrentLive(myLive as any);
      else setMyCurrentLive(null);
    }
  };

  const fetchMatches = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_number', { ascending: true });

    if (!error && data) {
      setMatches(data);
      if (targetUserId) {
        await fetchCampaignStats(targetUserId);
      }
    }
  };

  const fetchCampaignStats = async (userId: string) => {
    const { data, error } = await supabase
      .from('match_stats')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      const goalsMap: { [key: string]: number } = {};
      const assistsMap: { [key: string]: number } = {};

      data.forEach((item) => {
        const pName = item.player_name.trim().toUpperCase();
        if (item.stat_type === 'GOAL') {
          goalsMap[pName] = (goalsMap[pName] || 0) + item.quantity;
        } else if (item.stat_type === 'ASSIST') {
          assistsMap[pName] = (assistsMap[pName] || 0) + item.quantity;
        }
      });

      const sortedScorers = Object.entries(goalsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const sortedAssisters = Object.entries(assistsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setTopScorersList(sortedScorers);
      setTopAssistersList(sortedAssisters);
    }
  };

  const handleAddScorer = () => {
    if (!newScorerName) return;
    setScorers([...scorers, { player_name: newScorerName, quantity: parseInt(newScorerQty) || 1 }]);
    setNewScorerName('');
    setNewScorerQty('1');
  };

  const handleAddAssister = () => {
    if (!newAssisterName) return;
    setAssisters([...assisters, { player_name: newAssisterName, quantity: parseInt(newAssisterQty) || 1 }]);
    setNewAssisterName('');
    setNewAssisterQty('1');
  };

  const handleToggleLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (myCurrentLive) {
      await supabase.from('lives').delete().eq('id', myCurrentLive.id);
      setMyCurrentLive(null);
      alert('Live encerrada com sucesso! 🛑');
    } else {
      if (!liveTitle || !liveUrl) return alert('Preencha o título e o link da sua live!');
      
      const { data, error } = await supabase.from('lives').upsert({
        user_id: user.id,
        title: liveTitle,
        platform: livePlatform,
        url: liveUrl,
        is_live: true
      }).select().single();

      if (error) {
        alert('Erro ao anunciar live: ' + error.message);
      } else {
        alert('Live anunciada no topo do app! 💜⚡');
        setMyCurrentLive(data as any);
      }
    }

    setShowLiveModal(false);
    if (user) fetchLives(user.id);
  };

  const handleAddOrEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalsFor || !goalsAgainst) return;

    setLoading(true);
    const gf = parseInt(goalsFor);
    const ga = parseInt(goalsAgainst);
    const poss = parseInt(possession) || 50;
    const result = gf > ga ? 'WIN' : 'LOSS';

    try {
      if (editingMatch) {
        const { error: deleteError } = await supabase
          .from('match_stats')
          .delete()
          .eq('match_id', editingMatch.id);
        
        if (deleteError) throw new Error("Erro ao limpar stats antigas: " + deleteError.message);

        const { error: matchError } = await supabase
          .from('matches')
          .update({
            goals_for: gf,
            goals_against: ga,
            possession: poss,
            result,
            mvp_player: mvp,
          })
          .eq('id', editingMatch.id);
        
        if (matchError) throw new Error("Erro ao atualizar match: " + matchError.message);

        await saveMatchStats(editingMatch.id);
      } else {
        const nextMatchNumber = matches.length + 1;
        const { data: createdMatch, error: insertError } = await supabase.from('matches').insert([
          {
            match_number: nextMatchNumber,
            goals_for: gf,
            goals_against: ga,
            possession: poss,
            result,
            mvp_player: mvp,
            user_id: user?.id,
          },
        ]).select().single();

        if (insertError) throw new Error("Erro ao criar match: " + insertError.message);
        if (createdMatch) await saveMatchStats(createdMatch.id);
      }

      closeModal();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchMatches(user?.id);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMatchStats = async (matchId: string) => {
    if (!user) return;
    const statsPayload: any[] = [];

    scorers.forEach((s) => {
      statsPayload.push({
        match_id: matchId,
        user_id: user.id,
        player_name: s.player_name,
        stat_type: 'GOAL',
        quantity: s.quantity,
      });
    });

    assisters.forEach((a) => {
      statsPayload.push({
        match_id: matchId,
        user_id: user.id,
        player_name: a.player_name,
        stat_type: 'ASSIST',
        quantity: a.quantity,
      });
    });

    if (statsPayload.length > 0) {
      const { error } = await supabase.from('match_stats').insert(statsPayload);
      if (error) {
        throw new Error("Erro ao salvar estatísticas: " + error.message);
      }
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Deseja realmente apagar esta partida?')) return;

    setLoading(true);
    await supabase.from('match_stats').delete().eq('match_id', id);
    const { error } = await supabase.from('matches').delete().eq('id', id);

    if (!error) {
      await fetchMatches(user?.id);
    } else {
      alert('Erro ao deletar partida: ' + error.message);
    }
    setLoading(false);
  };

  const handleResetCampaign = async () => {
    if (matches.length === 0) return alert('Nenhuma partida registrada para zerar!');
    
    const confirmReset = confirm(
      '⚠️ ATENÇÃO: Deseja apagar todas as partidas e iniciar uma nova Weekend League?'
    );
    if (!confirmReset) return;

    setLoading(true);
    const matchIds = matches.map((m) => m.id);
    await supabase.from('match_stats').delete().in('match_id', matchIds);
    const { error } = await supabase.from('matches').delete().in('id', matchIds);

    if (!error) {
      setMatches([]);
      setTopScorersList([]);
      setTopAssistersList([]);
      alert('Weekend League zerada com sucesso! Boa sorte na nova campanha. 🔥');
    } else {
      alert('Erro ao zerar campanha: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setGeneratingCard(true);

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `wl-tracker-${profile?.username || 'campanha'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert('Erro ao gerar card: ' + err.message);
      console.error(err);
    } finally {
      setGeneratingCard(false);
    }
  };

  const openEditModal = async (match: Match) => {
    setEditingMatch(match);
    setGoalsFor(match.goals_for.toString());
    setGoalsAgainst(match.goals_against.toString());
    setPossession((match.possession || 50).toString());
    setMvp(match.mvp_player || '');

    const { data } = await supabase.from('match_stats').select('*').eq('match_id', match.id);
    if (data) {
      setScorers(data.filter(d => d.stat_type === 'GOAL').map(d => ({ player_name: d.player_name, quantity: d.quantity })));
      setAssisters(data.filter(d => d.stat_type === 'ASSIST').map(d => ({ player_name: d.player_name, quantity: d.quantity })));
    } else {
      setScorers([]);
      setAssisters([]);
    }

    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMatch(null);
    setGoalsFor('');
    setGoalsAgainst('');
    setPossession('50');
    setMvp('');
    setScorers([]);
    setAssisters([]);
  };

  const wins = matches.filter((m) => m.result === 'WIN').length;
  const losses = matches.filter((m) => m.result === 'LOSS').length;
  const totalGoalsFor = matches.reduce((acc, m) => acc + m.goals_for, 0);
  const totalGoalsAgainst = matches.reduce((acc, m) => acc + m.goals_against, 0);
  
  const avgPossession = matches.length > 0 
    ? Math.round(matches.reduce((acc, m) => acc + (m.possession || 50), 0) / matches.length)
    : 50;

  const calculateRank = (w: number) => {
    if (w >= 19) return 'RANK 1 (19-1)';
    if (w >= 18) return 'RANK 2 (18-2)';
    if (w >= 16) return 'RANK 3 (16-4)';
    if (w >= 14) return 'RANK 4 (14-6)';
    if (w >= 11) return 'RANK 5 (11-9)';
    if (w >= 9) return 'RANK 6 (9-11)';
    if (w >= 6) return 'RANK 7 (6-14)';
    if (w >= 4) return 'RANK 8 (4-16)';
    if (w >= 2) return 'RANK 9 (2-18)';
    return 'EM ANDAMENTO';
  };

  const mvpCounts: { [key: string]: number } = {};
  matches.forEach((m) => {
    if (m.mvp_player) {
      const p = m.mvp_player.trim().toUpperCase();
      mvpCounts[p] = (mvpCounts[p] || 0) + 1;
    }
  });

  const allMvpRank = Object.entries(mvpCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topMvpName = allMvpRank[0]?.name || 'SEM MVP';
  const topMvpQty = allMvpRank[0]?.count || 0;

  const progressPercentage = Math.min(100, (matches.length / 15) * 100);
  
  const userRoleUpper = profile?.role?.toUpperCase() || '';
  const isStreamerOrAdmin = ['STREAMER', 'COACH', 'ADMIN'].some(r => userRoleUpper.includes(r)) || true;
  const isAdmin = userRoleUpper.includes('ADMIN');

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-24 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      
      {/* COMPONENTE OCULTO PRO GERADOR DE IMAGEM DO INSTAGRAM */}
      <StoryCard 
        ref={cardRef} 
        wins={wins} 
        losses={losses} 
        rank={calculateRank(wins)} 
        username={profile?.username || user?.user_metadata?.full_name || 'Jogador'} 
        avatarUrl={user?.user_metadata?.avatar_url}
      />

      {/* BACKGROUND LIMPO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/bg-hero.png" 
          alt="EA FC Background" 
          className="w-full h-full object-cover object-center opacity-50 filter contrast-105 saturate-[1.1]"
        />
      </div>

      <div className="fixed inset-0 opacity-50 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-[#0a0709]/80 to-[#040305] z-0" />

      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* BARRA DE PERFIL DO USUÁRIO + BOTAO DE ADM / LIVE / STORIES + SAIR */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#171310]/90 to-[#0b0907]/90 border border-amber-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="User" className="w-6 h-6 rounded-full border border-amber-400" />
            )}
            <span className="text-xs font-bold text-amber-100 truncate max-w-[100px]">
              {user?.user_metadata?.full_name || 'Jogador'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] px-2 py-1 rounded-lg hover:bg-amber-500/40 transition cursor-pointer flex items-center gap-1 shadow-md"
                title="Painel ADM"
              >
                <span>🛡️</span>
                <span>ADM</span>
              </button>
            )}

            {isStreamerOrAdmin && (
              <button
                onClick={() => setShowLiveModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] px-2 py-1 rounded-lg shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1"
              >
                <span>🔴</span>
                <span>{myCurrentLive ? 'LIVE' : '+ LIVE'}</span>
              </button>
            )}

            <button
              onClick={handleDownloadCard}
              disabled={generatingCard}
              className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black text-[10px] px-2 py-1 rounded-lg shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <span>📲</span>
              <span>{generatingCard ? '...' : 'STORIES'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-[10px] font-black uppercase text-rose-400 hover:text-white bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded transition cursor-pointer"
            >
              🚪
            </button>
          </div>
        </div>

        {/* BANNERS DE LIVES EM ANDAMENTO */}
        {lives.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">STREAMS AO VIVO DA COMUNIDADE</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {lives.map((live) => (
                <a
                  key={live.id}
                  href={live.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-[220px] bg-gradient-to-r from-purple-950/80 to-zinc-900/90 border border-purple-500/50 rounded-xl p-3 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-purple-400 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={live.profiles?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                      className="w-7 h-7 rounded-full border border-purple-400 object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }}
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-white truncate">{live.profiles?.full_name}</p>
                      <span className="text-[8px] font-black bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/40 uppercase">
                        {live.platform}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-200 line-clamp-2 mb-2">{live.title}</p>
                  <span className="text-[9px] font-black bg-purple-600 text-white text-center py-1 rounded-lg uppercase tracking-wider block">
                    ASSISTIR AGORA 📺
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

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

        {/* CARD DO COACH DESTAQUE REPOSICIONADO PARA O TOPO */}
        <a
          href="https://www.instagram.com/nomercy54_?igsh=MXRpMTl0eGs1enVyag=="
          target="_blank"
          rel="noreferrer"
          className="block bg-gradient-to-r from-amber-950/90 via-[#221912]/95 to-[#0d0906]/95 border-2 border-amber-500/60 hover:border-amber-400 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(217,119,6,0.25)] backdrop-blur-md transition-all active:scale-[0.98] group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-[2px] flex-shrink-0 shadow-md">
              <div className="w-full h-full bg-[#0a0807] rounded-full flex items-center justify-center text-xl overflow-hidden">
                🎮
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-black text-[8px] font-black px-1 rounded-full border border-black uppercase">
                PRO
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                  COACH MENTOR
                </span>
                <span className="text-[9px] font-extrabold text-amber-300/80 uppercase">
                  • INSTAGRAM
                </span>
              </div>
              
              <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate mt-0.5">
                NoMercy54
              </h3>
              
              <p className="text-[11px] text-zinc-300 leading-tight font-medium line-clamp-1 mt-0.5">
                Quer elevar seu nível de jogo? Clique aqui e conheça meu trabalho no Instagram.
              </p>
            </div>

            <div className="text-amber-400 group-hover:translate-x-1 transition-transform text-lg pr-1 font-bold">
              ➔
            </div>
          </div>
        </a>

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

        {/* CARDS DE ESTATÍSTICAS E TROFÉU MVP DINÂMICO */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-b from-[#1c1611]/95 to-[#0b0806]/95 border border-amber-500/30 rounded-xl p-3 text-center shadow-lg backdrop-blur-md flex flex-col justify-between items-center">
            <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              GOALS
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
              CRAQUE WL
            </span>
            <span className="text-[11px] font-black text-amber-200 uppercase truncate max-w-full">
              {topMvpName}
            </span>

            <div className="w-full h-20 rounded-lg bg-gradient-to-b from-amber-400/20 via-amber-600/10 to-transparent p-[1px] overflow-hidden relative mt-1 border border-amber-400/40 flex flex-col items-center justify-center">
              <span className="text-3xl">🏆</span>
              <span className="text-[10px] font-black text-amber-300 mt-1">
                {topMvpQty}x MVP
              </span>
            </div>
          </div>
        </div>

        {/* RANKING COMPLETO DA CAMPANHA (ARTILHEIROS, GARÇONS E MVPS) */}
        <section className="bg-gradient-to-b from-[#1c1611]/95 to-[#0b0806]/95 border border-amber-500/30 rounded-2xl p-4 space-y-4 backdrop-blur-md shadow-xl">
          <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>🏆</span> RANKING DA CAMPANHA
            </h2>
            <span className="text-[10px] font-bold text-zinc-400">
              Posse Média: <strong className="text-amber-300">{avgPossession}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0807]/80 border border-amber-500/20 rounded-xl p-3">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block border-b border-amber-500/20 pb-1 mb-2">
                  ⚽ TOP ARTILHEIROS
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                  {topScorersList.length > 0 ? (
                    topScorersList.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-200 truncate max-w-[100px]">{idx + 1}. {item.name}</span>
                        <span className="text-emerald-400">{item.count} G</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold">Sem dados</span>
                  )}
                </div>
              </div>

              <div className="bg-[#0a0807]/80 border border-amber-500/20 rounded-xl p-3">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block border-b border-amber-500/20 pb-1 mb-2">
                  🎯 TOP GARÇONS
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                  {topAssistersList.length > 0 ? (
                    topAssistersList.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-200 truncate max-w-[100px]">{idx + 1}. {item.name}</span>
                        <span className="text-amber-300">{item.count} A</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold">Sem dados</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0a0807]/80 border border-amber-500/20 rounded-xl p-3">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block border-b border-amber-500/20 pb-1 mb-2">
                ⭐ RANKING DE MVPS (HOMEM DO JOGO)
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                {allMvpRank.length > 0 ? (
                  allMvpRank.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-bold bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
                      <span className="text-zinc-200 truncate">{idx + 1}. {item.name}</span>
                      <span className="text-purple-300">{item.count}x</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-500 font-bold col-span-2">Sem dados</span>
                )}
              </div>
            </div>
          </div>
        </section>

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

        {/* HISTÓRICO DE JOGOS */}
        <section className="space-y-2 pt-1 relative z-10">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Match History
            </h2>
            
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

                  <div className="text-center">
                    <div className="text-base font-black tracking-wider text-white">
                      {match.goals_for} - {match.goals_against}
                    </div>
                    <span className="text-[9px] font-bold text-amber-400/80">
                      {match.possession || 50}% Posse
                    </span>
                  </div>

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

      {/* MODAL PARA ANUNCIAR / GERENCIAR LIVE */}
      {showLiveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-purple-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <div className="flex justify-between items-center border-b border-purple-500/30 pb-3">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                {myCurrentLive ? 'GERENCIAR MINHA LIVE' : 'ANUNCIAR LIVE NO APP'}
              </h3>
              <button onClick={() => setShowLiveModal(false)} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleToggleLive} className="space-y-3">
              {!myCurrentLive ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-purple-300 uppercase mb-1">Título da Stream</label>
                    <input 
                      type="text" 
                      placeholder="Ex: WL ao Vivo tentando 20-0!" 
                      value={liveTitle} 
                      onChange={(e) => setLiveTitle(e.target.value)} 
                      className="w-full bg-[#0a0807] border border-purple-500/40 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-purple-400 font-medium"
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase mb-1">Plataforma</label>
                      <select 
                        value={livePlatform} 
                        onChange={(e) => setLivePlatform(e.target.value)}
                        className="w-full bg-[#0a0807] border border-purple-500/40 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                      >
                        <option value="Twitch">💜 Twitch</option>
                        <option value="YouTube">🔴 YouTube</option>
                        <option value="Kick">🟢 Kick</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase mb-1">Link da Live</label>
                      <input 
                        type="url" 
                        placeholder="https://twitch.tv/..." 
                        value={liveUrl} 
                        onChange={(e) => setLiveUrl(e.target.value)} 
                        className="w-full bg-[#0a0807] border border-purple-500/40 rounded-lg p-2.5 text-white text-xs focus:outline-none font-medium"
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg transition cursor-pointer">
                    🚀 ENTRAR AO VIVO AGORA
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl">
                    <p className="text-xs font-black text-white">{myCurrentLive.title}</p>
                    <p className="text-[10px] text-purple-400 font-bold">{myCurrentLive.url}</p>
                  </div>
                  <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg transition cursor-pointer">
                    🛑 ENCERRAR MINHA LIVE
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR PARTIDA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(217,119,6,0.3)] my-8">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {editingMatch ? `EDIT MATCH #${editingMatch.match_number}` : `ADD MATCH #${matches.length + 1}`}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddOrEditMatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Gols Pró</label>
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
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Gols Sofridos</label>
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
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Minha Posse de Bola (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={possession}
                  onChange={(e) => setPossession(e.target.value)}
                  placeholder="Ex: 55"
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-black text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">MVP da Partida</label>
                <input
                  type="text"
                  value={mvp}
                  onChange={(e) => setMvp(e.target.value)}
                  placeholder="Ex: Mbappé"
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 font-black text-xs"
                />
              </div>

              <div className="border-t border-amber-500/20 pt-2 space-y-2">
                <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  ⚽ Marcadores de Gol
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do jogador" 
                    value={newScorerName} 
                    onChange={(e) => setNewScorerName(e.target.value)}
                    className="w-2/3 bg-[#0a0807] border border-amber-500/30 rounded-lg p-2 text-white text-xs" 
                  />
                  <input 
                    type="number" 
                    min="1" 
                    value={newScorerQty} 
                    onChange={(e) => setNewScorerQty(e.target.value)}
                    className="w-1/3 bg-[#0a0807] border border-amber-500/30 rounded-lg p-2 text-white text-xs text-center" 
                  />
                  <button type="button" onClick={handleAddScorer} className="bg-emerald-600 text-white font-bold px-3 rounded-lg text-xs">+</button>
                </div>
                {scorers.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs bg-zinc-900 p-1.5 rounded border border-zinc-800">
                    <span className="text-zinc-200">{s.player_name}</span>
                    <span className="font-bold text-emerald-400">{s.quantity} G</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-amber-500/20 pt-2 space-y-2">
                <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  🎯 Assistências (Garçons)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome do jogador" 
                    value={newAssisterName} 
                    onChange={(e) => setNewAssisterName(e.target.value)}
                    className="w-2/3 bg-[#0a0807] border border-amber-500/30 rounded-lg p-2 text-white text-xs" 
                  />
                  <input 
                    type="number" 
                    min="1" 
                    value={newAssisterQty} 
                    onChange={(e) => setNewAssisterQty(e.target.value)}
                    className="w-1/3 bg-[#0a0807] border border-amber-500/30 rounded-lg p-2 text-white text-xs text-center" 
                  />
                  <button type="button" onClick={handleAddAssister} className="bg-amber-600 text-white font-bold px-3 rounded-lg text-xs">+</button>
                </div>
                {assisters.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs bg-zinc-900 p-1.5 rounded border border-zinc-800">
                    <span className="text-zinc-200">{a.player_name}</span>
                    <span className="font-bold text-amber-300">{a.quantity} A</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={closeModal} className="w-1/3 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer">
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

      <BottomNav />
    </main>
  );
}