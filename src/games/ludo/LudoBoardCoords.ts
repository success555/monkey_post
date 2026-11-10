import { LudoColor } from './types';

export interface GridPos {
  col: number; // 0 to 14
  row: number; // 0 to 14
}

export interface WorldPos {
  x: number;
  y: number;
  z: number;
}

const TILE_SIZE = 0.72;

// Convert 15x15 grid coordinates to 3D world space
export function gridToWorld(col: number, row: number, y = 0.22): WorldPos {
  return {
    x: (col - 7) * TILE_SIZE,
    y,
    z: (row - 7) * TILE_SIZE
  };
}

// 52 Common Track Tile Grid Positions (Starting from Red start tile at col 1, row 6)
export const CIRCUIT_GRID_COORDS: GridPos[] = [
  // Red Track (0..12)
  { col: 1, row: 6 },  // 0: Red Start
  { col: 2, row: 6 },  // 1
  { col: 3, row: 6 },  // 2
  { col: 4, row: 6 },  // 3
  { col: 5, row: 6 },  // 4
  { col: 6, row: 5 },  // 5
  { col: 6, row: 4 },  // 6
  { col: 6, row: 3 },  // 7
  { col: 6, row: 2 },  // 8: Safe Star
  { col: 6, row: 1 },  // 9
  { col: 6, row: 0 },  // 10
  { col: 7, row: 0 },  // 11
  { col: 8, row: 0 },  // 12

  // Green Track (13..25)
  { col: 8, row: 1 },  // 13: Green Start
  { col: 8, row: 2 },  // 14
  { col: 8, row: 3 },  // 15
  { col: 8, row: 4 },  // 16
  { col: 8, row: 5 },  // 17
  { col: 9, row: 6 },  // 18
  { col: 10, row: 6 }, // 19
  { col: 11, row: 6 }, // 20
  { col: 12, row: 6 }, // 21: Safe Star
  { col: 13, row: 6 }, // 22
  { col: 14, row: 6 }, // 23
  { col: 14, row: 7 }, // 24
  { col: 14, row: 8 }, // 25

  // Yellow Track (26..38)
  { col: 13, row: 8 }, // 26: Yellow Start
  { col: 12, row: 8 }, // 27
  { col: 11, row: 8 }, // 28
  { col: 10, row: 8 }, // 29
  { col: 9, row: 8 },  // 30
  { col: 8, row: 9 },  // 31
  { col: 8, row: 10 }, // 32
  { col: 8, row: 11 }, // 33
  { col: 8, row: 12 }, // 34: Safe Star
  { col: 8, row: 13 }, // 35
  { col: 8, row: 14 }, // 36
  { col: 7, row: 14 }, // 37
  { col: 6, row: 14 }, // 38

  // Blue Track (39..51)
  { col: 6, row: 13 }, // 39: Blue Start
  { col: 6, row: 12 }, // 40
  { col: 6, row: 11 }, // 41
  { col: 6, row: 10 }, // 42
  { col: 6, row: 9 },  // 43
  { col: 5, row: 8 },  // 44
  { col: 4, row: 8 },  // 45
  { col: 3, row: 8 },  // 46
  { col: 2, row: 8 },  // 47: Safe Star
  { col: 1, row: 8 },  // 48
  { col: 0, row: 8 },  // 49
  { col: 0, row: 7 },  // 50
  { col: 0, row: 6 }   // 51: Entry to Red Home
];

// Color track offset relative to global 52-tile circuit
export const COLOR_CIRCUIT_OFFSET: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Safe Tiles on the 52-circuit (Cannot be chopped)
export const SAFE_CIRCUIT_TILES = [0, 8, 13, 21, 26, 34, 39, 47];

// Home Column 5 tiles (step 51..55) + Center House (step 56..57)
export const HOME_COLUMN_COORDS: Record<LudoColor, GridPos[]> = {
  red: [
    { col: 1, row: 7 }, // 51
    { col: 2, row: 7 }, // 52
    { col: 3, row: 7 }, // 53
    { col: 4, row: 7 }, // 54
    { col: 5, row: 7 }, // 55
    { col: 6, row: 7 }, // 56
    { col: 7, row: 7 }  // 57: House Center
  ],
  yellow: [
    { col: 13, row: 7 },
    { col: 12, row: 7 },
    { col: 11, row: 7 },
    { col: 10, row: 7 },
    { col: 9, row: 7 },
    { col: 8, row: 7 },
    { col: 7, row: 7 }
  ],
  green: [
    { col: 7, row: 1 },
    { col: 7, row: 2 },
    { col: 7, row: 3 },
    { col: 7, row: 4 },
    { col: 7, row: 5 },
    { col: 7, row: 6 },
    { col: 7, row: 7 }
  ],
  blue: [
    { col: 7, row: 13 },
    { col: 7, row: 12 },
    { col: 7, row: 11 },
    { col: 7, row: 10 },
    { col: 7, row: 9 },
    { col: 7, row: 8 },
    { col: 7, row: 7 }
  ]
};

// Yard Positions for each Color (step = -1, indices 0..3)
export const YARD_POSITIONS: Record<LudoColor, GridPos[]> = {
  red: [
    { col: 2, row: 2 },
    { col: 4, row: 2 },
    { col: 2, row: 4 },
    { col: 4, row: 4 }
  ],
  yellow: [
    { col: 10, row: 10 },
    { col: 12, row: 10 },
    { col: 10, row: 12 },
    { col: 12, row: 12 }
  ],
  green: [
    { col: 2, row: 10 },
    { col: 4, row: 10 },
    { col: 2, row: 12 },
    { col: 4, row: 12 }
  ],
  blue: [
    { col: 10, row: 2 },
    { col: 12, row: 2 },
    { col: 10, row: 4 },
    { col: 12, row: 4 }
  ]
};

/**
 * Get 3D World position for any token given its color, tokenIndex, and step
 */
export function getTokenWorldPosition(color: LudoColor, tokenIndex: number, step: number): WorldPos {
  // 1. In Yard
  if (step === -1) {
    const yardGrid = YARD_POSITIONS[color][tokenIndex];
    return gridToWorld(yardGrid.col, yardGrid.row, 0.22);
  }

  // 2. On Main Circuit (steps 0 to 50)
  if (step >= 0 && step <= 50) {
    const circuitOffset = COLOR_CIRCUIT_OFFSET[color];
    const globalTileIndex = (step + circuitOffset) % 52;
    const grid = CIRCUIT_GRID_COORDS[globalTileIndex];
    return gridToWorld(grid.col, grid.row, 0.22);
  }

  // 3. In Home Stretch / House (steps 51 to 57)
  const homeIndex = Math.min(6, step - 51);
  const homeGrid = HOME_COLUMN_COORDS[color][homeIndex];
  return gridToWorld(homeGrid.col, homeGrid.row, step === 57 ? 0.35 : 0.22);
}
