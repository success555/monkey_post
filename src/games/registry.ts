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
    status: 'coming_soon',
    players: '2 Players',
    difficulty: 'Casual',
    badge: 'IN DEVELOPMENT',
    badgeColor: 'bg-cyan-500 text-black shadow-cyan-500/50',
    iconEmoji: '👏',
    bannerGradient: 'from-cyan-500/30 via-blue-700/30 to-black',
    accentColor: '#06b6d4',
    description: 'The infectious playground rhythm duel where two players clap on beat and mirror or avoid each other’s stepping feet to rack up combo streaks.',
    features: [
      'Authentic Clapping Beats & Street Chants',
      'Rapid Reflex Eye-Foot Coordination',
      'Combo Multiplier Streaks & Fast Duels'
    ],
    controlsSummary: 'Tap left or right foot in rhythm with the beat',
    actionLabel: 'EXPLORE PREVIEW'
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

