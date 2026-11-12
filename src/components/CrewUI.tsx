import React from 'react';
import { useGame } from '../context/GameContext';
import { Users, Pickaxe, BookText, Wrench } from 'lucide-react';



const CREW_TYPES = [
    { id: 'miner', name: 'Miner', cost: 100, icon: Pickaxe, description: 'Extracts resources efficiently.' },
    { id: 'engineer', name: 'Engineer', cost: 150, icon: Wrench, description: 'Builds and maintains structures.' },
    { id: 'scientist', name: 'Scientist', cost: 200, icon: BookText, description: 'Speeds up surveying and research.' },
];

export const CrewUI: React.FC = () => {
    const { gameState, hireCrew } = useGame();
    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;

    if (!player) return null;

    return (
        <div className="w-full h-full bg-slate-950 text-slate-100 p-8 overflow-auto relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-0 w-72 h-72 bg-purple-900/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-6xl mx-auto space-y-8">
                {/* Header Panel */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col md:flex-row justify-between items-center shadow-xl">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Users className="text-blue-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Crew Management
                            </h2>
                            <p className="text-slate-400 text-sm">Recruit and manage your mining operation specialists.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950/50 px-6 py-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-sm uppercase tracking-wider">Available Credits</span>
                        <span className="text-2xl font-mono text-yellow-400 font-bold">{player.resources.credits}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Hiring Section - Takes up 7 columns */}
                    <div className="lg:col-span-7 space-y-6">
                        <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            Recruitment Center
                        </h3>
                        <div className="grid gap-4">
                            {CREW_TYPES.map((type) => (
                                <div
                                    key={type.id}
                                    className="group relative bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-blue-900/20"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-slate-800 rounded-xl group-hover:bg-blue-900/30 group-hover:scale-110 transition-all duration-300">
                                                <type.icon size={28} className="text-slate-400 group-hover:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">{type.name}</h4>
                                                <p className="text-sm text-slate-400 mt-1">{type.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <span className="text-yellow-400 font-mono font-bold">{type.cost} cr</span>
                                            <button
                                                onClick={() => hireCrew(type.id, type.cost)}
                                                disabled={player.resources.credits < type.cost}
                                                className={`px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${player.resources.credits >= type.cost
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                                    }`}
                                            >
                                                Hire Unit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roster Section - Takes up 5 columns */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                Active Roster
                            </h3>
                            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md border border-slate-700">
                                {player.crew.length} UNITS
                            </span>
                        </div>

                        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 h-[500px] overflow-y-auto space-y-3 shadow-inner">
                            {player.crew.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <Users size={48} className="opacity-20" />
                                    <p className="italic">No crew members assigned.</p>
                                </div>
                            ) : (
                                player.crew.map((member) => (
                                    <div key={member.id} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center hover:bg-slate-800 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                                                {member.type.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 text-sm group-hover:text-blue-300 transition-colors">{member.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{member.type}</div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${member.state === 'working'
                                                ? 'bg-blue-900/30 text-blue-300 border-blue-800'
                                                : 'bg-slate-700/50 text-slate-400 border-slate-600'
                                            }`}>
                                            {member.state.toUpperCase()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
