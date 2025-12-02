import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import type { GameState } from '../types';

const initialState: GameState = {
  round: 1,
  currentThrow: null,
  players: [
    { name: "Oczekiwanie...", score: 501, isActive: false },
    { name: "Oczekiwanie...", score: 501, isActive: false },
  ]
};

const GameScreen = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  useEffect(() => {
    socket.connect();

    const onGameUpdate = (newState: GameState) => {
      setGameState(newState);
    };

    socket.on('game_update', onGameUpdate);

    return () => {
      socket.off('game_update', onGameUpdate);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Nagłówek */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 opacity-70">
        <span>Runda {gameState.round}</span>
        <span>Tryb: 501</span>
      </div>

      {/* Wyświetlacz Rzutu */}
      <div className="mb-12 text-center h-32 flex flex-col justify-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Ostatni rzut</p>
        <div className={`text-8xl font-bold transition-all duration-300 ${gameState.currentThrow ? 'text-green-400 scale-110' : 'text-slate-700'}`}>
          {gameState.currentThrow ?? "--"}
        </div>
      </div>

      {/* Lista Graczy */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {gameState.players.map((player, index) => (
          <div 
            key={index}
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
              {player.isActive && <span className="text-xs text-green-400 animate-pulse">Teraz rzuca</span>}
            </div>
            <div className="text-4xl font-mono font-bold">
              {player.score}
            </div>
          </div>
        ))}
      </div>

      {/* Przyciski akcji - USUNIĘTE (Sterowanie przez serwer) */}
      <div className="mt-auto w-full max-w-md text-center py-6 text-slate-500 text-sm">
        Oczekiwanie na rzuty z tarczy...
      </div>

    </div>
  );
};

export default GameScreen;