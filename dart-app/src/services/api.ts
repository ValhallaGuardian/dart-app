import type { AuthResponse, User, Lobby, LobbyListItem, GameState, CanStartResponse, GameMode } from '../types';

// URL z .env lub fallback do localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE = `${API_URL}/api`;

// ============================================
// HELPER - Pobierz token
// ============================================
function getToken(): string | null {
  return localStorage.getItem('token');
}

// ============================================
// HELPER - Headers z autoryzacją
// ============================================
function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ============================================
// HELPER - Obsługa odpowiedzi
// ============================================
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Wystąpił błąd');
  }
  
  return data as T;
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  // Rejestracja
  async register(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    return handleResponse<AuthResponse>(response);
  },

  // Logowanie
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    return handleResponse<AuthResponse>(response);
  },

  // Pobierz profil zalogowanego użytkownika
  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    
    return handleResponse<User>(response);
  },
};

// ============================================
// PROFILE API
// ============================================
export const profileApi = {
  // Zmień avatar
  async updateAvatar(avatar: string): Promise<{ avatar: string }> {
    const response = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ avatar }),
    });
    
    return handleResponse<{ avatar: string }>(response);
  },

  // Pobierz dostępne avatary
  async getAvatars(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/profile/avatars`);
    return handleResponse<string[]>(response);
  },
};

// ============================================
// LOBBY API
// ============================================
export const lobbyApi = {
  // Lista wszystkich lobby
  async getAll(): Promise<LobbyListItem[]> {
    const response = await fetch(`${API_BASE}/lobbies`, {
      headers: authHeaders(),
    });
    
    return handleResponse<LobbyListItem[]>(response);
  },

  // Szczegóły lobby
  async getById(id: string): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}`, {
      headers: authHeaders(),
    });
    
    return handleResponse<Lobby>(response);
  },

  // Utwórz nowe lobby
  async create(name?: string, maxPlayers?: number): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, maxPlayers }),
    });
    
    return handleResponse<Lobby>(response);
  },

  // Dołącz do lobby
  async join(id: string): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/join`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<Lobby>(response);
  },

  // Opuść lobby
  async leave(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/leave`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  // Zmień tryb gry (tylko host)
  async setMode(id: string, mode: GameMode): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/mode`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ mode }),
    });
    
    return handleResponse<Lobby>(response);
  },

  // Rozpocznij grę (tylko host)
  async startGame(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/start`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },

  // Zakończ grę (tylko host, po zakończeniu normalnym)
  async endGame(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/end`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  // Przerwij grę (każdy gracz może, kończy grę dla wszystkich)
  async abortGame(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/abort`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  // Symuluj następny rzut (DEV)
  async simulateThrow(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/simulate-throw`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },

  // Cofnij ostatni rzut (tylko host)
  async undoThrow(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/undo-throw`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },
};

// ============================================
// GAME API
// ============================================
export const gameApi = {
  // Sprawdź czy można rozpocząć grę
  async canStart(): Promise<CanStartResponse> {
    const response = await fetch(`${API_BASE}/game/can-start`, {
      headers: authHeaders(),
    });
    
    return handleResponse<CanStartResponse>(response);
  },
};
