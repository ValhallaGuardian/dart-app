import React from 'react';

// 1. Definiujemy jak wyglądają dane (to jest Twój kontrakt z backendem)
interface Player {
  name: string;
  score: number;
  isActive: boolean;
}

interface GameState {
  players: Player[];
  currentThrow: number | null; // null jeśli jeszcze nie rzucił
  round: number;
}

// 2. "Sztuczne dane" - udajemy, że serwer nam to przysłał
const mockData: GameState = {
  round: 3,
  currentThrow: 20,
  players: [
    { name: "Marek", score: 301, isActive: true },
    { name: "Tomek", score: 450, isActive: false },
  ]
};

const GameScreen = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Nagłówek Rundy */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 opacity-70">
        <span>Runda {mockData.round}</span>
        <span>Tryb: 501</span>
      </div>

      {/* Ostatni Rzut (Duże na środku) */}
      <div className="mb-12 text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Ostatni rzut</p>
        <div className="text-8xl font-bold text-green-400">
          {mockData.currentThrow}
        </div>
      </div>

      {/* Lista Graczy */}
      <div className="w-full max-w-md space-y-4">
        {mockData.players.map((player, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl flex justify-between items-center transition-all ${
              player.isActive 
                ? 'bg-slate-800 border-2 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div>
              <h3 className={`text-xl font-bold ${player.isActive ? 'text-white' : 'text-slate-400'}`}>
                {player.name}
              </h3>
              {player.isActive && <span className="text-xs text-green-400">Teraz rzuca</span>}
            </div>
            <div className="text-4xl font-mono font-bold">
              {player.score}
            </div>
          </div>
        ))}
      </div>

      {/* Przyciski akcji (Symulacja) */}
      <div className="mt-auto w-full max-w-md grid grid-cols-2 gap-4 py-6">
        <button className="bg-slate-700 py-4 rounded-lg font-bold text-slate-300 active:bg-slate-600">
          Cofnij
        </button>
        <button className="bg-green-600 py-4 rounded-lg font-bold text-white active:bg-green-700">
          Następny
        </button>
      </div>

    </div>
  );
};

export default GameScreen;