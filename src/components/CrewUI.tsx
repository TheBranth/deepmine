import React from 'react';
import { useGame } from '../context/GameContext';
import { Users, Pickaxe, Compass, Wrench, Radio } from 'lucide-react';

const CREW_TYPES = [
    {
        id: 'miner',
        name: 'Core Driller',
        tag: 'HEAVY RIG',
        cost: 100,
        icon: Pickaxe,
        accent: 'amber',
        bonus: '+50% DRILL',
        description: 'High-torque laser cutter specialist for dense strata.',
    },
    {
        id: 'engineer',
        name: 'Field Engineer',
        tag: 'OUTPOST',
        cost: 150,
        icon: Wrench,
        accent: 'blue',
        bonus: '+25% RIG',
        description: 'Maintains relays, repair bays, and sub-surface haulers.',
    },
    {
        id: 'scientist',
        name: 'Geo-Surveyor',
        tag: 'RECON',
        cost: 200,
        icon: Compass,
        accent: 'cyan',
        bonus: '+50% SCAN',
        description: 'Deep-radar operator for rapid mineral & bananium sweeps.',
    },
];

export const CrewUI: React.FC = () => {
    const { gameState, hireCrew } = useGame();
    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;

    if (!player) return null;

    const workingCount = player.crew.filter(c => c.state === 'working').length;

    return (
        <div className="w-full h-full rig-grid-bg text-slate-100 p-4 sm:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Command Header */}
                <div className="bg-[#0b101a] border border-amber-500/30 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded border border-amber-500/30 text-amber-400">
                            <Users size={28} />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/80">
                                // Drop-Pod Personnel
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-wide text-slate-100 uppercase">
                                Rig Crew Bay
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-initial bg-slate-950 px-4 py-2 rounded border border-slate-800">
                            <div className="text-[10px] font-mono text-slate-500 uppercase">Active On-Site</div>
                            <div className="text-lg font-mono font-bold text-cyan-400">
                                {workingCount} / {player.crew.length}
                            </div>
                        </div>
                        <div className="flex-1 md:flex-initial bg-slate-950 px-4 py-2 rounded border border-amber-500/30">
                            <div className="text-[10px] font-mono text-slate-500 uppercase">Rig Budget</div>
                            <div className="text-lg font-mono text-amber-400 font-bold">
                                {player.resources.credits} CR
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Drop-Pod Dispatch (Hiring) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-amber-400">
                                Orbital Drop-Pod Dispatch
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500">INSTANT DEPLOYMENT</span>
                        </div>

                        <div className="grid gap-3">
                            {CREW_TYPES.map((type) => {
                                const canAfford = player.resources.credits >= type.cost;
                                const Icon = type.icon;
                                return (
                                    <div
                                        key={type.id}
                                        className="bg-[#0b101a] hover:bg-[#0f1624] border border-slate-800 hover:border-amber-500/40 rounded-lg p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-amber-400">
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-base text-slate-100">{type.name}</h4>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                                        {type.tag}
                                                    </span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                                                        {type.bonus}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                            <span className="text-amber-400 font-mono font-bold text-sm">{type.cost} CR</span>
                                            <button
                                                onClick={() => hireCrew(type.id, type.cost)}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all ${
                                                    canAfford
                                                        ? 'bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 border-b-2 border-amber-700'
                                                        : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                                                }`}
                                            >
                                                Drop Unit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Rig Units */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-cyan-400">
                                Deployed Rig Units
                            </h3>
                            <span className="text-[11px] font-mono text-slate-400">
                                {player.crew.length} TOTAL
                            </span>
                        </div>

                        <div className="bg-[#0b101a] rounded-lg border border-slate-800 p-3 h-[460px] overflow-y-auto space-y-2.5">
                            {player.crew.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 font-mono text-xs">
                                    <Users size={36} className="opacity-20" />
                                    <p>NO UNITS ON RIG</p>
                                </div>
                            ) : (
                                player.crew.map((member) => {
                                    const isWorking = member.state === 'working';
                                    return (
                                        <div
                                            key={member.id}
                                            className="bg-slate-950/90 p-3 rounded border border-slate-800/90 flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-2 h-8 rounded-full ${
                                                        isWorking ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                                                    }`}
                                                />
                                                <div>
                                                    <div className="font-bold text-slate-100 text-sm">{member.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-2">
                                                        <span>{member.type}</span>
                                                        <span className="text-slate-600">·</span>
                                                        <span>DIG x{member.stats?.digSpeed ?? 1}</span>
                                                        <span className="text-slate-600">·</span>
                                                        <span>SCAN x{member.stats?.prospectiveSpeed ?? 1}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`text-[10px] font-mono font-bold px-2 py-1 rounded border flex items-center gap-1 ${
                                                    isWorking
                                                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                                                        : 'bg-slate-900 text-slate-400 border-slate-700'
                                                }`}
                                            >
                                                {isWorking && <Radio size={10} className="animate-pulse" />}
                                                {isWorking
                                                    ? member.currentTileId
                                                        ? `[${member.currentTileId}]`
                                                        : 'ON-SITE'
                                                    : 'STANDBY'}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
