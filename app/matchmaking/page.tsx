'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  region: string;
  role?: string;
  username?: string;
  whatsapp?: string;
}

interface MatchRequest {
  id: string;
  user_id: string;
  platform: string;
  mode: string;
  notes?: string;
  status: string;
  created_at: string;
  profiles?: Profile | null;
}

interface MatchMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function MatchmakingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Formulário do Desafio
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState('PS5');
  const [mode, setMode] = useState('Treino WL');
  const [notes, setNotes] = useState('');
  const [myActiveMatch, setMyActiveMatch] = useState<MatchRequest | null>(null);

  // Chat do Match
  const [activeMatchChat, setActiveMatchChat] = useState<MatchRequest | null>(null);
  const [matchMessages, setMatchMessages] = useState<MatchMessage[]>([]);
  const [newMatchMsg, setNewMatchMsg] = useState('');

  useEffect(() => {
    checkUserAndFetchMatches();
  }, []);

  const checkUserAndFetchMatches = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
    await fetchMatches(session.user.id);
    setLoading(false);
  };

  const fetchMatches = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('matchmaking')
      .select(`
        *,
        profiles ( id, full_name, avatar_url, region, role, username, whatsapp )
      `)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMatches(data as any);
      const active = data.find((m: any) => m.user_id === currentUserId);
      if (active) setMyActiveMatch(active as any);
      else setMyActiveMatch(null);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const { error } = await supabase.from('matchmaking').insert({
      user_id: user.id,
      platform,
      mode,
      notes,
      status: 'OPEN'
    });

    setCreating(false);
    if (error) {
      alert('Erro ao procurar sala: ' + error.message);
    } else {
      setShowModal(false);
      setNotes('');
      await fetchMatches(user.id);
    }
  };

  const handleCancelMatch = async (matchId: string) => {
    await supabase.from('matchmaking').delete().eq('id', matchId);
    setMyActiveMatch(null);
    await fetchMatches(user?.id);
  };

  // Funções do Chat de Match
  const handleOpenMatchChat = async (match: MatchRequest) => {
    setActiveMatchChat(match);
    fetchMatchMessages(match.id);
  };

  const fetchMatchMessages = async (matchId: string) => {
    const { data } = await supabase
      .from('match_messages')
      .select(`
        *,
        profiles ( full_name )
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    setMatchMessages(data as any || []);
  };

  const handleSendMatchMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchMsg.trim() || !activeMatchChat || !user) return;

    await supabase.from('match_messages').insert({
      match_id: activeMatchChat.id,
      sender_id: user.id,
      content: newMatchMsg.trim()
    });

    setNewMatchMsg('');
    fetchMatchMessages(activeMatchChat.id);
  };

  const getPlatformBadge = (plat: string) => {
    switch (plat) {
      case 'PS5':
        return <span className="bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[9px] font-black px-2 py-0.5 rounded">🎮 PS5</span>;
      case 'XBOX':
        return <span className="bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded">💚 XBOX</span>;
      default:
        return <span className="bg-amber-600/30 text-amber-400 border border-amber-500/40 text-[9px] font-black px-2 py-0.5 rounded">💻 PC</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-28 relative overflow-hidden">
      
      {/* BACKGROUND DECORATIVO */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src="/bg-hero.png" alt="BG" className="w-full h-full object-cover opacity-40 filter contrast-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0709]/90 via-[#070507]/95 to-[#040305]" />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center bg-[#171310]/90 border border-amber-500/30 rounded-xl p-3 backdrop-blur-md shadow-xl">
          <div>
            <h1 className="text-lg font-black italic tracking-wider text-white">LOBBY DE X1</h1>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Encontre Adversários & Treinos</p>
          </div>
          {myActiveMatch ? (
            <button
              onClick={() => handleCancelMatch(myActiveMatch.id)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-2 rounded-lg shadow-lg active:scale-95 transition cursor-pointer"
            >
              🛑 CANCELAR BUSCA
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black text-xs px-3 py-2 rounded-lg shadow-lg active:scale-95 transition cursor-pointer"
            >
              ⚡ CRIAR SALA DE X1
            </button>
          )}
        </header>

        {/* LISTA DE SALAS DISPONÍVEIS */}
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-12 bg-[#120f0d]/80 border border-amber-900/30 rounded-xl text-zinc-500 text-xs font-bold">
              Nenhum jogador buscando partida no momento.<br/>Seja o primeiro a criar uma sala! ⚔️
            </div>
          ) : (
            matches.map((m) => {
              const isMe = m.user_id === user?.id;
              return (
                <div 
                  key={m.id} 
                  className={`bg-[#120f0d]/90 border rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3 transition ${
                    isMe ? 'border-amber-500/80 bg-amber-950/10' : 'border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={m.profiles?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                        className="w-9 h-9 rounded-full border border-amber-400 object-cover bg-zinc-800"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{m.profiles?.full_name}</span>
                          <span className="text-[9px] font-black bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-700">
                            {m.profiles?.region || 'BR'}
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-500 font-bold">
                          {m.profiles?.username ? `@${m.profiles.username}` : 'Jogador'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getPlatformBadge(m.platform)}
                      <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {m.mode}
                      </span>
                    </div>
                  </div>

                  {m.notes && (
                    <p className="text-xs text-zinc-300 bg-[#0a0807] p-2.5 rounded-xl border border-amber-500/10 font-medium">
                      "{m.notes}"
                    </p>
                  )}

                  <div className="pt-1 flex gap-2">
                    <button 
                      onClick={() => handleOpenMatchChat(m)}
                      className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-black font-black text-xs rounded-lg uppercase tracking-wider transition cursor-pointer"
                    >
                      💬 CHAT DA SALA
                    </button>
                    {m.profiles?.whatsapp && !isMe && (
                      <a 
                        href={`https://wa.me/${m.profiles.whatsapp}?text=Ea%20ai!%20Bora%20jogar%20aquele%20X1%20pelo%20WL%20Tracker?`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs text-center rounded-lg uppercase transition flex items-center justify-center"
                      >
                        📱 ZAP
                      </a>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL BATE-PAPO DA SALA */}
      {activeMatchChat && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl h-[480px] flex flex-col shadow-2xl">
            
            <div className="p-3 border-b border-amber-500/30 flex justify-between items-center bg-[#120f0d]">
              <div>
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  CHAT DA SALA: {activeMatchChat.profiles?.full_name}
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold">{activeMatchChat.platform} • {activeMatchChat.mode}</p>
              </div>
              <button onClick={() => setActiveMatchChat(null)} className="text-zinc-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0a0807]">
              {matchMessages.length === 0 ? (
                <p className="text-[10px] text-zinc-500 text-center pt-8">
                  Nenhuma mensagem ainda. Envie um "Bora!" para combinar a busca! ⚽
                </p>
              ) : (
                matchMessages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] text-zinc-500 font-bold mb-0.5">
                        {msg.profiles?.full_name || 'Jogador'}
                      </span>
                      <div className={`max-w-[80%] p-2 rounded-xl text-xs ${isMe ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-white border border-zinc-700'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMatchMsg} className="p-2 border-t border-amber-500/30 flex gap-2 bg-[#120f0d]">
              <input
                type="text"
                placeholder="Combine nick, sala e objetivo..."
                value={newMatchMsg}
                onChange={(e) => setNewMatchMsg(e.target.value)}
                className="flex-1 bg-[#0a0807] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-amber-500 text-black font-black text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition">
                Enviar
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL CRIAR SALA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(217,119,6,0.3)]">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">PROCURAR OPONENTE DE X1</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3">
              
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Plataforma</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none font-semibold"
                >
                  <option value="PS5">🎮 PlayStation 5</option>
                  <option value="XBOX">💚 Xbox Series S/X</option>
                  <option value="PC">💻 PC (Steam/EA App)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Modo / Objetivo</label>
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none font-semibold"
                >
                  <option value="Treino WL">⚡ Treino pra WL</option>
                  <option value="Testar Tática">📋 Testar Tática / Formação</option>
                  <option value="Amistoso">⚽ Amistoso For Fun</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Observação / Regras (Opcional)</label>
                <input 
                  type="text" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Ex: Procuro quem faz Rank 1 a 3 pra treino pesado!" 
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none font-medium"
                />
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black text-xs rounded-xl uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition cursor-pointer"
              >
                {creating ? 'CRIANDO SALA...' : 'ENTRAR NO LOBBY AGORA ⚔️'}
              </button>

            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}