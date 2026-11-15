import React from 'react';
import type { Tile, StructureType } from '../types';
import { useGame } from '../context/GameContext';
import { getClaimRestriction } from '../lib/visibilityLogic';
import { Crosshair, Pickaxe, Shield, Radio, Cpu, Bot, Orbit, X, Lock, Layers, Trash2 } from 'lucide-react';

const OUTPOST_SPECS: Array<{
    type: StructureType;
    label: string;
    effect: string;
    credits: number;
    mineral: number;
    icon: React.ComponentType<{ size?: number }>;
    colorClass: string;
}> = [
    {
        type: 'relay',
        label: 'Relay Beacon',
        effect: 'Zipline tube (<=5 cells, 3x shuttle)',
        credits: 150,
        mineral: 50,
        icon: Radio,
        colorClass: 'bg-blue-600 hover:bg-blue-500 border-b-2 border-blue-800',
    },
    {
        type: 'scanner',
        label: 'Scanner Array',
        effect: '2x survey speed in 1-3-5-7 cone below',
        credits: 250,
        mineral: 100,
        icon: Crosshair,
        colorClass: 'bg-cyan-600 hover:bg-cyan-500 border-b-2 border-cyan-800',
    },
    {
        type: 'command',
        label: 'Forward Command',
        effect: '+1 rig order & +35% drill (3 adj. cells)',
        credits: 300,
        mineral: 120,
        icon: Cpu,
        colorClass: 'bg-emerald-600 hover:bg-emerald-500 border-b-2 border-emerald-800',
    },
    {
        type: 'drone',
        label: 'Drone Drill',
        effect: 'Extracts 1 unit/hr passively',
        credits: 400,
        mineral: 150,
        icon: Bot,
        colorClass: 'bg-amber-600 hover:bg-amber-500 border-b-2 border-amber-800',
    },
    {
        type: 'wormhole',
        label: 'Wormhole Gate',
        effect: 'Warps to deepest explored row +1 (1 max)',
        credits: 300,
        mineral: 0,
        icon: Orbit,
        colorClass: 'bg-purple-600 hover:bg-purple-500 border-b-2 border-purple-800',
    },
];

interface ActionMenuProps {
    tile: Tile;
    onClose: () => void;
    onSetJob: (job: 'prospect' | 'mine' | null) => void;
    onBuildBase: () => void;
    onManageBase: () => void;
    canBuildBase: boolean;
    isBase: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    tile,
    onClose,
    onSetJob,
    onBuildBase,
    onManageBase,
    canBuildBase,
    isBase,
}) => {
    const { gameState, buildStructure, dismantleStructure } = useGame();

    const currentUser = gameState.currentUser;
    const { isLimitReached, maxActiveJobs } = React.useMemo(() => {
        if (!currentUser || !tile) return { isLimitReached: false, maxActiveJobs: 1 };
        const allTiles = Object.values(gameState.tiles);
        const commandPosts = allTiles.filter(
            t => t.structure === 'command' && t.claimedBy === currentUser
        ).length;
        const maxJobs = 1 + commandPosts;
        const activeCount = allTiles.filter(
            t =>
                t.claimedBy === currentUser &&
                t.id !== gameState.baseLocation &&
                t.id !== tile.id &&
                !t.isMined &&
                !t.structure &&
                Boolean(t.job)
        ).length;
        return { isLimitReached: activeCount >= maxJobs, maxActiveJobs: maxJobs };
    }, [gameState.tiles, currentUser, gameState.baseLocation, tile]);

    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;
    const claimRestriction = React.useMemo(
        () => getClaimRestriction(gameState.tiles, gameState.baseLocation, currentUser, tile),
        [gameState.tiles, gameState.baseLocation, currentUser, tile]
    );

    if (!tile) return null;

    const depthLabel = tile.y === 0 ? 'SURFACE' : `DEPTH -${tile.y * 15}M`;
    const strataLabel = tile.isMined
        ? 'CLEARED CAVERN'
        : tile.isProspected
            ? (tile.content || tile.type).toUpperCase()
            : 'UNSCANNED STRATA';

    const healthPct = tile.maxHealth > 0 ? Math.round((tile.health / tile.maxHealth) * 100) : 100;

    return (
        <div
            className="fixed inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xs bg-[#0b101a] border border-amber-500/40 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.85)] overflow-hidden text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Hazard / Telemetry Header */}
                <div className="hazard-stripe px-4 py-2.5 border-b border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-mono text-xs font-bold tracking-widest text-amber-300">
                            SECTOR [{tile.x}, {tile.y}]
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-0.5"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Sector Telemetry Readout */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-500 flex items-center gap-1">
                                <Layers size={11} /> {depthLabel}
                            </span>
                            <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                    tile.isMined
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                        : tile.isProspected
                                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                                }`}
                            >
                                {strataLabel}
                            </span>
                        </div>

                        {!tile.isMined && !isBase && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                    <span>
                                        {tile.job === 'prospect' ? 'RADAR SCAN' : 'ROCK INTEGRITY'}
                                    </span>
                                    <span>
                                        {tile.job === 'prospect'
                                            ? `${Math.round(tile.prospectProgress || 0)}%`
                                            : `${healthPct}%`}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            tile.job === 'prospect' ? 'bg-cyan-400' : 'bg-amber-500'
                                        }`}
                                        style={{
                                            width: `${
                                                tile.job === 'prospect'
                                                    ? Math.min(100, tile.prospectProgress || 0)
                                                    : healthPct
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col gap-2">
                        {canBuildBase && (
                            <button
                                onClick={onBuildBase}
                                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-slate-950 font-bold text-sm rounded border-b-2 border-emerald-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Shield size={16} /> Deploy Command Dome
                            </button>
                        )}

                        {isBase && (
                            <div className="space-y-2">
                                <div className="text-center text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 py-1.5 rounded">
                                    COMMAND DOME // LEVEL {gameState.baseLevel || 1}
                                </div>
                                <button
                                    onClick={onManageBase}
                                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-bold text-sm rounded border-b-2 border-amber-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Shield size={16} /> Open Dome Telemetry
                                </button>
                            </div>
                        )}

                        {!isBase && !tile.isMined && !canBuildBase && (
                            <>
                                {!claimRestriction.allowed && !tile.job && (
                                    <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded flex items-center gap-2">
                                        <Lock size={13} className="shrink-0" />
                                        <span>{claimRestriction.reason}</span>
                                    </div>
                                )}

                                {!tile.isProspected && (
                                    <button
                                        onClick={() => onSetJob(tile.job === 'prospect' ? null : 'prospect')}
                                        disabled={(isLimitReached || !claimRestriction.allowed) && tile.job !== 'prospect'}
                                        className={`w-full py-2.5 px-4 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                            tile.job === 'prospect'
                                                ? 'bg-red-900/70 hover:bg-red-800 text-red-100 border border-red-500/40'
                                                : isLimitReached || !claimRestriction.allowed
                                                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                                    : 'bg-cyan-500 hover:bg-cyan-400 active:translate-y-0.5 text-slate-950 border-b-2 border-cyan-700'
                                        }`}
                                    >
                                        {tile.job === 'prospect' ? (
                                            <>
                                                <X size={15} /> Abort Radar Scan
                                            </>
                                        ) : !claimRestriction.allowed ? (
                                            <>
                                                <Lock size={14} /> Sector Locked
                                            </>
                                        ) : isLimitReached ? (
                                            <>
                                                <Lock size={14} /> Rig Busy ({maxActiveJobs} Order Max)
                                            </>
                                        ) : (
                                            <>
                                                <Crosshair size={16} /> Ping Deep Scanner
                                            </>
                                        )}
                                    </button>
                                )}

                                {tile.isProspected && (
                                    <>
                                        <button
                                            onClick={() => onSetJob(tile.job === 'mine' ? null : 'mine')}
                                            disabled={(isLimitReached || !claimRestriction.allowed) && tile.job !== 'mine'}
                                            className={`w-full py-2.5 px-4 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                tile.job === 'mine'
                                                    ? 'bg-red-900/70 hover:bg-red-800 text-red-100 border border-red-500/40'
                                                    : isLimitReached || !claimRestriction.allowed
                                                        ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                                        : 'bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 border-b-2 border-amber-700'
                                            }`}
                                        >
                                            {tile.job === 'mine' ? (
                                                <>
                                                    <X size={15} /> Halt Drill Rig
                                                </>
                                            ) : !claimRestriction.allowed ? (
                                                <>
                                                    <Lock size={14} /> Sector Locked
                                                </>
                                            ) : isLimitReached ? (
                                                <>
                                                    <Lock size={14} /> Rig Busy ({maxActiveJobs} Order Max)
                                                </>
                                            ) : (
                                                <>
                                                    <Pickaxe size={16} /> Deploy Drill Rig
                                                </>
                                            )}
                                        </button>

                                        {tile.isClaimed && tile.claimedBy === currentUser && !tile.job && (
                                            <button
                                                onClick={() => onSetJob(null)}
                                                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-red-950/50 text-red-300 border border-red-800/40 rounded text-xs font-mono transition-colors"
                                            >
                                                Release Sector Claim
                                            </button>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {tile.job && (
                            <div className="text-center text-xs font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 py-1.5 rounded animate-pulse">
                                {tile.assignedCrewIds && tile.assignedCrewIds.length > 0
                                    ? `${tile.assignedCrewIds.length} RIG UNITS ON-SITE`
                                    : 'DISPATCHING RIG UNITS...'}
                            </div>
                        )}

                        {tile.isMined && (
                            <div className="space-y-2 pt-2 border-t border-slate-800">
                                {!tile.structure ? (
                                    <>
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center">
                                            Outpost Construction
                                        </div>
                                        {OUTPOST_SPECS.map((spec) => {
                                            const Icon = spec.icon;
                                            const hasWormhole =
                                                spec.type === 'wormhole' &&
                                                Object.values(gameState.tiles).some(
                                                    t => t.structure === 'wormhole' && t.claimedBy === gameState.currentUser
                                                );
                                            const canAfford =
                                                !hasWormhole &&
                                                Boolean(player) &&
                                                player!.resources.credits >= spec.credits &&
                                                (player!.inventory.mineral || 0) >= spec.mineral;
                                            return (
                                                <button
                                                    key={spec.type}
                                                    onClick={() => {
                                                        buildStructure(tile.id, spec.type);
                                                        onClose();
                                                    }}
                                                    disabled={!canAfford}
                                                    className={`w-full py-2 px-3 rounded text-left transition-all ${
                                                        canAfford
                                                            ? `${spec.colorClass} text-white`
                                                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="flex items-center gap-1.5">
                                                            <Icon size={13} /> {spec.label}
                                                        </span>
                                                        <span className="font-mono text-[10px] opacity-85">
                                                            {hasWormhole ? '1 Active Max' : `${spec.credits} CR · ${spec.mineral} MIN`}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                                                        {spec.effect}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="bg-slate-950/70 p-3 rounded border border-slate-800 space-y-2 text-center">
                                        {(() => {
                                            const activeSpec = OUTPOST_SPECS.find(s => s.type === tile.structure);
                                            return (
                                                <>
                                                    <div className="text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                                                        {activeSpec ? `${activeSpec.label} Online` : `${tile.structure} Online`}
                                                    </div>
                                                    {activeSpec && (
                                                        <div className="text-[10px] font-mono text-slate-400">
                                                            {activeSpec.effect}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <button
                                            onClick={() => {
                                                dismantleStructure(tile.id);
                                                onClose();
                                            }}
                                            className="w-full py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Trash2 size={12} /> Dismantle Outpost
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
