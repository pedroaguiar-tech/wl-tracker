'use client';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#070507] text-amber-50 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* 1. FUNDO FUSÃO (MSN VS BBC) - LIMPO & NÍTIDO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/bg-login.png" 
          alt="MSN vs BBC Background" 
          className="w-full h-full object-cover object-center opacity-65 filter contrast-105 saturate-[1.1]"
        />
      </div>

      {/* 2. GRADIENTE DE ESCURECIMENTO SUAVE (SEM PONTOS) */}
      <div className="fixed inset-0 opacity-50 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0709]/60 to-[#040305] z-0" />

      {/* 3. CARD DE LOGIN */}
      <div className="relative z-10 w-full max-w-sm bg-gradient-to-b from-[#1c1611]/95 to-[#0b0806]/95 border-2 border-amber-500/60 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(217,119,6,0.3)] backdrop-blur-md space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="text-amber-400 text-3xl font-black italic tracking-tighter">WL</span>
            <h1 className="text-3xl font-black italic tracking-wider text-white uppercase">TRACKER</h1>
          </div>
          <p className="text-[10px] tracking-[0.35em] font-black text-amber-500 uppercase">
            EA FC ULTIMATE TEAM
          </p>
        </div>

        <p className="text-sm text-gray-300 font-medium tracking-tight">
          Sua central de estatísticas da Weekend League.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 rounded-xl font-black text-black text-sm tracking-widest uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-200 border border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
            <path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
            <path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
            <path fill="#1565c0" d="M43.611,20.083L43.595,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
          </svg>
          <span>ENTRAR COM O GOOGLE</span>
        </button>
      </div>
    </main>
  );
}