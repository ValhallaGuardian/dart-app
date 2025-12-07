import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reactLogo from '../assets/react.svg';

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800">
        <h1 className="text-xl font-bold text-green-400">🎯 Smart Dartboard</h1>
        <button
          onClick={handleLogout}
          className="text-slate-400 text-sm active:scale-95 transition-transform"
        >
          Wyloguj
        </button>
      </header>

      {/* Profil */}
      <section className="p-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-green-500 flex items-center justify-center mb-4 overflow-hidden">
          <img 
            src={reactLogo} 
            alt="Avatar" 
            className="w-16 h-16 animate-spin-slow"
            style={{ animationDuration: '20s' }}
          />
        </div>
        
        {/* Nick */}
        <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
        <p className="text-slate-400 text-sm">Gracz</p>

        {/* Przycisk edycji profilu */}
        <button
          onClick={() => navigate('/profile')}
          className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm
                     active:scale-95 transition-all"
        >
          Edytuj profil
        </button>
      </section>

      {/* Statystyki - placeholder */}
      <section className="px-6 mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Statystyki
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-800 rounded-xl">
            <p className="text-2xl font-bold text-green-400">{user.stats.gamesPlayed}</p>
            <p className="text-slate-400 text-xs">Rozegrane gry</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl">
            <p className="text-2xl font-bold text-green-400">{user.stats.gamesWon}</p>
            <p className="text-slate-400 text-xs">Wygrane</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl">
            <p className="text-2xl font-bold text-yellow-400">{user.stats.highestCheckout}</p>
            <p className="text-slate-400 text-xs">Najwyższy checkout</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl">
            <p className="text-2xl font-bold text-blue-400">
              {user.stats.averagePerRound.toFixed(1)}
            </p>
            <p className="text-slate-400 text-xs">Średnia/rundę</p>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-3">
          Statystyki będą dostępne wkrótce
        </p>
      </section>

      {/* Akcje */}
      <section className="px-6 mt-auto pb-8 space-y-3">
        {/* Główny przycisk - Przeglądaj gry */}
        <button
          onClick={() => navigate('/lobbies')}
          className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     shadow-lg shadow-green-500/25 active:scale-95 transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          <span className="text-xl">🎮</span>
          Przeglądaj gry
        </button>

        {/* Przycisk - Utwórz grę */}
        <button
          onClick={() => navigate('/lobbies/create')}
          className="w-full py-4 bg-slate-800 border border-slate-700 text-white rounded-xl text-lg font-medium
                     active:scale-95 transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          <span className="text-xl">➕</span>
          Utwórz nową grę
        </button>
      </section>

    </div>
  );
};

export default HomeScreen;
