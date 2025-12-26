import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/api';
import type { AvatarPreset } from '../types';

const AVATAR_ICONS: Record<AvatarPreset, string> = {
  default: '👤',
  dart1: '🎯',
  dart2: '🎪',
  dart3: '🏆',
  player1: '😎',
  player2: '🤠',
  player3: '🧑‍🚀',
  player4: '🦸',
  crown: '👑',
  target: '🎯',
  bull: '🐂',
};

const AVATAR_COLORS: Record<AvatarPreset, string> = {
  default: 'bg-slate-600',
  dart1: 'bg-green-600',
  dart2: 'bg-purple-600',
  dart3: 'bg-yellow-600',
  player1: 'bg-blue-600',
  player2: 'bg-orange-600',
  player3: 'bg-indigo-600',
  player4: 'bg-red-600',
  crown: 'bg-amber-500',
  target: 'bg-emerald-600',
  bull: 'bg-rose-600',
};

type EditMode = 'none' | 'avatar' | 'username' | 'password';

const ProfileScreen = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [avatars, setAvatars] = useState<AvatarPreset[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPreset | null>(null);
  
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pobierz dostępne avatary
  useEffect(() => {
    profileApi.getAvatars()
      .then(setAvatars)
      .catch(console.error);
  }, []);

  // Inicjalizuj wartości po załadowaniu usera
  useEffect(() => {
    if (user) {
      setSelectedAvatar(user.avatar);
      setNewUsername(user.username);
    }
  }, [user]);

  if (!user) return null;

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === user.avatar) {
      setEditMode('none');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await profileApi.updateAvatar(selectedAvatar);
      updateUser({ ...user, avatar: selectedAvatar });
      setSuccess('Avatar został zmieniony!');
      setEditMode('none');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić avatara');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername === user.username) {
      setEditMode('none');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = await profileApi.updateUsername(newUsername.trim());
      updateUser(updatedUser);
      setSuccess('Nazwa użytkownika została zmieniona!');
      setEditMode('none');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić nazwy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Podaj aktualne hasło');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError('Nowe hasło musi mieć min. 4 znaki');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setIsLoading(true);

    try {
      await profileApi.updatePassword(currentPassword, newPassword);
      setSuccess('Hasło zostało zmienione!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEditMode('none');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić hasła');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode('none');
    setError('');
    setSuccess('');
    setSelectedAvatar(user.avatar);
    setNewUsername(user.username);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Oblicz procent wygranych
  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      
      {/* Header */}
      <header className="p-4 flex items-center border-b border-slate-800">
        <button
          onClick={() => navigate('/home')}
          className="p-2 -ml-2 text-slate-400 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-green-400 ml-2">Profil</h1>
      </header>

      {/* Komunikaty */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Profil - Avatar i nazwa */}
      <section className="p-6 flex flex-col items-center">
        {/* Avatar */}
        <button
          onClick={() => setEditMode('avatar')}
          className={`w-28 h-28 rounded-full ${AVATAR_COLORS[user.avatar]} border-4 border-green-500 
                     flex items-center justify-center mb-4 text-5xl
                     hover:scale-105 active:scale-95 transition-transform cursor-pointer
                     ${editMode === 'avatar' ? 'ring-4 ring-green-400/50' : ''}`}
          disabled={editMode !== 'none' && editMode !== 'avatar'}
        >
          {AVATAR_ICONS[user.avatar]}
        </button>
        
        {/* Nazwa użytkownika */}
        {editMode !== 'username' ? (
          <button
            onClick={() => setEditMode('username')}
            className="text-2xl font-bold mb-1 flex items-center gap-2 hover:text-green-400 transition-colors"
            disabled={editMode !== 'none'}
          >
            {user.username}
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        ) : (
          <div className="w-full max-w-xs">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-xl
                       focus:outline-none focus:border-green-500"
              placeholder="Nowa nazwa"
              maxLength={15}
              autoFocus
            />
          </div>
        )}
        <p className="text-slate-400 text-sm">Gracz</p>
      </section>

      {/* Edycja Avatara */}
      {editMode === 'avatar' && (
        <section className="px-4 mb-6 animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 text-center">
              Wybierz avatar
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${AVATAR_COLORS[avatar]} 
                             flex items-center justify-center text-2xl sm:text-3xl
                             transition-all duration-200
                             ${selectedAvatar === avatar 
                               ? 'ring-4 ring-green-400 scale-110' 
                               : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                >
                  {AVATAR_ICONS[avatar]}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-slate-700 rounded-lg font-medium active:scale-95 transition-transform"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveAvatar}
                className="flex-1 py-2 bg-green-500 rounded-lg font-medium active:scale-95 transition-transform
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || selectedAvatar === user.avatar}
              >
                {isLoading ? 'Zapisuję...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Edycja nazwy użytkownika */}
      {editMode === 'username' && (
        <section className="px-4 mb-6 animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 text-center">
              Zmień nazwę użytkownika
            </h3>
            <p className="text-slate-500 text-xs text-center mb-4">3-15 znaków</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-slate-700 rounded-lg font-medium active:scale-95 transition-transform"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveUsername}
                className="flex-1 py-2 bg-green-500 rounded-lg font-medium active:scale-95 transition-transform
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || newUsername === user.username || newUsername.length < 3}
              >
                {isLoading ? 'Zapisuję...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Zmiana hasła */}
      {editMode === 'password' && (
        <section className="px-4 mb-6 animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 text-center">
              Zmień hasło
            </h3>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg
                       focus:outline-none focus:border-green-500"
              placeholder="Aktualne hasło"
              autoFocus
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg
                       focus:outline-none focus:border-green-500"
              placeholder="Nowe hasło (min. 4 znaki)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg
                       focus:outline-none focus:border-green-500"
              placeholder="Powtórz nowe hasło"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-slate-700 rounded-lg font-medium active:scale-95 transition-transform"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                onClick={handleSavePassword}
                className="flex-1 py-2 bg-green-500 rounded-lg font-medium active:scale-95 transition-transform
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Zapisuję...' : 'Zmień hasło'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Przycisk zmiany hasła (gdy nie jesteśmy w trybie edycji) */}
      {editMode === 'none' && (
        <section className="px-4 mb-6">
          <button
            onClick={() => setEditMode('password')}
            className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl font-medium
                     flex items-center justify-center gap-2
                     active:scale-[0.98] transition-transform"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Zmień hasło
          </button>
        </section>
      )}

      {/* Statystyki */}
      <section className="px-4 mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Statystyki
        </h3>
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          {/* Główne statystyki */}
          <div className="grid grid-cols-2 divide-x divide-slate-700">
            <div className="p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{user.stats.gamesPlayed}</p>
              <p className="text-slate-400 text-sm">Rozegrane gry</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{user.stats.gamesWon}</p>
              <p className="text-slate-400 text-sm">Wygrane</p>
            </div>
          </div>
          
          <div className="border-t border-slate-700" />
          
          {/* Dodatkowe statystyki */}
          <div className="p-4 space-y-3">
            {/* Win rate */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Procent wygranych</span>
              <span className="font-bold text-blue-400">{winRate}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
            
            {/* Highest checkout */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 text-sm">Najwyższy checkout</span>
              <span className="font-bold text-yellow-400">{user.stats.highestCheckout}</span>
            </div>
            
            {/* Średnia na rundę */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Średnia punktów/rundę</span>
              <span className="font-bold text-purple-400">{user.stats.averagePerRound.toFixed(1)}</span>
            </div>
            
            {/* Suma punktów */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Łącznie zdobytych punktów</span>
              <span className="font-bold text-emerald-400">{user.stats.totalPoints.toLocaleString()}</span>
            </div>
            
            {/* Ulubiony tryb */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Ulubiony tryb</span>
              <span className="font-bold text-orange-400">
                {user.stats.favoriteMode || '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Podpowiedź */}
      {user.stats.gamesPlayed === 0 && (
        <p className="text-center text-slate-500 text-xs px-4 mb-4">
          Zagraj swoją pierwszą grę, aby zobaczyć statystyki!
        </p>
      )}

    </div>
  );
};

export default ProfileScreen;
