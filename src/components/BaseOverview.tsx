import React from 'react';
import { Shield, Pickaxe, Compass, Radio, Cpu, Layers } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const BaseOverview: React.FC = () => {
    const { gameState, getResearchBonus, setCurrentView } = useGame();
    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;
    const allTiles = Object.values(gameState.tiles);

    const minedCount = allTiles.filter(t => t.isMined).length;
    const prospectedCount = allTiles.filter(t => t.isProspected).length;
    const myStructures = allTiles.filter(t => t.claimedBy === gameState.currentUser && Boolean(t.structure));
    const relayCount = myStructures.filter(t => t.structure === 'relay').length;
    const serviceCount = myStructures.filter(t => t.structure === 'service').length;

    const digBonus = getResearchBonus('digSpeed');
    const visBonus = getResearchBonus('visibility');

    return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto rig-grid-bg text-slate-100">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Dome Header */}
                <div className="bg-[#0b101a] border border-emerald-500/35 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400">
                            <Shield size={30} />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">
                                // Surface Command Dome
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-100 uppercase tracking-wide">
                                Outpost [{gameState.baseLocation || '--'}]
                            </h2>
                            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
                                <span>TIER {gameState.baseLevel || 1}</span>
                                <span className="text-slate-700">|</span>
                                <span>CAPTAIN: <strong className="text-slate-200">{gameState.currentUser}</strong></span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setCurrentView('map')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded border-b-2 border-amber-700 transition-all"
                    >
                        Return to Radar
                    </button>
                </div>

                {/* Live Telemetry Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0b101a] border border-slate-800 rounded-lg p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Compass size={12} className="text-cyan-400" /> Scanned Sectors
                        </div>
                        <div className="text-2xl font-mono font-bold text-cyan-300 mt-1">
                            {prospectedCount} <span className="text-xs text-slate-600">/ {allTiles.length}</span>
                        </div>
                    </div>

                    <div className="bg-[#0b101a] border border-slate-800 rounded-lg p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Pickaxe size={12} className="text-amber-400" /> Excavated Caverns
                        </div>
                        <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                            {minedCount}
                        </div>
                    </div>

                    <div className="bg-[#0b101a] border border-slate-800 rounded-lg p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Radio size={12} className="text-blue-400" /> Relay Beacons
                        </div>
                        <div className="text-2xl font-mono font-bold text-blue-300 mt-1">
                            {relayCount}
                        </div>
                    </div>

                    <div className="bg-[#0b101a] border border-slate-800 rounded-lg p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Layers size={12} className="text-indigo-400" /> Repair Bays
                        </div>
                        <div className="text-2xl font-mono font-bold text-indigo-300 mt-1">
                            {serviceCount}
                        </div>
                    </div>
                </div>

                {/* Rig Systems & Crew Readout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0b101a] p-5 rounded-lg border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-amber-400">
                                Dome Subsystems
                            </h3>
                            <span className="text-[10px] font-mono text-emerald-400">NOMINAL</span>
                        </div>
                        <div className="space-y-2.5 text-xs font-mono">
                            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800/80">
                                <span className="text-slate-400">ASSIGNED CREW UNITS</span>
                                <span className="text-cyan-300 font-bold">{player?.crew.length || 0} UNITS</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800/80">
                                <span className="text-slate-400">DRILL SPEED MODIFIER</span>
                                <span className="text-amber-400 font-bold">+{Math.round(digBonus * 100)}%</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800/80">
                                <span className="text-slate-400">RADAR RADIUS BONUS</span>
                                <span className="text-emerald-400 font-bold">+{visBonus} SECTORS</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b101a] p-5 rounded-lg border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-cyan-400 flex items-center gap-1.5">
                                <Cpu size={14} /> Active Tech Modules
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400">
                                {gameState.researchedTechs.length} INSTALLED
                            </span>
                        </div>
                        {gameState.researchedTechs.length === 0 ? (
                            <div className="py-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded">
                                NO R&D BLUEPRINTS FABRICATED YET.
                                <div className="mt-2">
                                    <button
                                        onClick={() => setCurrentView('research')}
                                        className="text-cyan-400 hover:text-cyan-300 underline"
                                    >
                                        Open R&D Blueprints
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {gameState.researchedTechs.map(techId => (
                                    <span
                                        key={techId}
                                        className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded text-xs font-mono text-emerald-300 uppercase"
                                    >
                                        {techId}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
