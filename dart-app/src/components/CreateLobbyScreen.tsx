import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbyApi } from '../services/api';
const CreateLobbyScreen = () => {
  const [name, setName] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const lobby = await lobbyApi.create(name.trim() || undefined, maxPlayers);
      navigate(`/lobby/${lobby.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie można utworzyć gry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 active:scale-95 transition-transform"
        >
          ← Anuluj
        </button>
        <h1 className="text-xl font-bold">Nowa gra</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Nazwa gry */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Nazwa gry (opcjonalnie)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Piątkowy turniej"
            maxLength={30}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl 
                       text-white placeholder-slate-500
                       focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                       transition-all duration-200"
          />
        </div>

        {/* Max graczy */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Liczba graczy
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setMaxPlayers(num)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all active:scale-95
                  ${maxPlayers === num
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">
            ℹ️ Tryb gry możesz wybrać w lobby przed rozpoczęciem rozgrywki.
          </p>
        </div>

      </div>

      {/* Bottom button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     shadow-lg shadow-green-500/25 active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tworzenie...
            </span>
          ) : (
            '🎯 Utwórz grę'
          )}
        </button>
      </div>

    </div>
  );
};

export default CreateLobbyScreen;
