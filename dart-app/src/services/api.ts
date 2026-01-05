import type { AuthResponse, User, Lobby, LobbyListItem, GameState, CanStartResponse, GameMode, AvatarPreset } from '../types';

const isDev = import.meta.env.DEV;
const API_URL = isDev ? (import.meta.env.VITE_API_URL || 'http://localhost:3000') : '';
const API_BASE = `${API_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Wystąpił błąd');
  }
  
  return data as T;
}

export const authApi = {
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

  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    
    return handleResponse<User>(response);
  },
};

export const profileApi = {
  async updateAvatar(avatar: AvatarPreset): Promise<{ avatar: AvatarPreset }> {
    const response = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ avatar }),
    });
    
    return handleResponse<{ avatar: AvatarPreset }>(response);
  },

  async getAvatars(): Promise<AvatarPreset[]> {
    const response = await fetch(`${API_BASE}/profile/avatars`, {
      headers: authHeaders(),
    });
    return handleResponse<AvatarPreset[]>(response);
  },

  async updateUsername(username: string): Promise<User> {
    const response = await fetch(`${API_BASE}/profile/username`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ username }),
    });
    
    return handleResponse<User>(response);
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/profile/password`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    return handleResponse<{ message: string }>(response);
  },
};

export const lobbyApi = {
  async getAll(): Promise<LobbyListItem[]> {
    const response = await fetch(`${API_BASE}/lobbies`, {
      headers: authHeaders(),
    });
    
    return handleResponse<LobbyListItem[]>(response);
  },

  async getById(id: string): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}`, {
      headers: authHeaders(),
    });
    
    return handleResponse<Lobby>(response);
  },

  async create(name?: string, maxPlayers?: number): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, maxPlayers }),
    });
    
    return handleResponse<Lobby>(response);
  },

  async join(id: string): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/join`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<Lobby>(response);
  },

  async leave(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/leave`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  async setMode(id: string, mode: GameMode): Promise<Lobby> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/mode`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ mode }),
    });
    
    return handleResponse<Lobby>(response);
  },

  async startGame(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/start`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },

  async endGame(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/end`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  async abortGame(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/abort`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<{ message: string }>(response);
  },

  async simulateThrow(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/simulate-throw`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },

  async undoThrow(id: string): Promise<GameState> {
    const response = await fetch(`${API_BASE}/lobbies/${id}/undo-throw`, {
      method: 'POST',
      headers: authHeaders(),
    });
    
    return handleResponse<GameState>(response);
  },
};

export const gameApi = {
  async canStart(): Promise<CanStartResponse> {
    const response = await fetch(`${API_BASE}/game/can-start`, {
      headers: authHeaders(),
    });
    
    return handleResponse<CanStartResponse>(response);
  },
};
