import { TeamInfo } from '../types/game';

export const PITCH_LENGTH = 36; // meters (X axis from -18 to +18)
export const PITCH_WIDTH = 22;  // meters (Z axis from -11 to +11)
export const WALL_HEIGHT = 2.4; // meters
export const GOAL_WIDTH = 2.4;  // Street court goal width matching reference photo (2.4m / 8ft)
export const GOAL_HEIGHT = 1.35; // Street court goal height (~4.4 ft)
export const GOAL_DEPTH = 1.0;   // Street court goal depth
export const BALL_RADIUS = 0.22;
export const PLAYER_RADIUS = 0.45;
export const PLAYER_HEIGHT = 1.78;

// Physics tuning
export const GRAVITY = 18.0;
export const AIR_DRAG = 0.985;
export const GROUND_FRICTION = 0.965;
export const BALL_RESTITUTION = 0.72; // bounce factor
export const WALL_BOUNCE = 0.75;
export const MAX_BALL_SPEED = 28.0;
export const DRIBBLE_OFFSET = 0.65;
export const DRIBBLE_TETHER_RADIUS = 0.85;

// Base Movement tuning (modified by team stats)
export const BASE_SPEED = 5.6;
export const SPRINT_SPEED = 8.6;
export const DRIBBLE_SPEED_FACTOR = 0.88;
export const STAMINA_DRAIN_RATE = 28; // per second sprinting
export const STAMINA_RECOVERY_RATE = 18; // per second jogging
export const TACKLE_DISTANCE = 1.35;
export const TACKLE_COOLDOWN = 1.2; // seconds

// Featured Teams from Screenshot & Neighborhood Rosters
export const TEAMS: TeamInfo[] = [
  {
    id: 'ojuelegba',
    name: 'OJUELEGBA',
    nickname: 'Surulere Lions',
    district: 'Lagos Mainland',
    shortName: 'OJU',
    primaryColor: '#facc15', // Vibrant Sunny Yellow Jersey
    secondaryColor: '#15803d', // Forest Green Shorts
    accentColor: '#22c55e', // Neon Green Cleats & Socks
    kitStyle: 'stripes',
    playstyle: 'High Energy Pressing & Direct Street Attacking',
    playstyleDescription: 'Iconic yellow & green street squad powered by fast wing play and aggressive pressing.',
    stats: {
      speed: 1.2,
      stamina: 1.25,
      tacklePower: 1.2,
      dribble: 1.2,
      passing: 1.15,
      shooting: 1.25
    }
  },
  {
    id: 'mitchells_plain',
    name: 'MITCHELLS PLAIN',
    nickname: 'Cape Flats Ballers',
    district: 'Mitchells Plain',
    shortName: 'MIT',
    primaryColor: '#2563eb', // Royal Blue Jersey
    secondaryColor: '#ec4899', // Vibrant Hot Pink Shorts
    accentColor: '#ec4899', // Hot Pink Trim & Socks
    kitStyle: 'solid',
    playstyle: 'Technical Tiki-Taka & Skillful Small-Sided Play',
    playstyleDescription: 'Flashy electric blue and pink kits with pinpoint passing and sharp shooting.',
    stats: {
      speed: 1.15,
      stamina: 1.15,
      tacklePower: 1.1,
      dribble: 1.3,
      passing: 1.35,
      shooting: 1.2
    }
  },
  {
    id: 'enerhen_junction',
    name: 'Enerhen Junction FC',
    nickname: 'Enerhen Hardmen',
    district: 'Enerhen / Effurun',
    shortName: 'ENH',
    primaryColor: '#ea580c', // Fiery Industrial Orange
    secondaryColor: '#18181b', // Tar Black
    accentColor: '#facc15',
    kitStyle: 'stripes',
    playstyle: 'Aggressive Pressing & Hard Tackling',
    playstyleDescription: 'Unstoppable engine with massive stamina and bone-crunching slide tackles.',
    stats: {
      speed: 1.05,
      stamina: 1.45,
      tacklePower: 1.5,
      dribble: 0.95,
      passing: 1.0,
      shooting: 1.05
    }
  },
  {
    id: 'hausa_quarters',
    name: 'Hausa Quarters FC',
    nickname: 'Quarters Tiki-Taka',
    district: 'Warri Central',
    shortName: 'HQW',
    primaryColor: '#15803d', // Nigerian Emerald Green
    secondaryColor: '#ffffff', // Crisp White
    accentColor: '#86efac',
    kitStyle: 'stripes',
    playstyle: 'Technical Tiki-Taka & Tight Passing',
    playstyleDescription: 'Master of possession with pinpoint short passes and tight close-control.',
    stats: {
      speed: 1.0,
      stamina: 1.1,
      tacklePower: 0.95,
      dribble: 1.25,
      passing: 1.45,
      shooting: 1.1
    }
  },
  {
    id: 'deco_road',
    name: 'Deco Road All-Stars',
    nickname: 'Deco Disciplinarians',
    district: 'Deco Road / Okumagba',
    shortName: 'DEC',
    primaryColor: '#2563eb', // Royal Blue
    secondaryColor: '#ffffff', // White
    accentColor: '#38bdf8',
    kitStyle: 'solid',
    playstyle: 'Balanced All-Rounders & Tactical Spacing',
    playstyleDescription: 'Disciplined positioning with solid balance in defense, transition, and attack.',
    stats: {
      speed: 1.1,
      stamina: 1.15,
      tacklePower: 1.15,
      dribble: 1.1,
      passing: 1.15,
      shooting: 1.15
    }
  },
  {
    id: 'jakpa_airport',
    name: 'Jakpa / Airport Road FC',
    nickname: 'Airport Express',
    district: 'Effurun / Airport Road',
    shortName: 'JKP',
    primaryColor: '#e11d48', // High-Speed Crimson Red
    secondaryColor: '#fbbf24', // Speed Yellow
    accentColor: '#ffffff',
    kitStyle: 'sleeves',
    playstyle: 'Blistering Counter-Attack Pace',
    playstyleDescription: 'Lightning fast counter-attacks that leave defenders completely in the dust.',
    stats: {
      speed: 1.4,
      stamina: 1.15,
      tacklePower: 1.0,
      dribble: 1.15,
      passing: 1.1,
      shooting: 1.1
    }
  },
  {
    id: 'pessu_riverine',
    name: 'Pessu Waterside FC',
    nickname: 'Riverine Tricksters',
    district: 'Pessu Market / Waterside',
    shortName: 'PSU',
    primaryColor: '#0d9488', // Waterside Cyan/Teal
    secondaryColor: '#fde047', // Gold
    accentColor: '#042f2e',
    kitStyle: 'stripes',
    playstyle: 'Crafty Street Dribblers & Tricksters',
    playstyleDescription: 'Small-sided nutmeg specialists equipped with flashy feints and ankle breakers.',
    stats: {
      speed: 1.15,
      stamina: 1.05,
      tacklePower: 0.95,
      dribble: 1.45,
      passing: 1.2,
      shooting: 1.15
    }
  },
  {
    id: 'gra_shell',
    name: 'GRA / Shell Compound Elite',
    nickname: 'The Oil City Powerhouse',
    district: 'GRA / Shell Residential Area',
    shortName: 'GRA',
    primaryColor: '#0f172a', // Pristine Midnight Navy
    secondaryColor: '#f8fafc', // Pristine Crisp White
    accentColor: '#fbbf24', // 24k Gold Cleats & Trim
    kitStyle: 'pristine',
    isBoss: true,
    playstyle: 'Boss Powerhouse • Elite Stats Across the Board',
    playstyleDescription: 'The ultimate boss team with pristine matching luxury kits, golden cleats, and maxed stats.',
    stats: {
      speed: 1.35,
      stamina: 1.4,
      tacklePower: 1.35,
      dribble: 1.35,
      passing: 1.35,
      shooting: 1.4
    }
  }
];

// Punchy Naija & Warri Commentary Slangs
export const WARRI_COMMENTARY = {
  goals: [
    "Who send you?!",
    "Goal dey!",
    "Gbege don burst!",
    "Who send you this kind thunder shot?!",
    "Goal dey! Enerhen to Ojuelegba, dem hear the net sound!",
    "Gbege don burst! Wetin this boy just play?!"
  ],
  tackles: [
    "No dey fall hand!",
    "Clear am!",
    "Wetin be dat?!",
    "Bros, no dey fall hand for here!",
    "Clear am sharp sharp! Street ball no be child play!"
  ],
  nutmegs: [
    "See am pass him leg!",
    "He don sell am market!",
    "Ole! Straight through him legs!",
    "Chai! He don open market between your two legs!"
  ],
  misses: [
    "Dis one na over bar o!",
    "You wan shoot bird?",
    "Dis one na over bar! Which kind shot be dat?!",
    "You wan shoot bird for sky?! Calm down bros!",
    "Chai! Goal post save am!"
  ],
  kickoff: [
    "Ref blow whistle! Game on!",
    "Money on the line! Winner stays on!",
    "Street rules: no offside, pure street tekkers!"
  ]
};
