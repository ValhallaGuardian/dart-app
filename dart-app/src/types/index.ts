/**
 * Smart Dartboard - Type Definitions
 */

export type GameMode = '301' | '501' | 'CRICKET' | 'KILLER' | 'AROUND_THE_CLOCK' | 'SHANGHAI';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type LobbyStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export type ThrowMultiplier = 1 | 2 | 3;

export type AvatarPreset = 
  | 'default' | 'dart1' | 'dart2' | 'dart3' 
  | 'player1' | 'player2' | 'player3' | 'player4'
  | 'crown' | 'target' | 'bull';

export interface DartThrow {
  value: number;
  multiplier: ThrowMultiplier;
  total: number;
}

export interface ThrowHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  throw: DartThrow;
  isBust: boolean;
  timestamp: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  highestCheckout: number;
  averagePerRound: number;
  favoriteMode: GameMode | null;
}

export interface User {
  id: string;
  username: string;
  avatar: AvatarPreset;
  stats: PlayerStats;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isActive: boolean;
  throwsInRound: DartThrow[];
  cricketMarks?: CricketMarks;
  lives?: number;
  killerNumber?: number;
  currentTarget?: number;
}

export interface LobbyPlayer {
  id: string;
  username: string;
  avatar: AvatarPreset;
  isReady: boolean;
  isHost: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  mode: GameMode;
  status: LobbyStatus;
  createdAt: string;
  gameState: GameState | null;
}

export interface LobbyListItem {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  mode: GameMode;
  status: LobbyStatus;
  createdAt: string;
}

export interface CricketMarks {
  20: number;
  19: number;
  18: number;
  17: number;
  16: number;
  15: number;
  bull: number;
}

export interface GameState {
  mode: GameMode;
  status: GameStatus;
  round: number;
  players: Player[];
  currentPlayerIndex: number;
  lastThrow: DartThrow | null;
  isBust: boolean;
  isDoubleOut: boolean;
  winner: string | null;
  checkoutHint?: string[];
  throwHistory?: ThrowHistoryItem[];
}

export interface GameCommand {
  type: 'START_GAME' | 'UNDO_THROW' | 'NEXT_PLAYER' | 'RESTART_GAME' | 'LEAVE_GAME';
  payload?: {
    mode?: GameMode;
    playerName?: string;
  };
}

export interface ServerToClientEvents {
  game_update: (state: GameState) => void;
  lobby_update: (lobby: Lobby) => void;
  game_started: (state: GameState) => void;
  game_ended: () => void;
  game_aborted: (data: { abortedBy: string }) => void;
  host_changed: (data: { newHostId: string; newHostName: string }) => void;
  lobby_deleted: () => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  join_lobby: (lobbyId: string) => void;
  leave_lobby: (lobbyId: string) => void;
  send_command: (command: GameCommand) => void;
}

export interface ApiError {
  error: string;
}

export interface CanStartResponse {
  canStart: boolean;
  activeGameId: string | null;
  dartboardConnected: boolean;
}
