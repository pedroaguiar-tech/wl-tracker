'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0807]/95 border-t border-amber-500/30 backdrop-blur-md z-40">
      <div className="max-w-md mx-auto flex justify-around items-center py-2.5 px-4">
        
        {/* ABA MINHA WL */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 transition ${
            pathname === '/' ? 'text-amber-400 font-black scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xl">⚽</span>
          <span className="text-[10px] uppercase tracking-wider">Minha WL</span>
        </Link>

        {/* ABA FEED SOCIAL */}
        <Link
          href="/feed"
          className={`flex flex-col items-center gap-1 transition ${
            pathname === '/feed' ? 'text-amber-400 font-black scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xl">📸</span>
          <span className="text-[10px] uppercase tracking-wider">Feed Social</span>
        </Link>

      </div>
    </nav>
  );
}