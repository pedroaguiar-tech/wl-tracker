'use client';

import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  role?: string;
  region?: string;
}

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  reason: string;
  status: string;
  created_at: string;
  profiles?: UserProfile | null;
}

interface MatchProof {
  id: string;
  match_number: number;
  goals_for: number;
  goals_against: number;
  result: string;
  proof_image_url: string;
  verified_status: string;
  created_at: string;
  profiles?: UserProfile | null;
}

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [pendingProofs, setPendingProofs] = useState<MatchProof[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const roleUpper = prof?.role?.toUpperCase() || '';

    if (!roleUpper.includes('ADMIN')) {
      alert('⚠️ Acesso restrito a Administradores!');
      router.push('/');
      return;
    }

    await fetchAllUsers();
    await fetchRequests();
    await fetchPendingProofs();
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (!error && data) setUsers(data);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('role_requests')
      .select(`
        *,
        profiles ( id, full_name, username, avatar_url, role )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (!error && data) setRequests(data as any);
  };

  const fetchPendingProofs = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        profiles ( id, full_name, username, avatar_url )
      `)
      .eq('verified_status', 'PENDING')
      .not('proof_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) setPendingProofs(data as any);
  };

  const handleApproveWLProof = async (matchId: string) => {
    setUpdatingId(matchId);
    const { error } = await supabase
      .from('matches')
      .update({ verified_status: 'APPROVED' })
      .eq('id', matchId);

    if (!error) {
      alert('Campanha da WL aprovada e verificada no Ranking! ⚡');
      await fetchPendingProofs();
    } else {
      alert('Erro ao aprovar: ' + error.message);
    }
    setUpdatingId(null);
  };

  const handleRejectWLProof = async (matchId: string) => {
    setUpdatingId(matchId);
    const { error } = await supabase
      .from('matches')
      .update({ verified_status: 'REJECTED' })
      .eq('id', matchId);

    if (!error) {
      alert('Comprovante recusado.');
      await fetchPendingProofs();
    } else {
      alert('Erro ao recusar: ' + error.message);
    }
    setUpdatingId(null);
  };

  const handleApproveRequest = async (req: RoleRequest) => {
    setUpdatingId(req.id);
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ role: req.requested_role })
      .eq('id', req.user_id);

    if (profileErr) {
      alert('Erro ao atualizar perfil: ' + profileErr.message);
      setUpdatingId(null);
      return;
    }

    await supabase
      .from('role_requests')
      .update({ status: 'APPROVED' })
      .eq('id', req.id);

    alert(`Cargo ${req.requested_role} aprovado com sucesso! 🎉`);
    await fetchAllUsers();
    await fetchRequests();
    setUpdatingId(null);
  };

  const handleRejectRequest = async (reqId: string) => {
    setUpdatingId(reqId);
    await supabase
      .from('role_requests')
      .update({ status: 'REJECTED' })
      .eq('id', reqId);

    alert('Solicitação recusada.');
    await fetchRequests();
    setUpdatingId(null);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`Cargo alterado para: ${newRole}`);
    } else {
      alert('Erro ao alterar cargo: ' + error.message);
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-24 relative overflow-hidden">
      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* HEADER */}
        <header className="bg-gradient-to-r from-amber-950/80 via-[#171310] to-[#0b0907] border border-amber-500/40 rounded-2xl p-4 shadow-xl text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl font-black italic tracking-wider text-amber-400 uppercase">
              PAINEL ADM
            </h1>
          </div>
          <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            GESTOR DA COMUNIDADE
          </p>
        </header>

        {/* FILA DE REVISÃO DE PRINTS DE WL */}
        {pendingProofs.length > 0 && (
          <section className="bg-gradient-to-b from-amber-950/80 via-[#171310] to-[#0b0907] border-2 border-amber-400 p-4 rounded-2xl space-y-3 shadow-[0_0_25px_rgba(251,191,36,0.3)]">
            <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
              <span className="animate-pulse text-lg">📸</span>
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                PRINTS PENDENTES DE VERIFICAÇÃO ({pendingProofs.length})
              </h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {pendingProofs.map((item) => (
                <div key={item.id} className="bg-[#0a0807] border border-amber-500/30 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{item.profiles?.full_name} (@{item.profiles?.username})</span>
                    <span className="text-amber-400 font-black">{item.goals_for}W - {item.goals_against}L</span>
                  </div>

                  <a href={item.proof_image_url} target="_blank" rel="noreferrer" className="block relative group">
                    <img 
                      src={item.proof_image_url} 
                      alt="Print do Console" 
                      className="w-full h-36 object-cover rounded-lg border border-amber-500/40"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-black px-2 py-1 rounded">
                      🔍 CLIQUE PARA AMPLIAR
                    </span>
                  </a>

                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => handleApproveWLProof(item.id)}
                      className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-lg shadow cursor-pointer transition"
                    >
                      ✓ APROVAR WL
                    </button>
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => handleRejectWLProof(item.id)}
                      className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase rounded-lg shadow cursor-pointer transition"
                    >
                      ✕ RECUSAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SOLICITAÇÕES DE CARGO */}
        {requests.length > 0 && (
          <section className="bg-[#120f0d] border border-amber-500/40 p-4 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
              <span className="text-base">📩</span>
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                PEDIDOS DE CARGO ({requests.length})
              </h2>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto scrollbar-thin">
              {requests.map((req) => (
                <div key={req.id} className="bg-[#0a0807] border border-amber-500/30 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{req.profiles?.full_name}</span>
                    <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 uppercase">
                      {req.requested_role}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800 italic">
                    "{req.reason}"
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={updatingId === req.id}
                      onClick={() => handleApproveRequest(req)}
                      className="w-1/2 py-1.5 bg-emerald-600 text-white font-black text-[10px] uppercase rounded cursor-pointer"
                    >
                      ✓ APROVAR
                    </button>
                    <button
                      disabled={updatingId === req.id}
                      onClick={() => handleRejectRequest(req.id)}
                      className="w-1/2 py-1.5 bg-rose-600 text-white font-black text-[10px] uppercase rounded cursor-pointer"
                    >
                      ✕ RECUSAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CAMPO DE BUSCA */}
        <div className="bg-[#120f0d] border border-amber-500/20 rounded-xl p-3 shadow-md">
          <input 
            type="text"
            placeholder="🔍 Buscar por nome, username ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0807] border border-amber-500/30 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
          />
        </div>

        {/* LISTA DE USUÁRIOS */}
        <section className="space-y-2">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest px-1">
            Membros Cadastrados ({filteredUsers.length})
          </h2>

          <div className="space-y-2.5 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
            {filteredUsers.map((u) => (
              <div 
                key={u.id}
                className="bg-gradient-to-r from-[#171310]/95 to-[#0b0907]/95 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between shadow-md gap-3"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img 
                    src={u.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
                    alt="User"
                    className="w-9 h-9 rounded-full border border-amber-400 object-cover flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-white truncate">{u.full_name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold truncate">@{u.username || 'sem_nick'}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <select
                    value={u.role?.toUpperCase() || 'USER'}
                    disabled={updatingId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-[#0a0807] border border-amber-500/40 text-amber-300 font-black text-[10px] rounded-lg p-1.5 focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="USER">⚽ USER</option>
                    <option value="STREAMER">🔴 STREAMER</option>
                    <option value="COACH">👨‍🏫 COACH</option>
                    <option value="PRO">🎮 PRO PLAYER</option>
                    <option value="ADMIN_02">🛡️ ADM 02</option>
                    <option value="ADMIN_01">👑 ADM 01</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}