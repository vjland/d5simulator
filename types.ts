
export enum Winner {
  PLAYER = 'PLAYER',
  BANKER = 'BANKER',
  TIE = 'TIE',
}

export interface Card {
  suit: string;
  rank: string;
  value: number;
}

export interface HandResult {
  id: number;
  playerScore: number;
  bankerScore: number;
  winner: Winner;
  outcome: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  pnl: number;
  betPlaced: Winner | null;
  runningBalance: number;
  timestamp: number;
}

export interface SimulationState {
  active: boolean;
  history: HandResult[];
  balance: number;
  speed: number;
}

export interface Bead {
  winner: Winner;
  tieCount: number;
}
