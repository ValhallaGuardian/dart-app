import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Walidacja
    if (username.trim().length < 3 || username.trim().length > 15) {
      setError('Nick musi mieć 3-15 znaków');
      return;
    }
    if (password.length < 4) {
      setError('Hasło musi mieć min. 4 znaki');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await register(username.trim(), password);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      
      {/* Logo / Tytuł */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🎯</div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Utwórz konto
        </h1>
        <p className="text-slate-400 text-sm">Dołącz do Smart Dartboard</p>
      </div>

      {/* Formularz */}
      <div className="w-full max-w-sm space-y-4">
        
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Input - Nick */}
        <div>
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-slate-400 mb-2"
          >
            Nick
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Wybierz nick..."
            maxLength={15}
            autoComplete="username"
            autoFocus
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl 
                       text-white placeholder-slate-500
                       focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                       transition-all duration-200"
          />
          <p className="text-slate-500 text-xs mt-1">3-15 znaków</p>
        </div>

        {/* Input - Hasło */}
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-slate-400 mb-2"
          >
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Utwórz hasło..."
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl 
                       text-white placeholder-slate-500
                       focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                       transition-all duration-200"
          />
          <p className="text-slate-500 text-xs mt-1">Min. 4 znaki</p>
        </div>

        {/* Input - Potwierdź hasło */}
        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-slate-400 mb-2"
          >
            Potwierdź hasło
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Powtórz hasło..."
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl 
                       text-white placeholder-slate-500
                       focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                       transition-all duration-200"
          />
        </div>

        {/* Przycisk - Zarejestruj */}
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold
                     shadow-lg shadow-green-500/25 active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:active:scale-100 mt-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tworzenie konta...
            </span>
          ) : (
            'Zarejestruj się'
          )}
        </button>

        {/* Link do logowania */}
        <div className="text-center pt-4">
          <p className="text-slate-500 text-sm">
            Masz już konto?{' '}
            <Link to="/" className="text-green-400 font-medium">
              Zaloguj się
            </Link>
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-slate-600 text-xs">
          Smart Dartboard v1.0
        </p>
      </div>

    </div>
  );
};

export default RegisterScreen;
