'use client';

import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Tactic {
  id: string;
  title: string;
  formation: string;
  defensive_style: string;
  width: number;
  depth: number;
  build_up: string;
  chance_creation: string;
  instructions: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    role: string;
    avatar_url: string;
  };
}

export default function TacticsPage() {
  const [loading, setLoading] = useState(true);
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [user, setUser] = useState<any>(null);

  // Estados do Formulário de Nova Tática
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [formation, setFormation] = useState('4-2-3-1');
  const [defensiveStyle, setDefensiveStyle] = useState('Equilibrado');
  const [width, setWidth] = useState(50);
  const [depth, setDepth] = useState(60);
  const [buildUp, setBuildUp] = useState('Armação Rápida');
  const [chanceCreation, setChanceCreation] = useState('Passe Dirigido');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkUserAndFetch();
  }, []);

  const checkUserAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);

    await fetchTactics();
    setLoading(false);
  };

  const fetchTactics = async () => {
    const { data, error } = await supabase
      .from('tactics')
      .select(`
        *,
        profiles ( full_name, username, role, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTactics(data as any);
    }
  };

  const handleSaveTactic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para criar uma tática!');
    if (!title) return alert('Dê um nome para a sua tática!');

    setSaving(true);
    const { error } = await supabase.from('tactics').insert([
      {
        user_id: user.id,
        title,
        formation,
        defensive_style: defensiveStyle,
        width,
        depth,
        build_up: buildUp,
        chance_creation: chanceCreation,
        instructions,
      },
    ]);

    setSaving(false);

    if (error) {
      alert('Erro ao salvar tática: ' + error.message);
    } else {
      alert('Tática salva e compartilhada com sucesso! 📋⚡');
      setShowModal(false);
      setTitle('');
      setInstructions('');
      await fetchTactics();
    }
  };

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
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-black italic tracking-wider text-amber-400 uppercase">
              LABORATÓRIO TÁTICO
            </h1>
          </div>
          <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            PRANCHETAS E INSTRUÇÕES DOS PROS & COACHES
          </p>
        </header>

        {/* BOTÃO CRIAR TÁTICA */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-amber-300 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <span>⚡</span> CRIAR NOVA PRANCHETA TÁTICA
        </button>

        {/* LISTA DE TÁTICAS DA COMUNIDADE */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest px-1">
            Táticas Recomendadas ({tactics.length})
          </h2>

          {tactics.length === 0 ? (
            <div className="text-center py-8 bg-[#120f0d] border border-amber-500/20 rounded-xl text-zinc-500 text-xs font-bold">
              Nenhuma tática criada ainda. Seja o primeiro a compartilhar sua formação!
            </div>
          ) : (
            <div className="space-y-3">
              {tactics.map((tac) => (
                <div
                  key={tac.id}
                  className="bg-gradient-to-r from-[#171310]/95 to-[#0b0907]/95 border border-amber-500/30 p-4 rounded-2xl space-y-3 shadow-xl backdrop-blur-md"
                >
                  {/* CABEÇALHO DO AUTOR */}
                  <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={tac.profiles?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'}
                        alt="Autor"
                        className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                      />
                      <div>
                        <p className="text-xs font-black text-white">{tac.title}</p>
                        <p className="text-[10px] text-zinc-400 font-bold">por {tac.profiles?.full_name || 'Usuário'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg uppercase">
                      {tac.formation}
                    </span>
                  </div>

                  {/* SLIDERS E CONFIGURAÇÕES TÁTICAS */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    <div className="bg-[#0a0807] p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px] uppercase">Estilo Defensivo</span>
                      <span className="text-amber-400">{tac.defensive_style}</span>
                    </div>
                    <div className="bg-[#0a0807] p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px] uppercase">Criação</span>
                      <span className="text-amber-400">{tac.chance_creation}</span>
                    </div>
                    <div className="bg-[#0a0807] p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px] uppercase">Amplitude</span>
                      <span className="text-white">{tac.width}</span>
                    </div>
                    <div className="bg-[#0a0807] p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px] uppercase">Profundidade</span>
                      <span className="text-white">{tac.depth}</span>
                    </div>
                  </div>

                  {/* INSTRUÇÕES ESPECÍFICAS */}
                  {tac.instructions && (
                    <div className="bg-[#0a0807] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                        📌 Instruções de Jogadores:
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                        "{tac.instructions}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* MODAL PARA CRIAR NOVA TÁTICA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(217,119,6,0.3)] my-8">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                CRIAR PRANCHETA TÁTICA
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveTactic} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-amber-300 uppercase mb-1">Título da Tática</label>
                <input
                  type="text"
                  placeholder="Ex: 4-2-3-1 Meta WL Anti-Pressão"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Formação</label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white text-xs font-bold"
                  >
                    <option value="4-2-3-1">4-2-3-1</option>
                    <option value="4-3-2-1">4-3-2-1</option>
                    <option value="4-4-2">4-4-2</option>
                    <option value="3-5-2">3-5-2</option>
                    <option value="5-3-2">5-3-2</option>
                    <option value="4-1-2-1-2">4-1-2-1-2 (2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Defesa</label>
                  <select
                    value={defensiveStyle}
                    onChange={(e) => setDefensiveStyle(e.target.value)}
                    className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white text-xs font-bold"
                  >
                    <option value="Equilibrado">Equilibrado</option>
                    <option value="Pressão no Erro">Pressão no Erro</option>
                    <option value="Pressão Constante">Pressão Constante</option>
                    <option value="Recuado">Recuado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Amplitude ({width})</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-1">Profundidade ({depth})</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-300 uppercase mb-1">Instruções aos Jogadores</label>
                <textarea
                  placeholder="Ex: Volante esquerdo ficar na defesa. Pontas voltar para marcar. Atacante ir para as costas."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white text-xs font-medium resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black rounded-lg text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  {saving ? 'SALVANDO...' : 'SALVAR PRANCHETA'}
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