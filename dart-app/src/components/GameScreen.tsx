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
  players: [],
  throwHistory: []
};

/** Formats dart throw for display */
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
  const { token, user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const [abortMessage, setAbortMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    if (!lobbyId || !token) return;

    // Pobierz dane lobby
    lobbyApi.getById(lobbyId).then((lobby) => {
      if (lobby.gameState) {
        setGameState(lobby.gameState);
      }
      // Sprawdź czy aktualny użytkownik jest hostem
      setIsHost(lobby.hostId === user?.id);
    }).catch(() => {
      // Lobby nie istnieje - przekieruj
      navigate('/home');
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

    const onGameAborted = ({ abortedBy }: { abortedBy: string }) => {
      setAbortMessage(`Gra została przerwana przez gracza ${abortedBy}`);
      // Przekieruj do home po chwili
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    };

    socket.on('game_update', onGameUpdate);
    socket.on('game_ended', onGameEnded);
    socket.on('game_aborted', onGameAborted);

    return () => {
      socket.emit('leave_lobby', lobbyId);
      socket.off('game_update', onGameUpdate);
      socket.off('game_ended', onGameEnded);
      socket.off('game_aborted', onGameAborted);
    };
  }, [lobbyId, token, navigate, user?.id]);

  const handleExitClick = () => {
    if (gameState.status === 'PLAYING') {
      setShowExitConfirm(true);
    } else {
      navigate('/home');
    }
  };

  const handleConfirmAbort = async () => {
    if (!lobbyId) return;
    
    setIsAborting(true);
    try {
      await lobbyApi.abortGame(lobbyId);
      navigate('/home');
    } catch {
      setIsAborting(false);
      setShowExitConfirm(false);
    }
  };

  const handleUndoThrow = async () => {
    if (!lobbyId || !isHost || isUndoing) return;
    
    setIsUndoing(true);
    try {
      await lobbyApi.undoThrow(lobbyId);
    } catch (err) {
      console.error('Błąd cofania:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const throwHistory = gameState.throwHistory || [];

  // Ekran komunikatu o przerwaniu gry
  if (abortMessage) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold text-red-400 mb-4 text-center">
          {abortMessage}
        </h1>
        <p className="text-slate-400 mb-4">Przekierowanie do panelu...</p>
        <div className="animate-spin h-6 w-6 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

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
          onClick={() => navigate('/home')}
          className="px-8 py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     active:scale-95 transition-all"
        >
          Wróć do panelu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Dialog potwierdzenia wyjścia */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-white mb-2">Przerwać grę?</h2>
              <p className="text-slate-400 text-sm">
                Wyjście zakończy grę dla wszystkich graczy. Czy na pewno chcesz kontynuować?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                disabled={isAborting}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium
                           active:scale-95 transition-all disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmAbort}
                disabled={isAborting}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium
                           active:scale-95 transition-all disabled:opacity-50"
              >
                {isAborting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  </span>
                ) : (
                  'Zakończ grę'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Nagłówek */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={handleExitClick}
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
      <div className="w-full max-w-md space-y-3 mb-4">
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

      {/* Przyciski kontrolne */}
      <div className="w-full max-w-md flex gap-3 mb-4">
        {/* Cofnij rzut (tylko host) */}
        {isHost && (
          <button
            onClick={handleUndoThrow}
            disabled={isUndoing || throwHistory.length === 0 || gameState.status !== 'PLAYING'}
            className="flex-1 py-3 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-xl font-medium
                       active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isUndoing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full" />
              </span>
            ) : (
              'Cofnij rzut'
            )}
          </button>
        )}
      </div>

      {/* Status gry */}
      <div className="w-full max-w-md text-center py-2">
        {gameState.status === 'FINISHED' && gameState.winner ? (
          <div className="text-2xl font-bold text-green-400">
            {gameState.players.find(p => p.id === gameState.winner)?.name} wygrywa!
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Oczekiwanie na rzuty z tarczy...
          </p>
        )}
      </div>

      {/* Historia rzutów - slide-in z prawej */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-slate-800 border border-slate-700 
                   rounded-l-xl px-2 py-4 text-slate-400 active:scale-95 transition-all"
      >
        {showHistory ? '›' : '‹'}
      </button>
      
      <div 
        className={`fixed right-0 top-0 h-full w-48 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700 
                    z-30 transition-transform duration-300 ease-out overflow-hidden
                    ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-sm font-bold text-slate-300">Historia rzutów</h3>
        </div>
        
        <div className="p-2 space-y-1 overflow-y-auto h-[calc(100%-48px)]">
          {throwHistory.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">Brak rzutów</p>
          ) : (
            [...throwHistory].reverse().map((item, index) => (
              <div 
                key={item.id}
                className={`p-2 rounded-lg text-xs transition-all duration-300
                  ${index === 0 ? 'bg-green-500/20 border border-green-500/30 animate-pulse' : 'bg-slate-700/50'}
                  ${item.isBust ? 'border-l-2 border-l-red-500' : ''}`}
                style={{
                  animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 truncate max-w-[60px]">{item.playerName}</span>
                  <span className={`font-mono font-bold ${item.isBust ? 'text-red-400' : 'text-green-400'}`}>
                    {item.isBust ? 'BUST' : formatThrow(item.throw)}
                  </span>
                </div>
                {!item.isBust && (
                  <div className="text-slate-500 text-right">
                    {item.throw.total} pkt
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CSS dla animacji */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

    </div>
  );
};

export default GameScreen;