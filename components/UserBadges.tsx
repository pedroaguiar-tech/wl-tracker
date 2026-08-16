'use client';

interface BadgeProps {
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  isVerified?: boolean;
  role?: string;
}

export default function UserBadges({
  wins,
  losses,
  goalsFor,
  goalsAgainst,
  isVerified = false,
  role = 'USER',
}: BadgeProps) {
  const badges = [];

  // Badges por Performance
  if (wins >= 15 && losses === 0) {
    badges.push({
      id: 'invincible',
      title: '15-0 INVICTO',
      desc: 'Campanha Perfeita na WL',
      icon: '👑',
      border: 'border-amber-400',
      bg: 'from-amber-500/20 to-yellow-600/10',
      textColor: 'text-amber-300',
    });
  } else if (wins >= 11) {
    badges.push({
      id: 'rank_elite',
      title: 'RANK ELITE (11+W)',
      desc: 'Dominou a Weekend League',
      icon: '⚡',
      border: 'border-emerald-500/50',
      bg: 'from-emerald-500/20 to-teal-600/10',
      textColor: 'text-emerald-400',
    });
  }

  if (goalsFor >= 30) {
    badges.push({
      id: 'top_scorer',
      title: 'ATAQUE AVASSALADOR',
      desc: '+30 Gols marcados na WL',
      icon: '⚽',
      border: 'border-rose-500/50',
      bg: 'from-rose-500/20 to-red-600/10',
      textColor: 'text-rose-400',
    });
  }

  if (goalsAgainst <= 15 && (wins + losses) >= 10) {
    badges.push({
      id: 'wall',
      title: 'PAREDÃO',
      desc: 'Menos de 15 gols sofridos',
      icon: '🧱',
      border: 'border-amber-600/50',
      bg: 'from-amber-700/20 to-orange-800/10',
      textColor: 'text-amber-400',
    });
  }

  if (isVerified) {
    badges.push({
      id: 'verified',
      title: 'WL VERIFICADA',
      desc: 'Comprovante Aprovado pelo ADM',
      icon: '✓',
      border: 'border-amber-400',
      bg: 'from-amber-400/30 to-amber-600/10',
      textColor: 'text-amber-300',
    });
  }

  if (badges.length === 0) {
    return (
      <div className="text-[10px] text-zinc-500 font-bold italic py-1">
        Nenhuma insígnia desbloqueada ainda. Jogue a WL para ganhar conquistas!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
        <span>🎖️</span> INSÍGNIAS E CONQUISTAS ({badges.length})
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`bg-gradient-to-r ${b.bg} border ${b.border} rounded-xl p-2 flex items-center gap-2 shadow-md`}
          >
            <span className="text-xl flex-shrink-0">{b.icon}</span>
            <div className="overflow-hidden">
              <p className={`text-[10px] font-black ${b.textColor} uppercase truncate`}>
                {b.title}
              </p>
              <p className="text-[8px] text-zinc-400 font-medium truncate">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}