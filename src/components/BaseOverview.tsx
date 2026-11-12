import React, { useState } from 'react';
import { Activity, Settings } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const BaseOverview: React.FC = () => {
    const { gameState } = useGame();
    // TODO: Lift baseName state to context if needed globally or just keep here for now
    const [baseName] = useState('Alpha Outpost');

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-900/50">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        {baseName}
                        <Settings className="text-slate-500 cursor-pointer hover:text-slate-300" size={20} />
                    </h2>
                    <div className="text-slate-400 mt-2 flex gap-4">
                        <span>Level {gameState.baseLevel}</span>
                        <span className="text-slate-600">|</span>
                        <span>Owner: {gameState.currentUser}</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity className="text-white" size={32} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Base Statistics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-slate-300">
                            <span>Energy Output</span>
                            <span className="text-yellow-400 font-mono">150 kW</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Crew Capacity</span>
                            <span className="text-blue-400 font-mono">5 / 10</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Storage</span>
                            <span className="text-green-400 font-mono">45%</span>
                        </div>
                    </div>
                </div>

                {/* Upgrades Placeholder */}
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 opacity-50">
                    <h3 className="text-lg font-bold text-white mb-4">Module Upgrades</h3>
                    <div className="text-center py-8 text-slate-500 italic">
                        Constructing Research Lab...
                    </div>
                </div>
            </div>
        </div>
    );
};
