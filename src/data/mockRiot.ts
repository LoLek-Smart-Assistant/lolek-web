export type NavItem = {
  label: string
  href: string
}

export type Player = {
  champion: string
  summonerName: string
  currentItems: string[]
  predictedItems: string[]
  level: number
  role: string
  kda: string
  accent: string
}

export type Team = {
  name: string
  side: 'blue' | 'red'
  players: Player[]
}

export type Recommendation = {
  champion: string
  summonerName: string
  nextItems: string[]
  buildPath: string[]
  alternatives: string[]
  reasoning: string[]
  winRateNote: string
}

export type ChatEntry = {
  id: number
  role: 'user' | 'assistant'
  author: string
  message: string
  time: string
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '#' },
  { label: 'Match Assistant', href: '#' },
  { label: 'History', href: '#' },
  { label: 'Settings', href: '#' },
]

const blueTeamPlayers: Player[] = [
  {
    champion: 'Ahri',
    summonerName: 'NeonFox',
    currentItems: ['Luden', 'Sorcerer', 'Amplifying'],
    predictedItems: ['Shadowflame', 'Rabadon'],
    level: 14,
    role: 'Mid',
    kda: '6 / 1 / 4',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    champion: 'Viego',
    summonerName: 'PathingDiff',
    currentItems: ['Trinity', 'Plated', 'Pickaxe'],
    predictedItems: ['Sterak', 'GA'],
    level: 13,
    role: 'Jungle',
    kda: '3 / 2 / 7',
    accent: 'from-emerald-400 to-cyan-500',
  },
  {
    champion: 'Jinx',
    summonerName: 'ArcLight',
    currentItems: ['Kraken', 'Berserker', 'Cloak'],
    predictedItems: ['IE', 'RFC'],
    level: 13,
    role: 'ADC',
    kda: '5 / 2 / 6',
    accent: 'from-fuchsia-400 to-violet-500',
  },
  {
    champion: 'Thresh',
    summonerName: 'HookTheory',
    currentItems: ['Locket', 'Mercury', 'Ruby'],
    predictedItems: ['Redemption', 'Knight Vow'],
    level: 11,
    role: 'Support',
    kda: '1 / 3 / 11',
    accent: 'from-teal-400 to-emerald-500',
  },
  {
    champion: 'Ornn',
    summonerName: 'ForgeFront',
    currentItems: ['Sunfire', 'Tabi', 'Chain Vest'],
    predictedItems: ['JakSho', 'Thornmail'],
    level: 14,
    role: 'Top',
    kda: '2 / 2 / 5',
    accent: 'from-amber-400 to-orange-500',
  },
]

const redTeamPlayers: Player[] = [
  {
    champion: 'Zed',
    summonerName: 'ShadowCut',
    currentItems: ['Youmuu', 'Ionian', 'Serrated'],
    predictedItems: ['Edge Night', 'Serylda'],
    level: 14,
    role: 'Mid',
    kda: '7 / 3 / 2',
    accent: 'from-rose-500 to-red-500',
  },
  {
    champion: 'Lee Sin',
    summonerName: 'WardHop',
    currentItems: ['Eclipse', 'Mercury', 'Caulfield'],
    predictedItems: ['Black Cleaver', 'Maw'],
    level: 13,
    role: 'Jungle',
    kda: '4 / 4 / 5',
    accent: 'from-orange-400 to-rose-500',
  },
  {
    champion: 'KaiSa',
    summonerName: 'VoidTempo',
    currentItems: ['Statikk', 'Berserker', 'Pickaxe'],
    predictedItems: ['Guinsoo', 'Nashor'],
    level: 13,
    role: 'ADC',
    kda: '5 / 3 / 4',
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    champion: 'Nautilus',
    summonerName: 'DepthLock',
    currentItems: ['Solstice', 'Mobility', 'Cloth'],
    predictedItems: ['Zeke', 'Locket'],
    level: 11,
    role: 'Support',
    kda: '0 / 5 / 9',
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    champion: 'Renekton',
    summonerName: 'LaneTyrant',
    currentItems: ['Stridebreaker', 'Steelcaps', 'Hexdrinker'],
    predictedItems: ['Deaths Dance', 'Shojin'],
    level: 14,
    role: 'Top',
    kda: '3 / 4 / 3',
    accent: 'from-yellow-400 to-orange-500',
  },
]

export const teams: Team[] = [
  { name: 'Blue Team', side: 'blue', players: blueTeamPlayers },
  { name: 'Red Team', side: 'red', players: redTeamPlayers },
]

export const recommendation: Recommendation = {
  champion: 'Ahri',
  summonerName: 'NeonFox',
  nextItems: ['Shadowflame', 'Rabadon', 'Banshee Veil'],
  buildPath: [
    'Luden Companion',
    'Sorcerer Shoes',
    'Shadowflame',
    'Rabadon Deathcap',
    'Void Staff',
    'Banshee Veil',
  ],
  alternatives: ['Zhonya Hourglass vs Zed burst', 'Morellonomicon vs heavy healing'],
  reasoning: [
    'Enemy backline is squishy, so flat magic penetration gives the highest immediate spike.',
    'Zed is the main threat, which makes Banshee or Zhonya the safest fourth-slot pivot.',
    'Your team has reliable engage, so higher burst value beats a slower utility path right now.',
  ],
  winRateNote: '+8.4% projected teamfight win chance if Shadowflame is completed next',
}

export const liveMatch = {
  isInGame: true,
  mode: 'Ranked Solo / Duo',
  duration: '23:48',
  region: 'EUW',
}

export const initialChat: ChatEntry[] = [
  {
    id: 1,
    role: 'assistant',
    author: 'LoL AI',
    message:
      'You are ahead on tempo. Finish Shadowflame before the next dragon fight for the strongest two-item spike.',
    time: '19:41',
  },
  {
    id: 2,
    role: 'user',
    author: 'You',
    message: 'Should I buy defensive stats now or greed for damage?',
    time: '19:42',
  },
  {
    id: 3,
    role: 'assistant',
    author: 'LoL AI',
    message:
      'Stay on damage for one more purchase. Zed only threatens if he finds flank vision, so you can pivot defensive on slot four.',
    time: '19:42',
  },
]
