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
    id: 'suwe_hopscotch',
    title: 'Suwé Street Grid',
    tagline: 'Chalk Box Hopping & House Claiming Battle',
    category: 'Arcade',
    status: 'coming_soon',
    players: '1 - 4 Players',
    difficulty: 'Casual',
    badge: 'IN DEVELOPMENT',
    badgeColor: 'bg-fuchsia-500 text-white shadow-fuchsia-500/50',
    iconEmoji: '👟',
    bannerGradient: 'from-fuchsia-600/30 via-purple-800/30 to-black',
    accentColor: '#d946ef',
    description: 'Toss your smooth stone into the chalk grid, balance on one leg, leap across zones without touching chalk lines, and build your house on the neighborhood street.',
    features: [
      'Authentic Street Chalk Grid Physics & Stone Toss',
      'One-Leg Balance Meter & Quick Reflex Reactions',
      'Neighborhood Turf Claiming Mode'
    ],
    controlsSummary: 'Swipe to aim stone toss, tap rhythm to hop & turn',
    actionLabel: 'EXPLORE PREVIEW'
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

