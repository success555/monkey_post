import { ArcadeGame } from '../types/arcade';

/**
 * =======================================================================
 * NAIJA STREET ARCADE - MASTER GAMES REGISTRY
 * =======================================================================
 * To add a new game to this hub:
 * 1. Add your game entry to the ARCADE_GAMES array below.
 * 2. Set `status: 'playable'` when ready (or 'coming_soon' / 'in_development').
 * 3. In `src/App.tsx`, import your game's component and render it when:
 *      activeGameId === 'your_game_id'
 * =======================================================================
 */

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'monkey_post',
    title: 'Monkey Post 3D',
    tagline: 'Authentic African Street Football with Tiny Goal Posts',
    category: 'Sports',
    status: 'playable',
    players: '1 - 2 Players (Local & Online)',
    difficulty: 'Competitive',
    badge: 'PLAYABLE NOW',
    badgeColor: 'bg-emerald-500 text-black shadow-emerald-500/50',
    iconEmoji: '⚽',
    bannerGradient: 'from-amber-500/30 via-emerald-600/30 to-black',
    accentColor: '#facc15',
    description: 'Fast-paced street football featuring authentic 3D player models, asphalt tarmac, slide tackles, curve shots, and legendary neighborhood derbies (Ojuelegba, Mitchells Plain, Enerhen, Hausa Quarters).',
    features: [
      '3D Rigged African Footballers with Sprint & Tackle Animations',
      'Asphalt Pitch with Painted Africa Map & Street Graffiti',
      'Exhibition, Warri Street League, Penalties & Online 1v1',
      'Authentic Warri Pidgin Live Commentary & Vuvuzela Cheers',
      'Responsive Mobile Landscape Virtual Joystick & Buttons'
    ],
    controlsSummary: 'Virtual Joystick + SPRINT, PASS, SHOOT / SLIDE TACKLE, SWAP',
    actionLabel: 'PLAY MONKEY POST'
  },
  {
    id: 'ayo_olopon',
    title: 'Ayò Olọ́pọ́n 3D',
    tagline: 'Ancient Yoruba 12-Pit Seed Sowing Strategy',
    category: 'Strategy',
    status: 'playable',
    players: '1 - 2 Players',
    difficulty: 'Competitive',
    badge: 'PLAYABLE NOW',
    badgeColor: 'bg-emerald-500 text-black shadow-emerald-500/50',
    iconEmoji: '🪵',
    bannerGradient: 'from-amber-700/30 via-orange-800/30 to-black',
    accentColor: '#ea580c',
    description: 'The royal board game of West Africa. Sower pits, tactical seed hoarding, and lightning captures played on carved iroko wood boards against master street elders.',
    features: [
      '3D Carved Iroko Wood Board with 12 Pits & 48 Organic Seeds',
      'Authentic Yoruba Rules: Anti-Clockwise Sowing & Backward Chain Captures',
      'Anti-Starvation Odu Law Enforcement',
      'Elder Baale AI with 3 Difficulty Tiers (Rookie, Trader, Baale)',
      'Pass & Play Local 2-Player Matchups with Procedural Audio'
    ],
    controlsSummary: 'Click/Touch glowing pit on your side to sow counter-clockwise',
    actionLabel: 'PLAY AYÒ NOW'
  },
  {
    id: 'naija_whot',
    title: 'Naija Whot! Card Game',
    tagline: 'The Undisputed National Card Game of Nigeria',
    category: 'Cards',
    status: 'playable',
    players: '1 - 2 Players',
    difficulty: 'Competitive',
    badge: 'PLAYABLE NOW',
    badgeColor: 'bg-emerald-500 text-black shadow-emerald-500/50',
    iconEmoji: '🃏',
    bannerGradient: 'from-emerald-700/30 via-yellow-600/30 to-black',
    accentColor: '#10b981',
    description: "Play Nigeria's favorite card game with authentic rules: Hold On, Pick Two, Pick Three, Suspension, General Market, and the wild WHOT 20 against master street card player Bros Chidi.",
    features: [
      '54 Authentic Nigerian Whot Cards across 5 Suits + Whot 20',
      'Real Special Actions: Hold On (1), Pick 2 (2), Pick 3 (5), Suspension (8), General Market (14)',
      'Smart AI Opponent Bros Chidi with Pidgin Commentary',
      'Card Slap, Market Slide & Victory Audio FX',
      'Interactive Shape Caller Modal & Last Card Warnings'
    ],
    controlsSummary: 'Tap card in hand to play, tap Market pile to draw',
    actionLabel: 'PLAY WHOT NOW'
  },
  {
    id: 'ten_ten',
    title: 'Ten-Ten Rhythm Duel',
    tagline: 'High-Speed Rhythm Clapping & Leg Sync Battle',
    category: 'Rhythm',
    status: 'playable',
    players: '1 - 2 Players (Local & AI)',
    difficulty: 'Competitive',
    badge: 'PLAYABLE NOW',
    badgeColor: 'bg-emerald-500 text-black shadow-emerald-500/50',
    iconEmoji: '👏',
    bannerGradient: 'from-cyan-500/30 via-blue-700/30 to-black',
    accentColor: '#06b6d4',
    description: 'The infectious African playground rhythm duel where two players clap on beat and mirror or avoid each other’s stepping feet to rack up combo streaks.',
    features: [
      '4-Beat Afrobeat Handclap & Foot Stomp Rhythm Engine',
      'Two-Player Local Pass-and-Play Duel on One Screen',
      'Smart AI Opponent Aisha with Easy (96 BPM), Medium (120 BPM), and Hard (146 BPM) Tiers',
      'Authentic Caller Scoring, Leg Clashes & Combo Multiplier Streaks',
      'Zero Asset Dependencies with Procedural Web Audio Synthesis'
    ],
    controlsSummary: 'Tap Left or Right foot on Beat 4 (Keys A/D for P1, Arrows for P2)',
    actionLabel: 'PLAY TEN-TEN NOW'
  },
  {
    id: 'naija_ludo_3d',
    title: 'Naija Ludo 3D',
    tagline: 'The Ultimate African Street Board Game Duel',
    category: 'Strategy',
    status: 'playable',
    players: '1 - 2 Players (Local & AI)',
    difficulty: 'Competitive',
    badge: 'PLAYABLE NOW',
    badgeColor: 'bg-emerald-500 text-black shadow-emerald-500/50',
    iconEmoji: '🎲',
    bannerGradient: 'from-amber-600/30 via-red-700/30 to-black',
    accentColor: '#f59e0b',
    description: 'The beloved West African board game with physical 3D wooden pawns, rolling dice physics, authentic Six-to-open rules, Kpafuka chop captures, and tactical AI opponent Bros Emeka.',
    features: [
      '3D Hardwood Board with 4 Acrylic Quadrants & Safe Stars',
      'Physics-Driven Tumbling 3D Dice with Smooth Token Hops',
      'Two-Player Local Pass-and-Play & Smart AI Opponent Bros Emeka',
      'Authentic Rules: Roll 6 to Open, Kpafuka Chop Captures & House Runs',
      'Procedural Sound Effects: Dice Shakes, Clatters, Hops & Kpafuka Hits'
    ],
    controlsSummary: 'Tap Roll Dice (or Spacebar), tap glowing pawn to move',
    actionLabel: 'PLAY LUDO NOW'
  },
  {
    id: 'kankere_table_tennis',
    title: 'Kankere Street Ping Pong',
    tagline: 'Bare-Knuckle Concrete Block Table Tennis',
    category: 'Sports',
    status: 'coming_soon',
    players: '1 - 2 Players',
    difficulty: 'Competitive',
    badge: 'PLANNED',
    badgeColor: 'bg-teal-500 text-black shadow-teal-500/50',
    iconEmoji: '🏓',
    bannerGradient: 'from-emerald-500/30 via-teal-700/30 to-black',
    accentColor: '#10b981',
    description: 'Concrete block tables, wooden planks for nets, cracked celluloid balls, and wicked spin shots under the neighborhood floodlights.',
    features: [
      'Rigid Concrete Bounce Physics & Street Paddles',
      'High-Speed Topspin, Backspin & Slices',
      'Deuce Thrillers to 11 Points'
    ],
    controlsSummary: 'Drag paddle to position, flick forward to strike',
    actionLabel: 'EXPLORE PREVIEW'
  }
];

