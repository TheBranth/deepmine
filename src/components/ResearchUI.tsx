import React from 'react';
import { useGame } from '../context/GameContext';
import { RESEARCH_TREE, type ResearchNode } from '../data/researchTree';
import { Lock, Check, FlaskConical, Cpu } from 'lucide-react';

export const ResearchUI: React.FC = () => {
    const { gameState, unlockTech } = useGame();
    const { researchedTechs } = gameState;
    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;

    const getTechStatus = (tech: ResearchNode): 'locked' | 'available' | 'researched' => {
        if (researchedTechs.includes(tech.id)) return 'researched';
        const reqsMet = tech.requirements.every(req => researchedTechs.includes(req));
        if (!reqsMet) return 'locked';
        return 'available';
    };

    const handleUnlock = (tech: ResearchNode) => {
        if (!player) return;
        if (getTechStatus(tech) === 'available') {
            unlockTech(tech.id, tech.cost);
        }
    };

    const researched = RESEARCH_TREE.filter(t => getTechStatus(t) === 'researched');
    const available = RESEARCH_TREE.filter(t => getTechStatus(t) === 'available');
    const locked = RESEARCH_TREE.filter(t => getTechStatus(t) === 'locked');

    const renderTechCard = (tech: ResearchNode, status: 'researched' | 'available' | 'locked') => {
        const hasMinerals = (player?.inventory.mineral || 0) >= tech.cost.minerals;
        const hasBananium = (player?.inventory.bananium || 0) >= tech.cost.bananium;
        const isAffordable = Boolean(player && hasMinerals && hasBananium);

        let cardStyle = 'border-slate-800 bg-[#0b101a]/70 opacity-60 cursor-not-allowed';
        let buttonEvent = undefined;

        if (status === 'researched') {
            cardStyle = 'border-emerald-500/50 bg-emerald-950/20';
        } else if (status === 'available') {
            if (isAffordable) {
                cardStyle =
                    'border-cyan-400/70 bg-[#0b101a] hover:bg-[#101827] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.12)]';
                buttonEvent = () => handleUnlock(tech);
            } else {
                cardStyle = 'border-slate-700 bg-[#0b101a] cursor-not-allowed opacity-85';
            }
        }

        return (
            <div
                key={tech.id}
                className={`flex flex-col p-4 rounded-lg border transition-all duration-200 relative overflow-hidden ${cardStyle}`}
                onClick={buttonEvent}
            >
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-0.5">
                            BP // {tech.id.toUpperCase()}
                        </div>
                        <h3 className="font-bold text-base text-slate-100">{tech.name}</h3>
                    </div>

                    {status === 'researched' ? (
                        <span className="p-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-400">
                            <Check size={15} />
                        </span>
                    ) : status === 'locked' ? (
                        <span className="p-1 bg-slate-900 border border-slate-800 rounded text-slate-500">
                            <Lock size={14} />
                        </span>
                    ) : isAffordable ? (
                        <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded uppercase">
                            Fabricate
                        </span>
                    ) : null}
                </div>

                <p className="text-xs text-slate-400 mb-4 flex-grow leading-relaxed">{tech.description}</p>

                {status !== 'researched' ? (
                    <div className="mt-auto pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div
                            className={`px-2 py-1 rounded bg-slate-950 border border-slate-800/80 ${
                                tech.cost.minerals > 0
                                    ? hasMinerals
                                        ? 'text-purple-300'
                                        : 'text-red-400'
                                    : 'text-slate-600'
                            }`}
                        >
                            MIN: {tech.cost.minerals}
                        </div>
                        <div
                            className={`px-2 py-1 rounded bg-slate-950 border border-slate-800/80 ${
                                tech.cost.bananium > 0
                                    ? hasBananium
                                        ? 'text-yellow-300'
                                        : 'text-red-400'
                                    : 'text-slate-600'
                            }`}
                        >
                            BAN: {tech.cost.bananium}
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto pt-2.5 border-t border-emerald-500/20 text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <Cpu size={12} /> System Online
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full rig-grid-bg overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0b101a]/95 backdrop-blur-md border-b border-amber-500/25 p-4 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/10 rounded border border-cyan-500/30 text-cyan-400">
                        <FlaskConical size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80">
                            // Engineering Core
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
                            R&D Blueprints
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 px-4 py-2 rounded border border-slate-800">
                    <span className="text-slate-400">
                        MIN: <strong className="text-purple-300 ml-1">{player?.inventory.mineral || 0}</strong>
                    </span>
                    <div className="w-px h-4 bg-slate-800" />
                    <span className="text-slate-400">
                        BAN: <strong className="text-yellow-300 ml-1">{player?.inventory.bananium || 0}</strong>
                    </span>
                </div>
            </div>

            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-12 pb-20">
                {/* Available Section */}
                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-5">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400">
                            Available Blueprints
                        </h2>
                        <span className="text-[11px] font-mono text-slate-400">{available.length} READY</span>
                    </div>

                    {available.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {available.map(t => renderTechCard(t, 'available'))}
                        </div>
                    ) : (
                        <div className="p-10 bg-[#0b101a]/50 rounded-lg border border-dashed border-slate-800 text-slate-500 font-mono text-xs text-center uppercase tracking-wider">
                            All unlocked blueprints fabricated.
                        </div>
                    )}
                </section>

                {/* Researched Section */}
                {researched.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-5">
                            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-emerald-400">
                                Active Rig Upgrades
                            </h2>
                            <span className="text-[11px] font-mono text-slate-400">{researched.length} ONLINE</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {researched.map(t => renderTechCard(t, 'researched'))}
                        </div>
                    </section>
                )}

                {/* Locked Section */}
                <section>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-5">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
                            Classified Schematics
                        </h2>
                        <span className="text-[11px] font-mono text-slate-600">{locked.length} LOCKED</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {locked.map(t => renderTechCard(t, 'locked'))}
                    </div>
                </section>
            </div>
        </div>
    );
};
