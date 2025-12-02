export interface Player {
  name: string;
  score: number;
  isActive: boolean;
}

export interface GameState {
  players: Player[];
  currentThrow: number | null;
  round: number;
}
