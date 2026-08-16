export interface RoleOption {
  id: string;
  name: string;
  positions: string[];
  focuses: string[];
  description: string;
}

export const PLAYER_ROLES: RoleOption[] = [
  // GOLEIRO
  { id: 'gk_trad', name: 'Goalkeeper', positions: ['GK'], focuses: ['Defend'], description: 'Focado na linha de gol e chutes de longe.' },
  { id: 'gk_sweeper', name: 'Sweeper Keeper', positions: ['GK'], focuses: ['Balanced'], description: 'Sai da área para interceptar bolas longas e participa do passe curto.' },

  // ZAGUEIROS
  { id: 'cb_defender', name: 'Defender', positions: ['CB'], focuses: ['Defend'], description: 'Zagueiro clássico. Mantém a linha e foca em desarmes.' },
  { id: 'cb_stopper', name: 'Stopper', positions: ['CB'], focuses: ['Balanced'], description: 'Caçador. Sai da linha para antecipar o atacante.' },
  { id: 'cb_ballplaying', name: 'Ball-Playing Defender', positions: ['CB'], focuses: ['Defend', 'Build-Up'], description: 'Construtor. Avança com a bola e busca quebrar linhas.' },

  // LATERAIS
  { id: 'lb_fullback', name: 'Fullback', positions: ['LB', 'RB'], focuses: ['Defend', 'Balanced'], description: 'Prioriza a marcação lateral.' },
  { id: 'lb_wingback', name: 'Wingback', positions: ['LB', 'RB'], focuses: ['Balanced', 'Attack'], description: 'Ala tradicional. Corre a linha para cruzar.' },
  { id: 'lb_falseback', name: 'False Back', positions: ['LB', 'RB'], focuses: ['Defend', 'Balanced'], description: 'Lateral invertido. Entra no meio-campo como volante com a bola.' },

  // VOLANTES / MEIOS
  { id: 'cdm_holding', name: 'Holding', positions: ['CDM', 'CM'], focuses: ['Defend'], description: 'Protege a zaga central e preserva a posição.' },
  { id: 'cdm_centrehalf', name: 'Centre-Half', positions: ['CDM'], focuses: ['Defend'], description: 'Baixa entre os zagueiros para formar linha de 3 na saída.' },
  { id: 'cm_boxtobox', name: 'Box-to-Box', positions: ['CM'], focuses: ['Balanced', 'Attack'], description: 'Atua de área a área com alto fôlego.' },
  { id: 'cm_playmaker', name: 'Playmaker', positions: ['CM', 'CAM'], focuses: ['Balanced', 'Roam'], description: 'Ponto focal de criação e passes decisivos.' },
  { id: 'cam_shadow', name: 'Shadow Striker', positions: ['CAM'], focuses: ['Attack'], description: 'Segundo atacante. Infiltra-se ultrapassando o centroavante.' },

  // PONTAS
  { id: 'winger', name: 'Winger', positions: ['LW', 'RW', 'LM', 'RM'], focuses: ['Balanced', 'Attack'], description: 'Aberto na ponta buscando linha de fundo.' },
  { id: 'inside_forward', name: 'Inside Forward', positions: ['LW', 'RW'], focuses: ['Attack', 'Roam'], description: 'Corta da ponta para o centro para finalizar.' },

  // ATACANTES
  { id: 'st_advanced', name: 'Advanced Forward', positions: ['ST'], focuses: ['Attack'], description: 'Ataca a profundidade na zaga adversária.' },
  { id: 'st_target', name: 'Target Forward', positions: ['ST'], focuses: ['Balanced'], description: 'Pivô de referência física de costas para o gol.' },
  { id: 'st_false9', name: 'False 9', positions: ['ST'], focuses: ['Build-Up', 'Balanced'], description: 'Recua para o meio puxando a zaga.' },
];

export const TACTICAL_VISIONS = [
  'Standard',
  'Possession (Tiki-Taka)',
  'Wing Play',
  'Counter Attack',
  'Gegenpressing',
  'Park The Bus',
  'Kick & Rush',
];

export const BUILD_UP_STYLES = ['Balanced', 'Counter', 'Short Passing', 'Long Ball'];
export const DEFENSIVE_APPROACHES = ['Deep (Bloco Baixo)', 'Balanced', 'High Line', 'Aggressive (Pressão Alta)'];