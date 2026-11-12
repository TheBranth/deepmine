import React, { useState } from 'react';
import styles from './Layout.module.css';
import { Menu, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CrewUI } from './CrewUI';
import { ResearchUI } from './ResearchUI';
import { BaseOverview } from './BaseOverview';
import { MarketView } from './MarketView';
import { ResourceIcon } from './ResourceIcon';

interface LayoutProps {
    children: React.ReactNode;
    onNavigate?: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
    const { gameState, currentView, setCurrentView, resetWorld, logout } = useGame();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <h1 className={styles.title}>DeepMine</h1>
                </div>
                <div className={styles.stats}>
                    {gameState.currentUser && gameState.players[gameState.currentUser] && (
                        <>
                            <div className={styles.statItem} title="Credits">
                                <ResourceIcon type="credits" size={16} />
                                <span className="font-mono text-yellow-400 font-bold">
                                    {gameState.players[gameState.currentUser].resources.credits}
                                </span>
                            </div>
                            <div className={styles.statItem} title="Minerals">
                                <ResourceIcon type="mineral" size={16} />
                                <span className="font-mono text-purple-400 font-bold">
                                    {gameState.players[gameState.currentUser].inventory.mineral || 0}
                                </span>
                            </div>
                            <div className={styles.statItem} title="Bananium">
                                <ResourceIcon type="bananium" size={16} />
                                <span className="font-mono text-yellow-200 font-bold">
                                    {gameState.players[gameState.currentUser].inventory.bananium || 0}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </header>
            <main className={styles.main}>
                {/* Sidebar / Mobile Menu */}
                <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''} `}>
                    <h2 className={styles.sidebarTitle}>Operations</h2>
                    <nav className={styles.nav}>
                        {!gameState.baseLocation ? (
                            <div className="p-4 text-sm text-yellow-300">
                                Claim a base tile on the surface to start the operation.
                            </div>
                        ) : (
                            <>
                                <button
                                    className={`${styles.navButton} ${currentView === 'map' ? 'bg-slate-700 text-white' : ''}`}
                                    onClick={() => {
                                        setCurrentView('map');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Map
                                </button>
                                <button
                                    className={`${styles.navButton} ${currentView === 'crew' ? 'bg-slate-700 text-white' : ''}`}
                                    onClick={() => {
                                        setCurrentView('crew');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Crew
                                </button>
                                <button
                                    className={`${styles.navButton} text-blue-300 border-blue-800 hover:bg-blue-900/50 ${currentView === 'research' ? 'bg-blue-900/50' : ''}`}
                                    onClick={() => {
                                        setCurrentView('research');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Research
                                </button>
                                <button
                                    className={`${styles.navButton} text-green-300 border-green-800 hover:bg-green-900/50 ${currentView === 'base' ? 'bg-green-900/50' : ''}`}
                                    onClick={() => {
                                        setCurrentView('base');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Base Station
                                </button>
                                <button
                                    className={`${styles.navButton} text-yellow-300 border-yellow-800 hover:bg-yellow-900/50 ${currentView === 'market' ? 'bg-yellow-900/50' : ''}`}
                                    onClick={() => {
                                        setCurrentView('market');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Market
                                </button>
                            </>
                        )}
                    </nav>

                    <div className="mt-auto p-4 border-t border-slate-700/60 flex flex-col gap-2">
                        <div className="text-xs text-slate-400">
                            Captain: <span className="font-semibold text-slate-200">{gameState.currentUser || 'Guest'}</span>
                        </div>
                        {gameState.baseLocation && (
                            <div className="text-xs text-green-400">
                                Base: <span className="font-mono text-slate-300">{gameState.baseLocation} (Lv {gameState.baseLevel || 1})</span>
                            </div>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={logout}
                                className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-xs transition-colors"
                            >
                                Switch Captain
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Wipe the board and restart fresh? This clears all bases and claims for all players.')) {
                                        resetWorld();
                                    }
                                }}
                                className="flex-1 py-1 px-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded text-xs transition-colors"
                            >
                                Reset World
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                if (onNavigate) {
                                    onNavigate('/adminDashboard');
                                } else {
                                    window.location.href = '/adminDashboard';
                                }
                            }}
                            className="w-full mt-1 py-1 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs transition-colors flex items-center justify-center gap-1 font-mono"
                        >
                            🔒 Admin Dashboard
                        </button>
                    </div>
                </aside>

                {/* Game View Content Switching */}
                <div className={styles.content}>
                    {currentView === 'map' && children}
                    {currentView === 'crew' && <CrewUI />}
                    {currentView === 'research' && <ResearchUI />}
                    {currentView === 'base' && <BaseOverview />}
                    {currentView === 'market' && <MarketView />}
                </div>

                {/* Overlay for mobile */}
                {isMenuOpen && (
                    <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />
                )}
            </main>
        </div>
    );
};
