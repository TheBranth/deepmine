import { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Layout } from './components/Layout';
import { TileGrid } from './components/TileGrid';
import { HomePage } from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';
import './index.css';

const GameContent = ({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
}) => {
  const { gameState } = useGame();

  if (currentPath.toLowerCase() === '/admindashboard') {
    return <AdminDashboard onNavigate={onNavigate} />;
  }

  if (!gameState.currentUser) {
    return <HomePage onNavigate={onNavigate} />;
  }

  return (
    <Layout onNavigate={onNavigate}>
      <TileGrid />
    </Layout>
  );
};

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return (
    <GameProvider>
      <GameContent currentPath={currentPath} onNavigate={navigate} />
    </GameProvider>
  );
}

export default App;
