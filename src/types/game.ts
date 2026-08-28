export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type TileChar = '.' | '#' | 'O' | 'X' | '@' | '*' | '+';

export interface Position {
  x: number;
  y: number;
}

export type PhaseType = 'Tutorial' | 'Beginner' | 'Advanced' | 'Expert' | 'Master' | 'Classic' | 'Custom';

export interface StageData {
  id: number;
  name: string;
  phase: string;
  phaseCategory: PhaseType;
  width: number;
  height: number;
  grid: string[];
  parMoves: number;
  description?: string;
  hint?: string;
}

export interface BallState {
  id: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  isSliding?: boolean;
  slideProgress?: number;
  slideStartX?: number;
  slideStartY?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  dir: Direction;
  isPushing?: boolean;
}

export interface MoveStep {
  playerBefore: Position;
  playerAfter: Position;
  dir: Direction;
  pushedBall?: {
    ballId: number;
    from: Position;
    to: Position;
  };
}

export interface StageRecord {
  stageId: number;
  cleared: boolean;
  bestMoves: number;
  bestTimeMs: number; // milliseconds
  stars: number; // 1, 2, 3
  lastPlayed: string;
}

// Exactly matches SQL구문.txt table `public.pushpush_leaderboard`
export interface LeaderboardEntry {
  id: string;
  name: string; // VARCHAR(12) NOT NULL
  stage_level: number; // INTEGER NOT NULL CHECK (stage_level > 0)
  moves: number; // INTEGER NOT NULL CHECK (moves >= 0)
  clear_time_ms: number; // BIGINT NOT NULL CHECK (clear_time_ms >= 0)
  played_at: string; // TIMESTAMPTZ NOT NULL DEFAULT NOW()
}

export interface SolverResult {
  solvable: boolean;
  minMoves: number;
  solution?: Direction[];
  exploredStates?: number;
  message?: string;
}
