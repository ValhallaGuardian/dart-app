import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lobbyApi } from '../services/api';
import { socket, connectSocket } from '../services/socket';
import type { GameState, DartThrow } from '../types';

const initialState: GameState = {
  mode: '501',
  status: 'LOBBY',
  round: 1,
  currentPlayerIndex: 0,
  lastThrow: null,
  isBust: false,
  isDoubleOut: true,
  winner: null,
  players: []
};

// Helper do formatowania rzutu
const formatThrow = (dart: DartThrow | null): string => {
  if (!dart) return "--";
  if (dart.value === 25) {
    return dart.multiplier === 2 ? "D-BULL" : "BULL";
  }
  const prefix = dart.multiplier === 3 ? "T" : dart.multiplier === 2 ? "D" : "";
  return `${prefix}${dart.value}`;
};

const GameScreen = () => {
  const { id: lobbyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>(initialState);

  useEffect(() => {
    if (!lobbyId || !token) return;

    // Pobierz dane lobby
    lobbyApi.getById(lobbyId).then((lobby) => {
      if (lobby.gameState) {
        setGameState(lobby.gameState);
      }
    });

    // Połącz socket
    connectSocket(token);
    socket.emit('join_lobby', lobbyId);

    const onGameUpdate = (newState: GameState) => {
      setGameState(newState);
    };

    const onGameEnded = () => {
      navigate(`/lobby/${lobbyId}`);
    };

    socket.on('game_update', onGameUpdate);
    socket.on('game_ended', onGameEnded);

    return () => {
      socket.emit('leave_lobby', lobbyId);
      socket.off('game_update', onGameUpdate);
      socket.off('game_ended', onGameEnded);
    };
  }, [lobbyId, token, navigate]);

  const handleLeaveGame = () => {
    navigate(`/lobby/${lobbyId}`);
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Ekran zakończenia gry
  if (gameState.status === 'FINISHED' && gameState.winner) {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-8xl mb-6">🏆</div>
        <h1 className="text-4xl font-bold text-green-400 mb-2">
          {winner?.name}
        </h1>
        <p className="text-slate-400 text-xl mb-8">Wygrywa!</p>
        
        {/* Podsumowanie */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          {gameState.players.map((player, index) => (
            <div 
              key={player.id}
              className={`p-3 rounded-xl flex justify-between items-center ${
                player.id === gameState.winner 
                  ? 'bg-green-500/20 border border-green-500' 
                  : 'bg-slate-800'
              }`}
            >
              <span className="font-medium">
                {index + 1}. {player.name}
              </span>
              <span className="font-mono">{player.score}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLeaveGame}
          className="px-8 py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     active:scale-95 transition-all"
        >
          Wróć do lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Nagłówek */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={handleLeaveGame}
          className="text-slate-400 text-sm active:scale-95"
        >
          ← Wyjdź
        </button>
        <span className="text-slate-400 text-sm">Runda {gameState.round}</span>
        <span className="px-3 py-1 bg-slate-800 rounded-full text-sm font-medium">
          {gameState.mode}
        </span>
      </div>

      {/* Wyświetlacz Rzutu */}
      <div className="mb-8 text-center h-32 flex flex-col justify-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Ostatni rzut</p>
        <div className={`text-7xl font-bold transition-all duration-300 ${
          gameState.lastThrow 
            ? gameState.isBust 
              ? 'text-red-500 scale-110' 
              : 'text-green-400 scale-110' 
            : 'text-slate-700'
        }`}>
          {gameState.isBust ? "BUST!" : formatThrow(gameState.lastThrow)}
        </div>
        {gameState.lastThrow && !gameState.isBust && (
          <p className="text-slate-500 text-sm mt-1">
            = {gameState.lastThrow.total} pkt
          </p>
        )}
      </div>

      {/* Rzuty w rundzie */}
      {currentPlayer && (
        <div className="flex gap-3 mb-8">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className={`w-16 h-16 rounded-lg flex items-center justify-center text-lg font-bold ${
                currentPlayer.throwsInRound[i] 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-slate-800 text-slate-600 border border-slate-700'
              }`}
            >
              {currentPlayer.throwsInRound[i] 
                ? formatThrow(currentPlayer.throwsInRound[i]) 
                : i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Checkout Helper */}
      {gameState.checkoutHint && gameState.checkoutHint.length > 0 && (
        <div className="w-full max-w-md mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1">Checkout</p>
          <p className="text-yellow-300 font-mono text-lg">
            {gameState.checkoutHint.join(" → ")}
          </p>
        </div>
      )}

      {/* Lista Graczy */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {gameState.players.map((player) => (
          <div 
            key={player.id}
            className={`p-4 rounded-xl flex justify-between items-center transition-all duration-500 ${
              player.isActive 
                ? 'bg-slate-800 border-2 border-green-500 shadow-[0_0_20px_rgba(74,222,128,0.2)] translate-x-2' 
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div>
              <h3 className={`text-xl font-bold ${player.isActive ? 'text-white' : 'text-slate-400'}`}>
                {player.name}
              </h3>
              {player.isActive && (
                <span className="text-xs text-green-400 animate-pulse">Teraz rzuca</span>
              )}
            </div>
            <div className="text-4xl font-mono font-bold">
              {player.score}
            </div>
          </div>
        ))}
      </div>

      {/* Status gry */}
      <div className="mt-auto w-full max-w-md text-center py-6">
        {gameState.status === 'FINISHED' && gameState.winner ? (
          <div className="text-2xl font-bold text-green-400">
            🏆 {gameState.players.find(p => p.id === gameState.winner)?.name} wygrywa!
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Oczekiwanie na rzuty z tarczy...
          </p>
        )}
      </div>

    </div>
  );
};

export default GameScreen;