import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { socketClient } from '../lib/socketClient';
import { ShieldAlert, Server, Users, Eye, RotateCcw, ArrowLeft, Coins, Gem, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
    onNavigate: (path: string) => void;
}

const ADMIN_USER = 'adminVinnie';
const ADMIN_PASS = 'b1d0n€';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const { gameState, login } = useGame();

    const [auth, setAuth] = useState<boolean>(() => {
        return sessionStorage.getItem('deepmine_admin_session') === 'active';
    });

    const [usernameInput, setUsernameInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successNotice, setSuccessNotice] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (usernameInput === ADMIN_USER && passwordInput === ADMIN_PASS) {
            sessionStorage.setItem('deepmine_admin_session', 'active');
            setAuth(true);
            setSuccessNotice('Welcome, Commander Vinnie. Admin session authorized.');
            setTimeout(() => setSuccessNotice(''), 4000);
        } else {
            setErrorMsg('Access denied. Invalid administrative credentials.');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('deepmine_admin_session');
        setAuth(false);
        setUsernameInput('');
        setPasswordInput('');
    };

    const handleLaunchAsAdmin = () => {
        // Boost adminVinnie if not boosted yet
        socketClient.send({
            type: 'ADMIN_GIVE_RESOURCES',
            username: ADMIN_USER,
            credits: 10000,
            mineral: 1000,
            bananium: 200,
        });
        login(ADMIN_USER);
        onNavigate('/');
    };

    const handleRevealAll = () => {
        socketClient.send({ type: 'ADMIN_REVEAL_ALL' });
        setSuccessNotice('Full subterranean radar activated. Fog of war lifted.');
        setTimeout(() => setSuccessNotice(''), 4000);
    };

    const handleResetWorld = () => {
        if (window.confirm('CRITICAL ACTION: Reset the entire world, all tiles, and player registrations?')) {
            socketClient.send({ type: 'RESET_WORLD' });
            localStorage.removeItem('deepmine_user');
            setSuccessNotice('Global world wipe executed. Map regenerated.');
            setTimeout(() => setSuccessNotice(''), 4000);
        }
    };

    const handleGiveResources = (username: string, credits: number, mineral: number, bananium: number) => {
        socketClient.send({
            type: 'ADMIN_GIVE_RESOURCES',
            username,
            credits,
            mineral,
            bananium,
        });
        setSuccessNotice(`Granted resources to ${username}: +${credits} Credits, +${mineral} Minerals, +${bananium} Bananium`);
        setTimeout(() => setSuccessNotice(''), 3000);
    };

    const handleClearBase = (username: string) => {
        if (window.confirm(`Clear base station for ${username}?`)) {
            socketClient.send({
                type: 'ADMIN_CLEAR_PLAYER_BASE',
                username,
            });
            setSuccessNotice(`Cleared base for ${username}`);
            setTimeout(() => setSuccessNotice(''), 3000);
        }
    };

    const tilesList = Object.values(gameState.tiles || {});
    const prospectedCount = tilesList.filter(t => t.isProspected).length;
    const minedCount = tilesList.filter(t => t.isMined).length;
    const playersList = Object.values(gameState.players || {});

    // If not logged in as admin, show Terminal Gate
    if (!auth) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
                <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/40 rounded-xl p-8 shadow-2xl backdrop-blur relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wider text-amber-400 uppercase font-mono">DeepMine // Command Terminal</h1>
                            <p className="text-xs text-slate-400">System Administrator Authentication</p>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-xs font-mono">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-slate-300 mb-1">ADMIN USERNAME</label>
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="Enter admin username"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-slate-300 mb-1">ACCESS CODE</label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Enter secret code"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
                        >
                            <LogIn size={16} /> Authenticate Session
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                        <button
                            onClick={() => onNavigate('/')}
                            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Game
                        </button>
                        <span className="text-slate-600 font-mono">DEEPMINE v0.9.4</span>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated Admin Dashboard
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Bar */}
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">DEEPMINE ADMIN COMMAND</h1>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-green-950 border border-green-500/40 text-green-400 rounded-full">
                                AUTHORIZED: {ADMIN_USER}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Subterranean operations & state inspector</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLaunchAsAdmin}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-md shadow flex items-center gap-1.5 transition-colors"
                    >
                        <LogIn size={14} /> Launch as {ADMIN_USER}
                    </button>
                    <button
                        onClick={() => onNavigate('/')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Map
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs rounded-md border border-red-800/60 flex items-center gap-1.5 transition-colors"
                    >
                        <LogOut size={14} /> Exit Admin
                    </button>
                </div>
            </header>

            {/* Notification Banner */}
            {successNotice && (
                <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-6 py-2.5 text-xs text-emerald-300 font-mono flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {successNotice}
                </div>
            )}

            {/* Dashboard Content */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
                {/* Stats & Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Map & World State */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <Server size={15} /> World Matrix
                                </h2>
                                <span className="text-[11px] font-mono text-slate-400">10 x 20 Grid</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                                    <div className="text-xs text-slate-400">Total Tiles</div>
                                    <div className="text-lg font-mono font-bold text-slate-100">{tilesList.length}</div>
                                </div>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                                    <div className="text-xs text-slate-400">Prospected</div>
                                    <div className="text-lg font-mono font-bold text-cyan-400">{prospectedCount}</div>
                                </div>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                                    <div className="text-xs text-slate-400">Excavated</div>
                                    <div className="text-lg font-mono font-bold text-yellow-400">{minedCount}</div>
                                </div>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                                    <div className="text-xs text-slate-400">Hidden Fog</div>
                                    <div className="text-lg font-mono font-bold text-slate-500">
                                        {tilesList.filter(t => !t.isVisible).length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleRevealAll}
                                className="flex-1 py-2 px-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Eye size={14} /> Reveal Full Map
                            </button>
                            <button
                                onClick={handleResetWorld}
                                className="flex-1 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-700/60 text-red-300 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw size={14} /> Wipe World
                            </button>
                        </div>
                    </div>

                    {/* Economy & Market Stats */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <Coins size={15} /> Economy Overview
                                </h2>
                                <span className="text-[11px] font-mono text-slate-400">Live Sync</span>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Total Registered Captains</span>
                                    <span className="text-sm font-mono font-bold text-slate-200">{playersList.length}</span>
                                </div>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Active Market Orders</span>
                                    <span className="text-sm font-mono font-bold text-amber-300">{(gameState.marketListings || []).length}</span>
                                </div>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Total Transport Tasks</span>
                                    <span className="text-sm font-mono font-bold text-blue-300">{(gameState.transportQueue || []).length}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleGiveResources(ADMIN_USER, 50000, 2500, 500)}
                            className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Gem size={14} /> Inject Admin Treasury (+50k)
                        </button>
                    </div>

                    {/* Admin Profile & Instructions */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                        <div>
                            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                                <Users size={15} /> Admin Direct Access
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                You can jump into the game at any time with full privileges. The URL <span className="font-mono text-amber-400">/adminDashboard</span> is always available.
                            </p>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono space-y-1 text-slate-400">
                                <div><span className="text-slate-500">USER:</span> <span className="text-amber-300 font-bold">{ADMIN_USER}</span></div>
                                <div><span className="text-slate-500">ROLE:</span> <span className="text-green-400">Super Administrator</span></div>
                                <div><span className="text-slate-500">PERM:</span> <span className="text-blue-400">World Wipe, Reveal, Resource Injection</span></div>
                            </div>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono mt-4">
                            Keep access credentials secure.
                        </div>
                    </div>
                </div>

                {/* Players Management Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                                <Users size={16} className="text-amber-400" /> Captains & Operations Roster
                            </h2>
                            <p className="text-xs text-slate-400">Active captains, claimed bases, and resource controls</p>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">
                            {playersList.length} Registered
                        </span>
                    </div>

                    {playersList.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-lg">
                            No active players found. The world is freshly wiped.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                                        <th className="py-2.5 px-3">Captain</th>
                                        <th className="py-2.5 px-3">Base Station</th>
                                        <th className="py-2.5 px-3">Credits</th>
                                        <th className="py-2.5 px-3">Minerals</th>
                                        <th className="py-2.5 px-3">Bananium</th>
                                        <th className="py-2.5 px-3">Crew</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {playersList.map((player) => (
                                        <tr key={player.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-3 font-semibold text-slate-200">
                                                {player.name || player.id}
                                                {player.id === ADMIN_USER && (
                                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                                                        ADMIN
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                {player.baseLocation ? (
                                                    <span className="text-emerald-400">
                                                        [{player.baseLocation}] (Lv {player.baseLevel || 1})
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">None</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-yellow-400 font-bold">
                                                {player.resources?.credits ?? 0}
                                            </td>
                                            <td className="py-3 px-3 text-purple-400">
                                                {player.inventory?.mineral ?? 0}
                                            </td>
                                            <td className="py-3 px-3 text-amber-300">
                                                {player.inventory?.bananium ?? 0}
                                            </td>
                                            <td className="py-3 px-3 text-slate-300">
                                                {player.crew?.length ?? 0} units
                                            </td>
                                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleGiveResources(player.id, 5000, 500, 100)}
                                                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded text-[11px] transition-colors"
                                                    title="Give +5,000 Credits, +500 Minerals, +100 Bananium"
                                                >
                                                    +Supply
                                                </button>
                                                {player.baseLocation && (
                                                    <button
                                                        onClick={() => handleClearBase(player.id)}
                                                        className="px-2 py-1 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 rounded text-[11px] transition-colors"
                                                        title="Dismantle base"
                                                    >
                                                        Clear Base
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        login(player.id);
                                                        onNavigate('/');
                                                    }}
                                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded text-[11px] transition-colors"
                                                    title="Impersonate and play"
                                                >
                                                    Play As
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
