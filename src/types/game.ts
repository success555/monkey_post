export type TeamSide = 'home' | 'away';

export interface TeamStatsModifiers {
  speed: number;       // multiplier e.g. 1.0 to 1.3
  stamina: number;     // multiplier e.g. 1.0 to 1.4
  tacklePower: number; // multiplier e.g. 1.0 to 1.5
  dribble: number;     // multiplier e.g. 1.0 to 1.4
  passing: number;     // multiplier e.g. 1.0 to 1.4
  shooting: number;    // multiplier e.g. 1.0 to 1.3
}

export interface PlayerStats {
  speed: number;
  dribble: number;
  shooting: number;
  passing: number;
  defense: number;
  stamina: number;
}

export interface PlayerState {
  id: string;
  name: string;
  number: number;
  team: TeamSide;
  isUserControlled: boolean;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: number; // yaw in radians
  hasBall: boolean;
  stamina: number; // 0 to 100
  isSprinting: boolean;
  isTackling: boolean;
  isKicking: boolean;
  tackleCooldown: number;
  role: 'striker' | 'winger_left' | 'winger_right' | 'midfielder' | 'defender';
  basePosition: { x: number; z: number }; // tactical base position
}

export interface BallState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  ownerId: string | null;
  lastTouchTeam: TeamSide | null;
  lastTouchPlayer: string | null;
}

export type GameMode = 'exhibition' | 'penalties' | 'training' | 'multiplayer';

export type MatchState = 'menu' | 'countdown' | 'playing' | 'goal_scored' | 'halftime' | 'fulltime' | 'penalty_round';

export interface CommentaryMessage {
  id: string;
  text: string;
  type: 'goal' | 'tackle' | 'miss' | 'skill' | 'nutmeg' | 'general';
  timestamp: number;
}

export interface TeamInfo {
  id: string;
  name: string;
  nickname: string;
  district: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  kitStyle: 'solid' | 'stripes' | 'sleeves' | 'pristine';
  shortName: string;
  playstyle: string;
  playstyleDescription: string;
  isBoss?: boolean;
  stats: TeamStatsModifiers;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface CameraMode {
  id: 'broadcast' | 'action' | 'topdown';
  label: string;
}
