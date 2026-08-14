'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

interface Comment {
  id: string;
  content: string;
  profiles: { full_name: string };
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  region: string;
  role?: string;
  username?: string;
  bio?: string;
  whatsapp?: string;
  instagram?: string;
}

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
  comments?: Comment[];
}

export default function Feed() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais e formulários
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  // Chat e mensagens
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    checkUserAndFetchPosts();
  }, []);

  const checkUserAndFetchPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
    await fetchPosts();
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(id, full_name, avatar_url, region, role, username, bio, whatsapp, instagram), comments(id, content, created_at, profiles(full_name))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data as any);
    }
  };

  const renderRoleBadge = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'COACH':
        return (
          <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
            👨‍🏫 COACH
          </span>
        );
      case 'STREAMER':
        return (
          <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/40 uppercase tracking-wider flex items-center gap-1">
            💜 STREAMER
          </span>
        );
      case 'PRO':
        return (
          <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
            ⚡ PRO
          </span>
        );
      default:
        return null;
    }
  };

  const handleOpenChat = async (targetProfile: Profile) => {
    if (targetProfile.id === user.id) return alert("Você não pode abrir chat com você mesmo!");
    setSelectedProfile(null);
    setActiveChatUser(targetProfile);

    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetProfile.id}),and(user1_id.eq.${targetProfile.id},user2_id.eq.${user.id})`)
      .single();

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user1_id: user.id, user2_id: targetProfile.id })
        .select()
        .single();
      conv = newConv;
    }

    if (conv) {
      setConversationId(conv.id);
      fetchMessages(conv.id);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    setChatMessages(data || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim()
    });

    setNewMessage('');
    fetchMessages(conversationId);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Deseja realmente apagar esta publicação?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts();
  };

  const handleEdit = async () => {
    if (!editingPost) return;
    setUploading(true);
    await supabase.from('posts').update({ caption }).eq('id', editingPost.id);
    setShowPostModal(false);
    setEditingPost(null);
    setCaption('');
    setUploading(false);
    fetchPosts();
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: text });
    setCommentInputs({ ...commentInputs, [postId]: '' });
    fetchPosts();
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
    fetchPosts();
  };

  const handleCreatePost = async () => {
    alert("Iniciando envio do post...");
    
    if (!selectedFile || !user) {
      alert('Selecione uma imagem e certifique-se de estar logado!');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, selectedFile);

      if (uploadError) {
        alert("Erro no upload do arquivo: " + uploadError.message);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts-media')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('posts').insert([{
        user_id: user.id,
        image_url: publicUrl,
        caption: caption,
        likes_count: 0
      }]);

      if (insertError) {
        alert("Erro ao gravar post no banco: " + insertError.message);
        throw insertError;
      }

      alert("Post publicado com sucesso!");
      setShowPostModal(false);
      setCaption('');
      setSelectedFile(null);
      fetchPosts();
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploading(false);
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
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans pb-24 relative overflow-hidden">
      
      {/* BACKGROUND DECORATIVO */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src="/bg-hero.png" alt="BG" className="w-full h-full object-cover opacity-40 filter contrast-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0709]/90 via-[#070507]/95 to-[#040305]" />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-4 space-y-4 z-10">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center bg-[#171310]/90 border border-amber-500/30 rounded-xl p-3 backdrop-blur-md shadow-xl">
          <div>
            <h1 className="text-lg font-black italic tracking-wider text-white">COMMUNITY FEED</h1>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Times & Táticas da Galera</p>
          </div>
          <button
            onClick={() => { setEditingPost(null); setCaption(''); setSelectedFile(null); setShowPostModal(true); }}
            className="bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black text-xs px-3 py-2 rounded-lg shadow-lg active:scale-95 transition cursor-pointer"
          >
            + POSTAR TIME
          </button>
        </header>

        {/* FEED DE PUBLICAÇÕES */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-[#120f0d]/80 border border-amber-900/30 rounded-xl text-zinc-500 text-xs font-bold">
              Nenhum time postado ainda. Seja o primeiro a publicar! 🚀
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-[#120f0d]/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                
                {/* TOPO DO POST */}
                <div className="p-3 flex items-center justify-between border-b border-amber-500/10">
                  <div 
                    onClick={() => post.profiles && setSelectedProfile(post.profiles)} 
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
                  >
                    <img src={post.profiles?.avatar_url || '/avatar-placeholder.png'} className="w-8 h-8 rounded-full border border-amber-400 object-cover" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white">{post.profiles?.full_name || 'Jogador'}</span>
                        {renderRoleBadge(post.profiles?.role)}
                        <span className="text-[9px] font-black bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700">
                          {post.profiles?.region || 'BR'}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-500 font-bold">
                        {post.profiles?.username ? `@${post.profiles.username}` : new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {post.user_id === user?.id && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingPost(post); setCaption(post.caption || ''); setShowPostModal(true); }} className="text-amber-400 text-xs bg-amber-500/10 p-1.5 rounded border border-amber-500/30 cursor-pointer">✏️</button>
                      <button onClick={() => handleDelete(post.id)} className="text-rose-500 text-xs bg-rose-500/10 p-1.5 rounded border border-rose-500/30 cursor-pointer">🗑️</button>
                    </div>
                  )}
                </div>

                {/* FOTO DO TIME */}
                <div className="w-full bg-black flex items-center justify-center overflow-hidden max-h-96">
                  <img src={post.image_url} alt="Time" className="w-full h-auto object-cover" />
                </div>

                {/* AÇÕES E CONTEÚDO DO POST */}
                <div className="p-3 space-y-3">
                  <button onClick={() => handleLike(post.id, post.likes_count)} className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-full cursor-pointer">
                    <span>❤️</span> {post.likes_count}
                  </button>

                  {post.caption && <p className="text-xs text-zinc-300 font-medium">{post.caption}</p>}

                  {/* COMENTÁRIOS */}
                  <div className="border-t border-amber-500/15 pt-3 space-y-2">
                    {post.comments?.map((c) => (
                      <div key={c.id} className="text-[11px] bg-[#0a0807]/80 p-2 rounded-lg border border-amber-500/10">
                        <span className="font-black text-amber-400 mr-1.5">{c.profiles?.full_name}:</span>
                        <span className="text-zinc-300 font-medium">{c.content}</span>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="flex-1 bg-[#0a0807] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button onClick={() => handleAddComment(post.id)} className="bg-amber-500 text-black font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer">OK</button>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL PERFIL DO JOGADOR / COACH */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 text-center relative shadow-[0_0_40px_rgba(217,119,6,0.3)]">
            <button onClick={() => setSelectedProfile(null)} className="absolute top-3 right-3 text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>

            <img src={selectedProfile.avatar_url || '/avatar-placeholder.png'} className="w-20 h-20 rounded-full border-2 border-amber-400 mx-auto object-cover" />
            
            <div>
              <h3 className="text-base font-black text-white">{selectedProfile.full_name}</h3>
              {selectedProfile.username && <p className="text-xs font-bold text-amber-500">@{selectedProfile.username}</p>}
              <div className="flex justify-center gap-2 mt-2">
                {renderRoleBadge(selectedProfile.role)}
                <span className="text-[10px] font-black bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">{selectedProfile.region || 'BR'}</span>
              </div>
            </div>

            {selectedProfile.bio && <p className="text-xs text-zinc-300 bg-[#0a0807] p-2.5 rounded-lg border border-amber-500/20">{selectedProfile.bio}</p>}

            {selectedProfile.role?.toUpperCase() === 'COACH' && (
              <div className="space-y-2 pt-2 border-t border-amber-500/20">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Contratar Mentoria / Aulas</p>
                {selectedProfile.whatsapp && (
                  <a href={`https://wa.me/${selectedProfile.whatsapp}`} target="_blank" rel="noreferrer" className="block w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition">
                    📱 Falar no WhatsApp
                  </a>
                )}
              </div>
            )}

            {selectedProfile.id !== user?.id && (
              <button onClick={() => handleOpenChat(selectedProfile)} className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black text-xs rounded-lg uppercase tracking-wider shadow-lg cursor-pointer">
                💬 Mandar Mensagem Direta
              </button>
            )}
          </div>
        </div>
      )}

      {/* JANELA DE BATE-PAPO PRIVADO (DM) */}
      {activeChatUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl h-[500px] flex flex-col shadow-2xl">
            <div className="p-3 border-b border-amber-500/30 flex justify-between items-center bg-[#120f0d]">
              <div className="flex items-center gap-2">
                <img src={activeChatUser.avatar_url} className="w-7 h-7 rounded-full border border-amber-400 object-cover" />
                <span className="text-xs font-black text-white">{activeChatUser.full_name}</span>
              </div>
              <button onClick={() => setActiveChatUser(null)} className="text-zinc-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0a0807]">
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-2 rounded-xl text-xs ${isMe ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-white border border-zinc-700'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-amber-500/30 flex gap-2 bg-[#120f0d]">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-[#0a0807] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-amber-500 text-black font-black text-xs px-4 py-2 rounded-lg cursor-pointer">Enviar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PUBLICAR / EDITAR TIME */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#171411] border-2 border-amber-500/60 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(217,119,6,0.3)]">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {editingPost ? 'EDITAR LEGENDA' : 'PUBLICAR MEU TIME'}
              </h3>
              <button onClick={() => setShowPostModal(false)} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              {!editingPost && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">
                    Foto do Time / Tática
                  </label>
                  <label className="cursor-pointer bg-[#0a0807] border border-amber-500/40 hover:border-amber-400 p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-amber-400 transition">
                    <span>📁</span>
                    <span>{selectedFile ? selectedFile.name : "Escolher arquivo de imagem..."}</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/webp" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Legenda / Dicas Táticas
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex: Joguei na 4-2-3-1, táticas de pressão após perda. Deu muito bom!"
                  rows={3}
                  className="w-full bg-[#0a0807] border border-amber-500/40 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-amber-400 font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="w-1/3 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={editingPost ? handleEdit : handleCreatePost}
                  disabled={uploading}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-black rounded-lg text-xs tracking-wider uppercase shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'ENVIANDO...' : editingPost ? 'SALVAR LEGENDA' : 'PUBLICAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}