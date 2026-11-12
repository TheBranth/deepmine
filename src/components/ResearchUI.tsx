import React from 'react';
import { useGame } from '../context/GameContext';
import { RESEARCH_TREE, type ResearchNode } from '../data/researchTree';
import { Lock, Check, FlaskConical } from 'lucide-react';

export const ResearchUI: React.FC = () => {
    const { gameState, unlockTech } = useGame();
    const { researchedTechs } = gameState;
    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;

    const getTechStatus = (tech: ResearchNode): 'locked' | 'available' | 'researched' => {
        if (researchedTechs.includes(tech.id)) return 'researched';
        const reqsMet = tech.requirements.every(req => researchedTechs.includes(req));
        if (!reqsMet) return 'locked';
        return 'available'; // Affordability check handled in UI render
    };

    const handleUnlock = (tech: ResearchNode) => {
        if (!player) return;
        if (getTechStatus(tech) === 'available') {
            unlockTech(tech.id, tech.cost);
        }
    };

    // Categorize Techs
    const researched = RESEARCH_TREE.filter(t => getTechStatus(t) === 'researched');
    const available = RESEARCH_TREE.filter(t => getTechStatus(t) === 'available');
    const locked = RESEARCH_TREE.filter(t => getTechStatus(t) === 'locked');

    const renderTechCard = (tech: ResearchNode, status: 'researched' | 'available' | 'locked') => {
        const isAffordable = player && player.inventory.mineral >= tech.cost.minerals && player.inventory.bananium >= tech.cost.bananium;

        let cardStyle = "border-slate-700 bg-slate-800 opacity-50 cursor-not-allowed"; // locked default
        let buttonEvent = undefined;

        if (status === 'researched') {
            cardStyle = "border-green-500 bg-green-900/20";
        } else if (status === 'available') {
            if (isAffordable) {
                cardStyle = "border-green-400 bg-slate-800 hover:bg-slate-700 cursor-pointer shadow-[0_0_15px_rgba(74,222,128,0.2)]";
                buttonEvent = () => handleUnlock(tech);
            } else {
                cardStyle = "border-slate-500 bg-slate-800 cursor-not-allowed opacity-80";
            }
        }

        return (
            <div
                key={tech.id}
                className={`flex flex-col p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${cardStyle}`}
                onClick={buttonEvent}
            >
                {status === 'available' && isAffordable && (
                    <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-bl">
                        BUY
                    </div>
                )}

                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{tech.name}</h3>
                    {status === 'researched' ? <Check size={20} className="text-green-400" /> : status === 'locked' && <Lock size={16} className="text-slate-500" />}
                </div>

                <p className="text-sm text-slate-300 mb-4 flex-grow">{tech.description}</p>

                {status !== 'researched' && (
                    <div className="mt-auto pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-sm font-mono">
                        <div className={tech.cost.minerals > 0 ? (player && player.inventory.mineral >= tech.cost.minerals ? 'text-green-300' : 'text-red-400') : 'text-slate-500'}>
                            MIN: {tech.cost.minerals}
                        </div>
                        <div className={tech.cost.bananium > 0 ? (player && player.inventory.bananium >= tech.cost.bananium ? 'text-yellow-300' : 'text-red-400') : 'text-slate-500'}>
                            BAN: {tech.cost.bananium}
                        </div>
                    </div>
                )}
                {status === 'researched' && (
                    <div className="mt-auto pt-3 border-t border-green-500/30 text-xs text-green-400 font-mono uppercase tracking-wider">
                        Active
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-slate-950 overflow-auto relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 lg:p-6 flex flex-col md:flex-row justify-between items-center z-20 shadow-xl">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <FlaskConical className="text-purple-400" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Research Lab</h1>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Technology Tree</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm font-mono bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 shadow-inner">
                        <span className="text-slate-400">Min: <strong className="text-white ml-1">{player?.inventory.mineral || 0}</strong></span>
                        <div className="w-px h-4 bg-slate-800"></div>
                        <span className="text-slate-400">Ban: <strong className="text-yellow-400 ml-1">{player?.inventory.bananium || 0}</strong></span>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-16 pb-20">

                {/* Available Section */}
                <section className="relative">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <h2 className="text-2xl font-bold text-white">Available Research</h2>
                        <span className="text-sm font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{available.length} PROJECTS</span>
                    </div>

                    {available.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {available.map(t => renderTechCard(t, 'available'))}
                        </div>
                    ) : (
                        <div className="p-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-500 italic text-center">
                            No research currently available.
                        </div>
                    )}
                </section>

                {/* Researched Section */}
                {researched.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-1 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <h2 className="text-2xl font-bold text-slate-200">Completed Projects</h2>
                            <span className="text-sm font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{researched.length} DONE</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {researched.map(t => renderTechCard(t, 'researched'))}
                        </div>
                    </section>
                )}

                {/* Locked Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-slate-500">Future Technologies</h2>
                        <span className="text-sm font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{locked.length} LOCKED</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 grayscale opacity-50 hover:opacity-75 transition-opacity duration-500">
                        {locked.map(t => renderTechCard(t, 'locked'))}
                    </div>
                </section>

            </div>
        </div>
    );
};
