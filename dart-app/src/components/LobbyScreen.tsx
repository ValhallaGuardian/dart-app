import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lobbyApi, gameApi } from '../services/api';
import { socket, connectSocket } from '../services/socket';
import type { Lobby, GameMode } from '../types';

const GAME_MODES: { value: GameMode; label: string; description: string }[] = [
  { value: '501', label: '501', description: 'Klasyczna gra, startuj od 501' },
  { value: '301', label: '301', description: 'Szybka rozgrywka od 301' },
  { value: 'CRICKET', label: 'Cricket', description: 'Zamykaj sektory 15-20 + Bull' },
  { value: 'KILLER', label: 'Killer', description: 'Eliminuj przeciwników' },
];

const LobbyScreen = () => {
  const { id: lobbyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [hostChangeMessage, setHostChangeMessage] = useState<string | null>(null);

  const isHost = lobby?.hostId === user?.id;

  // Pobierz dane lobby i połącz socket
  useEffect(() => {
    if (!lobbyId || !token) return;

    const fetchLobby = async () => {
      try {
        const data = await lobbyApi.getById(lobbyId);
        setLobby(data);
        setError('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nie można załadować lobby';
        if (message.includes('nie istnieje')) {
          setError('To lobby już nie istnieje');
        } else {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobby();

    // Połącz socket z tokenem
    connectSocket(token);
    socket.emit('join_lobby', lobbyId);

    // Nasłuchuj na aktualizacje
    const onLobbyUpdate = (updatedLobby: Lobby) => {
      setLobby(updatedLobby);
    };

    const onGameStarted = () => {
      navigate(`/game/${lobbyId}`);
    };

    const onHostChanged = ({ newHostName }: { newHostId: string; newHostName: string }) => {
      setHostChangeMessage(`${newHostName} jest teraz hostem`);
      setTimeout(() => setHostChangeMessage(null), 3000);
    };

    const onLobbyDeleted = () => {
      setError('Lobby zostało usunięte');
      setTimeout(() => navigate('/lobbies'), 2000);
    };

    socket.on('lobby_update', onLobbyUpdate);
    socket.on('game_started', onGameStarted);
    socket.on('host_changed', onHostChanged);
    socket.on('lobby_deleted', onLobbyDeleted);

    return () => {
      socket.emit('leave_lobby', lobbyId);
      socket.off('lobby_update', onLobbyUpdate);
      socket.off('game_started', onGameStarted);
      socket.off('host_changed', onHostChanged);
      socket.off('lobby_deleted', onLobbyDeleted);
    };
  }, [lobbyId, token, navigate]);

  const handleModeChange = async (mode: GameMode) => {
    if (!lobbyId || !isHost) return;

    try {
      await lobbyApi.setMode(lobbyId, mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie można zmienić trybu');
    }
  };

  const handleStartGame = async () => {
    if (!lobbyId || !isHost) return;

    setIsStarting(true);
    setError('');

    try {
      // Sprawdź czy tarcza jest wolna i podłączona
      const { canStart, dartboardConnected, activeGameId } = await gameApi.canStart();
      
      if (!canStart) {
        if (!dartboardConnected) {
          setError('Tarcza nie jest podłączona! Podłącz Arduino i spróbuj ponownie.');
        } else if (activeGameId) {
          setError('Tarcza jest zajęta! Inna gra jest w trakcie.');
        } else {
          setError('Nie można rozpocząć gry. Spróbuj ponownie.');
        }
        setIsStarting(false);
        return;
      }

      await lobbyApi.startGame(lobbyId);
      // Navigate zostanie wywołany przez event game_started
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie można rozpocząć gry');
      setIsStarting(false);
    }
  };

  const handleLeaveLobby = async () => {
    if (!lobbyId) return;

    try {
      await lobbyApi.leave(lobbyId);
      navigate('/lobbies');
    } catch (err) {
      navigate('/lobbies');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-green-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-xl mb-2 text-center">{error || 'Lobby nie istnieje'}</p>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Lobby mogło zostać usunięte lub link jest nieprawidłowy
        </p>
        <button
          onClick={() => navigate('/lobbies')}
          className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold active:scale-95"
        >
          Wróć do listy gier
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      
      {/* Toast powiadomienie o zmianie hosta */}
      {hostChangeMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-yellow-500/90 text-black rounded-full font-medium text-sm animate-pulse">
          👑 {hostChangeMessage}
        </div>
      )}
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800">
        <button
          onClick={handleLeaveLobby}
          className="text-slate-400 active:scale-95 transition-transform"
        >
          ← Wyjdź
        </button>
        <h1 className="text-xl font-bold">{lobby.name}</h1>
        <div className="w-16" />
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex-1 p-4 space-y-6">
        
        {/* Wybór trybu gry */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Tryb gry {!isHost && <span className="text-slate-500">(wybiera host)</span>}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                disabled={!isHost}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-95
                  ${lobby.mode === mode.value
                    ? 'bg-green-500/20 border-2 border-green-500 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }
                  ${!isHost && 'opacity-60 active:scale-100'}
                `}
              >
                <span className="text-lg font-bold block">{mode.label}</span>
                <span className="text-xs text-slate-400">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista graczy */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Gracze ({lobby.players.length}/{lobby.maxPlayers})
          </h3>
          <div className="space-y-2">
            {lobby.players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl bg-slate-800 border flex items-center gap-3
                  ${player.id === user?.id ? 'border-green-500/50' : 'border-slate-700'}
                `}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {player.username}
                    {player.id === user?.id && (
                      <span className="text-green-400 text-sm ml-2">(Ty)</span>
                    )}
                  </p>
                  {player.isHost && (
                    <span className="text-xs text-yellow-400">👑 Host</span>
                  )}
                </div>
                {player.isReady && (
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </div>
            ))}

            {/* Puste miejsca */}
            {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 flex items-center justify-center"
              >
                <p className="text-slate-500 text-sm">Wolne miejsce</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {isHost ? (
          <>
            <button
              onClick={handleStartGame}
              disabled={isStarting || lobby.players.length < 2}
              className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                         shadow-lg shadow-green-500/25 active:scale-95 transition-all duration-200
                         disabled:opacity-50 disabled:active:scale-100"
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uruchamianie...
                </span>
              ) : (
                '🎯 Rozpocznij grę'
              )}
            </button>
            {lobby.players.length < 2 && (
              <p className="text-center text-slate-500 text-sm">
                Potrzeba minimum 2 graczy
              </p>
            )}
          </>
        ) : (
          <div className="w-full py-4 bg-slate-800 text-slate-400 rounded-xl text-center text-lg">
            Czekam na hosta...
          </div>
        )}
      </div>

    </div>
  );
};

export default LobbyScreen;
