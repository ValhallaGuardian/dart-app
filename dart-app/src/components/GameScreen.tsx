import React, { useState } from 'react';

// Interfejsy bez zmian (Twój kontrakt)
interface Player {
  name: string;
  score: number;
  isActive: boolean;
}

interface GameState {
  players: Player[];
  currentThrow: number | null;
  round: number;
}

// Stan początkowy (zamiast const mockData)
const initialState: GameState = {
  round: 1,
  currentThrow: null,
  players: [
    { name: "Franek", score: 501, isActive: true },
    { name: "Marcin", score: 501, isActive: false },
  ]
};

const GameScreen = () => {
  // Używamy useState - teraz React będzie śledził zmiany!
  const [gameState, setGameState] = useState<GameState>(initialState);

  // Funkcja symulująca rzut (do testów przyciskiem)
  const simulateThrow = () => {
    // Losujemy punkty od 0 do 60
    const points = Math.floor(Math.random() * 61);
    
    setGameState(prev => {
      // Kopia graczy (w React nie mutujemy stanu bezpośrednio)
      const newPlayers = prev.players.map(player => {
        if (player.isActive) {
          return { ...player, score: Math.max(0, player.score - points) };
        }
        return player;
      });

      return {
        ...prev,
        currentThrow: points,
        players: newPlayers
      };
    });
  };

  // Funkcja zmiany tury
  const nextTurn = () => {
    setGameState(prev => ({
      ...prev,
      round: prev.players[1].isActive ? prev.round + 1 : prev.round, // Zwiększ rundę jak drugi gracz skończy
      currentThrow: null, // Reset wyświetlacza rzutu
      players: prev.players.map(p => ({ ...p, isActive: !p.isActive })) // Odwróć aktywność
    }));
  };

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

      {/* Przyciski akcji */}
      <div className="mt-auto w-full max-w-md grid grid-cols-2 gap-4 py-6">
        {/* Ten przycisk to Twój "symulator tarczy" na czas developmentu */}
        <button 
          onClick={simulateThrow}
          className="bg-slate-700 py-4 rounded-lg font-bold text-slate-300 active:bg-slate-600 active:scale-95 transition-transform"
        >
          Symuluj Rzut 🎯
        </button>
        <button 
          onClick={nextTurn}
          className="bg-green-600 py-4 rounded-lg font-bold text-white active:bg-green-700 active:scale-95 transition-transform"
        >
          Następny Gracz
        </button>
      </div>

    </div>
  );
};

export default GameScreen;