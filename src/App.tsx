import { GameProvider, useGame } from './context/GameContext';
import { Layout } from './components/Layout';
import { TileGrid } from './components/TileGrid';
import { HomePage } from './pages/HomePage';
import './index.css';

const GameContent = () => {
  const { gameState } = useGame();

  if (!gameState.currentUser) {
    return <HomePage />;
  }

  return (
    <Layout>
      <TileGrid />
    </Layout>
  );
};

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App;
