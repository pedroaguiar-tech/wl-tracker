'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('USER');
  const [region, setRegion] = useState('BR');
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setRole(profile.role || 'USER');
      setRegion(profile.region || 'BR');
      setBio(profile.bio || '');
      setWhatsapp(profile.whatsapp || '');
      setInstagram(profile.instagram || '');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const isVip = ['COACH', 'STREAMER', 'PRO', 'ADMIN'].includes(role.toUpperCase());

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      username: username.toLowerCase().trim(),
      region: region,
      bio: bio,
      whatsapp: isVip ? whatsapp : '',
      instagram: isVip ? instagram : '',
      updated_at: new Date().toISOString()
    });

    setSaving(false);
    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    } else {
      alert('Perfil atualizado com sucesso! 🚀');
    }
  };

  const renderRoleBadgeTitle = (userRole: string) => {
    switch (userRole.toUpperCase()) {
      case 'COACH':
        return '👨‍🏫 COACH VERIFICADO';
      case 'STREAMER':
        return '💜 STREAMER PARCEIRO';
      case 'PRO':
        return '⚡ PRO PLAYER';
      case 'ADMIN':
        return '👑 ADMINISTRADOR';
      default:
        return '🎮 JOGADOR (USER)';
    }
  };

  const isVipUser = ['COACH', 'STREAMER', 'PRO', 'ADMIN'].includes(role.toUpperCase());
  const needsToCompleteProfile = isVipUser && (!whatsapp || !instagram);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070507] text-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-28 relative overflow-hidden">
      <div className="relative max-w-md mx-auto px-4 pt-6 space-y-4 z-10">
        
        <header className="bg-[#171310]/90 border border-amber-500/30 rounded-xl p-4 backdrop-blur-md shadow-xl text-center">
          <h1 className="text-xl font-black italic tracking-wider text-white">MEU PERFIL</h1>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Personalize seu Card da Comunidade</p>
        </header>

        {/* NOTIFICAÇÃO DE NOVO CARGO VIP */}
        {needsToCompleteProfile && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-2 border-amber-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Parabéns! Você recebeu o cargo {role}!
              </h3>
            </div>
            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
              Termine de preencher seus dados de contato (WhatsApp e Instagram) abaixo para ativar os botões de mentoria e redes no seu card do Feed.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-[#120f0d]/90 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
          
          {/* CARGO ATUAL */}
          <div className="bg-[#0a0807] border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider">Sua Conta</span>
              <span className="text-xs font-black text-amber-400">{renderRoleBadgeTitle(role)}</span>
            </div>
            {!isVipUser && (
              <span className="text-[9px] text-zinc-400 italic">Selo VIP? Fale com o ADM</span>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Nome Completo / Nick</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="w-full bg-[#0a0807] border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Username (@seunick)</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="ex: pedrao_fifa" 
              className="w-full bg-[#0a0807] border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Região</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-[#0a0807] border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
            >
              <option value="BR">🇧🇷 Brasil</option>
              <option value="EU">🇪🇺 Europa</option>
              <option value="NA">🇺🇸 América do Norte</option>
              <option value="SA">🇦🇷 Sul-América</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Bio / Apresentação</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Ex: Pego Rank 1 direto na WL. Busco novos oponentes pra treinar!" 
              rows={3} 
              className="w-full bg-[#0a0807] border border-amber-500/30 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium resize-none" 
            />
          </div>

          {/* SÓ EXIBE ESTA SEÇÃO SE O USUÁRIO FOR VERIFICADO (COACH, STREAMER OU PRO) */}
          {isVipUser && (
            <div className="border-t border-amber-500/20 pt-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">✨</span>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  Redes de Contato ({role})
                </p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">WhatsApp de Atendimento (DDD + Número)</label>
                <input 
                  type="text" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)} 
                  placeholder="11999999999" 
                  className="w-full bg-[#0a0807] border border-emerald-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Instagram (@usuario)</label>
                <input 
                  type="text" 
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value)} 
                  placeholder="seu.instagram" 
                  className="w-full bg-[#0a0807] border border-purple-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold" 
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black text-xs rounded-xl uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
          </button>

        </form>
      </div>

      <BottomNav />
    </main>
  );
}