import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import HomeScreen from './components/HomeScreen';
import LobbiesScreen from './components/LobbiesScreen';
import CreateLobbyScreen from './components/CreateLobbyScreen';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';

// Komponent chroniący prywatne ścieżki
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-green-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

// Komponent przekierowujący zalogowanych
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-green-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Publiczne (niezalogowani) */}
      <Route path="/" element={<PublicRoute><LoginScreen /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />
      
      {/* Prywatne (zalogowani) */}
      <Route path="/home" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
      <Route path="/lobbies" element={<PrivateRoute><LobbiesScreen /></PrivateRoute>} />
      <Route path="/lobbies/create" element={<PrivateRoute><CreateLobbyScreen /></PrivateRoute>} />
      <Route path="/lobby/:id" element={<PrivateRoute><LobbyScreen /></PrivateRoute>} />
      <Route path="/game/:id" element={<PrivateRoute><GameScreen /></PrivateRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;