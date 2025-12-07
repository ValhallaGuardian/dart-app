// ============================================
// SMART DARTBOARD - TYPE DEFINITIONS
// ============================================

// Tryby gry
export type GameMode = '301' | '501' | 'CRICKET' | 'KILLER' | 'AROUND_THE_CLOCK' | 'SHANGHAI';

// Status gry
export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

// Status lobby
export type LobbyStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

// Mnożnik rzutu (single, double, triple)
export type ThrowMultiplier = 1 | 2 | 3;

// Preset avatarów
export type AvatarPreset = 
  | 'default' | 'dart1' | 'dart2' | 'dart3' 
  | 'player1' | 'player2' | 'player3' | 'player4'
  | 'crown' | 'target' | 'bull';

// ============================================
// RZUT
// ============================================
export interface DartThrow {
  value: number;        // Wartość pola (1-20, 25 dla bull)
  multiplier: ThrowMultiplier;
  total: number;        // value * multiplier (obliczone przez serwer)
}

// Historia rzutu (z informacją o graczu)
export interface ThrowHistoryItem {
  id: string;           // Unikalny ID rzutu
  playerId: string;
  playerName: string;
  throw: DartThrow;
  isBust: boolean;
  timestamp: number;
}

// ============================================
// STATYSTYKI GRACZA
// ============================================
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  highestCheckout: number;
  averagePerRound: number;
  favoriteMode: GameMode | null;
}

// ============================================
// UŻYTKOWNIK (AUTH)
// ============================================
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

// ============================================
// GRACZ W GRZE
// ============================================
export interface Player {
  id: string;
  name: string;
  score: number;              // Wynik (501 w dół, lub punkty w górę)
  isActive: boolean;          // Czy teraz rzuca
  throwsInRound: DartThrow[]; // Rzuty w aktualnej rundzie (max 3)
  
  // Pola specyficzne dla trybów:
  cricketMarks?: CricketMarks;  // Dla trybu Cricket
  lives?: number;               // Dla trybu Killer
  killerNumber?: number;        // Przypisany numer w Killer
  currentTarget?: number;       // Dla Around the Clock / Shanghai
}

// ============================================
// GRACZ W LOBBY
// ============================================
export interface LobbyPlayer {
  id: string;
  username: string;
  avatar: AvatarPreset;
  isReady: boolean;
  isHost: boolean;
}

// ============================================
// LOBBY
// ============================================
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

// Lista lobby (skrócona wersja)
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

// ============================================
// CRICKET - Znaczniki zamknięcia sektorów
// ============================================
export interface CricketMarks {
  20: number;  // 0 = otwarty, 1 = /, 2 = X, 3 = O (zamknięty)
  19: number;
  18: number;
  17: number;
  16: number;
  15: number;
  bull: number;
}

// ============================================
// GŁÓWNY STAN GRY
// ============================================
export interface GameState {
  // Podstawowe info
  mode: GameMode;
  status: GameStatus;
  round: number;
  
  // Gracze
  players: Player[];
  currentPlayerIndex: number;
  
  // Ostatni rzut (do animacji/wyświetlenia)
  lastThrow: DartThrow | null;
  
  // Flagi specjalne
  isBust: boolean;            // Czy ostatni rzut to "fura" (przerzut w 501)
  isDoubleOut: boolean;       // Czy gra wymaga zakończenia doublem
  winner: string | null;      // ID zwycięzcy (gdy status = FINISHED)
  
  // Checkout helper (obliczany przez serwer dla 301/501)
  checkoutHint?: string[];    // np. ["T20", "T20", "D20"] dla 120
  
  // Historia rzutów (ostatnie 10)
  throwHistory?: ThrowHistoryItem[];
}

// ============================================
// KOMENDY WYSYŁANE DO SERWERA
// ============================================
export interface GameCommand {
  type: 'START_GAME' | 'UNDO_THROW' | 'NEXT_PLAYER' | 'RESTART_GAME' | 'LEAVE_GAME';
  payload?: {
    mode?: GameMode;
    playerName?: string;
  };
}

// ============================================
// EVENTY SOCKET.IO
// ============================================
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

// ============================================
// API RESPONSES
// ============================================
export interface ApiError {
  error: string;
}

export interface CanStartResponse {
  canStart: boolean;
  activeGameId: string | null;
}
