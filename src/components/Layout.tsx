import React, { useState } from 'react';
import styles from './Layout.module.css';
import { Menu, X, Compass, Users, FlaskConical, Shield, ArrowRightLeft, Radio, RotateCcw, UserCheck, Lock } from 'lucide-react';
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

const NAV_ITEMS = [
    { id: 'map' as const, label: 'Sector Radar', icon: Compass, accent: 'amber' },
    { id: 'crew' as const, label: 'Crew Bay', icon: Users, accent: 'cyan' },
    { id: 'research' as const, label: 'R&D Blueprints', icon: FlaskConical, accent: 'purple' },
    { id: 'base' as const, label: 'Command Dome', icon: Shield, accent: 'emerald' },
    { id: 'market' as const, label: 'Orbital Exchange', icon: ArrowRightLeft, accent: 'orange' },
];

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
    const { gameState, currentView, setCurrentView, resetWorld, logout } = useGame();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;
    const activeRigJobs = Object.values(gameState.tiles).filter(
        t => t.claimedBy === gameState.currentUser && Boolean(t.job)
    ).length;

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
                    <div className="flex items-center gap-3">
                        <h1 className={styles.title}>DeepMine</h1>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Rig Online
                        </span>
                        {activeRigJobs > 0 && (
                            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                                <Radio size={11} className="animate-pulse" />
                                1 Active Order
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {player && (
                        <>
                            <div
                                className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/30 px-2.5 py-1 rounded"
                                title="Credits"
                            >
                                <ResourceIcon type="credits" size={15} />
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono text-sm text-amber-400 font-bold">
                                        {player.resources.credits}
                                    </span>
                                    <span className="hidden sm:inline text-[10px] font-mono text-amber-500/70">CR</span>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-2 bg-slate-950/90 border border-purple-500/30 px-2.5 py-1 rounded"
                                title="Raw Minerals"
                            >
                                <ResourceIcon type="mineral" size={15} />
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono text-sm text-purple-300 font-bold">
                                        {player.inventory.mineral || 0}
                                    </span>
                                    <span className="hidden sm:inline text-[10px] font-mono text-purple-400/70">MIN</span>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-2 bg-slate-950/90 border border-yellow-400/30 px-2.5 py-1 rounded"
                                title="Bananium"
                            >
                                <ResourceIcon type="bananium" size={15} />
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono text-sm text-yellow-200 font-bold">
                                        {player.inventory.bananium || 0}
                                    </span>
                                    <span className="hidden sm:inline text-[10px] font-mono text-yellow-300/70">BAN</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <main className={styles.main}>
                {/* Sidebar / Command Deck */}
                <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
                    <div className="flex items-center justify-between px-2 mb-3">
                        <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-400/80">
                            // Command Deck
                        </h2>
                        <span className="text-[10px] font-mono text-slate-600">SYS.04</span>
                    </div>

                    <nav className="flex flex-col gap-1.5">
                        {!gameState.baseLocation ? (
                            <div className="p-3.5 rounded bg-amber-950/25 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
                                <div className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    Landing Required
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    Select any brown surface sector to deploy your Command Dome.
                                </p>
                            </div>
                        ) : (
                            NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setCurrentView(item.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all border-l-2 ${
                                            isActive
                                                ? 'bg-amber-500/10 text-amber-300 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.08)]'
                                                : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <Icon size={16} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                                        <span className="tracking-wide">{item.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-slate-800/90 flex flex-col gap-2">
                        <div className="bg-slate-950/80 border border-slate-800 rounded p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-500">CAPTAIN</span>
                                <span className="text-slate-100 font-bold truncate max-w-[120px]">
                                    {gameState.currentUser || 'Guest'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-500">DOME</span>
                                {gameState.baseLocation ? (
                                    <span className="text-emerald-400 font-bold">
                                        [{gameState.baseLocation}] LV.{gameState.baseLevel || 1}
                                    </span>
                                ) : (
                                    <span className="text-amber-400/80">UNDEPLOYED</span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-1.5">
                            <button
                                onClick={logout}
                                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] font-mono transition-colors flex items-center justify-center gap-1"
                                title="Switch Captain"
                            >
                                <UserCheck size={12} /> Switch
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Wipe the board and restart fresh? This clears all bases and claims for all players.')) {
                                        resetWorld();
                                    }
                                }}
                                className="flex-1 py-1.5 px-2 bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-800/50 rounded text-[11px] font-mono transition-colors flex items-center justify-center gap-1"
                                title="Wipe World"
                            >
                                <RotateCcw size={12} /> Wipe
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
                            className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] transition-colors flex items-center justify-center gap-1.5 font-mono"
                        >
                            <Lock size={11} /> Admin Terminal
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
