import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbyApi, gameApi } from '../services/api';
import type { LobbyListItem } from '../types';

const LobbiesScreen = () => {
  const [lobbies, setLobbies] = useState<LobbyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLobbies = async () => {
    try {
      setIsLoading(true);
      const [data, canStartData] = await Promise.all([
        lobbyApi.getAll(),
        gameApi.canStart()
      ]);
      setLobbies(data);
      setActiveGameId(canStartData.activeGameId);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania lobby');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
    
    // Odświeżaj co 5 sekund
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      await lobbyApi.join(lobbyId);
      navigate(`/lobby/${lobbyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie można dołączyć');
    }
  };

  const getStatusBadge = (status: string, lobbyId: string) => {
    const isOnBoard = activeGameId === lobbyId;
    
    switch (status) {
      case 'WAITING':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Oczekuje</span>;
      case 'PLAYING':
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">W grze</span>
            {isOnBoard && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full animate-pulse">🎯 Na tarczy</span>
            )}
          </div>
        );
      case 'FINISHED':
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">Zakończona</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800">
        <button
          onClick={() => navigate('/home')}
          className="text-slate-400 active:scale-95 transition-transform"
        >
          ← Powrót
        </button>
        <h1 className="text-xl font-bold">Dostępne gry</h1>
        <button
          onClick={fetchLobbies}
          className="text-green-400 active:scale-95 transition-transform"
        >
          ↻
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && lobbies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-400 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-400">Ładowanie...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && lobbies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-slate-400 mb-2">Brak dostępnych gier</p>
            <p className="text-slate-500 text-sm">Utwórz nową grę i zaproś znajomych!</p>
          </div>
        )}

        {/* Lista lobby */}
        <div className="space-y-3">
          {/* Info o zajętej tarczy */}
          {activeGameId && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center mb-4">
              🎯 Tarcza jest obecnie zajęta przez inną grę
            </div>
          )}
          
          {lobbies.map((lobby) => (
            <div
              key={lobby.id}
              className="p-4 bg-slate-800 border border-slate-700 rounded-xl"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{lobby.name}</h3>
                  <p className="text-slate-400 text-sm">Host: {lobby.hostName}</p>
                </div>
                {getStatusBadge(lobby.status, lobby.id)}
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>🎮 {lobby.mode}</span>
                  <span>👥 {lobby.playerCount}/{lobby.maxPlayers}</span>
                </div>
                
                {lobby.status === 'WAITING' && lobby.playerCount < lobby.maxPlayers && (
                  <button
                    onClick={() => handleJoinLobby(lobby.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium
                               active:scale-95 transition-all"
                  >
                    Dołącz
                  </button>
                )}
                
                {lobby.status === 'PLAYING' && (
                  <button
                    onClick={() => navigate(`/game/${lobby.id}`)}
                    className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg font-medium
                               active:scale-95 transition-all"
                  >
                    Obserwuj
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/lobbies/create')}
          className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     shadow-lg shadow-green-500/25 active:scale-95 transition-all duration-200"
        >
          ➕ Utwórz nową grę
        </button>
      </div>

    </div>
  );
};

export default LobbiesScreen;
