import React, { useState } from 'react';
import { Coins, Flame, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ResourceIcon } from './ResourceIcon';
import type { ResourceType } from '../types';

export const MarketView: React.FC = () => {
    const { gameState, smeltResource, createListing, buyListing, cancelListing } = useGame();
    const [activeTab, setActiveTab] = useState<'bank' | 'market' | 'listings'>('bank');

    // Refinery State
    const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
    const [smeltAmount, setSmeltAmount] = useState(1);

    // Exchange State
    const [listResource, setListResource] = useState<ResourceType>('iron');
    const [listAmount, setListAmount] = useState(1);
    const [listPrice, setListPrice] = useState(10);

    const currentUser = gameState.currentUser!;
    const player = gameState.players[currentUser];
    const inventory = player?.inventory || {};

    const resources: ResourceType[] = ['iron', 'copper', 'lithium', 'bananium', 'mineral' as ResourceType];

    const handleSmelt = () => {
        if (selectedResource && smeltAmount > 0) {
            smeltResource(selectedResource, smeltAmount);
        }
    };

    const handleCreateListing = () => {
        if (listAmount > 0 && listPrice > 0) {
            createListing(listResource, listAmount, listPrice);
        }
    };

    const myListings = gameState.marketListings?.filter(l => l.sellerId === currentUser) || [];

    return (
        <div className="flex flex-col h-full rig-grid-bg text-slate-100 overflow-hidden">
            {/* Header / Tabs */}
            <div className="bg-[#0b101a] border-b border-amber-500/25 flex flex-wrap">
                <button
                    onClick={() => setActiveTab('bank')}
                    className={`flex-1 min-w-[140px] px-4 py-3.5 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                        activeTab === 'bank'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                >
                    <Flame size={16} /> Ore Refinery
                </button>
                <button
                    onClick={() => setActiveTab('market')}
                    className={`flex-1 min-w-[140px] px-4 py-3.5 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                        activeTab === 'market'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                >
                    <TrendingUp size={16} /> Orbital Exchange
                </button>
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`flex-1 min-w-[140px] px-4 py-3.5 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                        activeTab === 'listings'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                >
                    <ArrowRightLeft size={16} /> My Contracts ({myListings.length})
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'bank' && (
                        <div className="bg-[#0b101a] p-5 sm:p-6 rounded-lg border border-slate-800 space-y-5 shadow-xl">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                                <div>
                                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-orange-400">
                                        // Surface Smelter
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2 mt-0.5">
                                        <Flame className="text-orange-500" size={20} /> Instant Ore Refinery
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        Melt raw cargo directly into Credits at a fixed orbital rate (10 CR/unit).
                                    </p>
                                </div>
                                <div className="text-right font-mono text-xs bg-slate-950 px-3 py-1.5 rounded border border-slate-800 shrink-0">
                                    <div className="text-[10px] text-slate-500">TREASURY</div>
                                    <div className="text-amber-400 font-bold">{player?.resources.credits || 0} CR</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {resources.map(res => {
                                    const owned = inventory[res] || 0;
                                    const isSelected = selectedResource === res;
                                    return (
                                        <button
                                            key={res}
                                            onClick={() => setSelectedResource(res)}
                                            className={`p-3 rounded-lg border text-center capitalize transition-all flex flex-col items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-orange-500/15 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                                            }`}
                                        >
                                            <ResourceIcon type={res} size={22} />
                                            <span className="font-bold text-xs uppercase font-mono tracking-wider">{res}</span>
                                            <div className="text-[11px] font-mono text-slate-400">
                                                CARGO: <strong className={owned > 0 ? 'text-slate-100' : 'text-slate-600'}>{owned}</strong>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedResource && (
                                <div className="bg-slate-950 p-4 rounded-lg border border-orange-500/30 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono uppercase text-slate-300">
                                            Batch Quantity ({selectedResource})
                                        </span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={inventory[selectedResource] || 0}
                                            value={smeltAmount}
                                            onChange={(e) => setSmeltAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white font-mono w-28 text-right focus:outline-none focus:border-orange-400"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-amber-400 font-mono font-bold text-base border-t border-slate-800 pt-3">
                                        <span className="text-xs uppercase text-slate-400">Refinery Payout</span>
                                        <span className="flex items-center gap-1.5">
                                            +{smeltAmount * 10} <Coins size={16} />
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSmelt}
                                        disabled={!inventory[selectedResource] || inventory[selectedResource] < smeltAmount}
                                        className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded border-b-2 border-orange-700 disabled:border-slate-700 transition-all"
                                    >
                                        Engage Smelter
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'market' && (
                        <div className="space-y-6">
                            <div className="bg-[#0b101a] p-5 rounded-lg border border-slate-800 shadow-xl">
                                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">
                                    // Freight Dispatch
                                </div>
                                <h3 className="text-lg font-extrabold text-white uppercase tracking-wide mb-4">
                                    Post Cargo Contract
                                </h3>
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Cargo Type</label>
                                        <select
                                            value={listResource}
                                            onChange={(e) => setListResource(e.target.value as ResourceType)}
                                            className="bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded px-3 py-2"
                                        >
                                            {resources.map(r => (
                                                <option key={r} value={r}>
                                                    {r.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Units</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={listAmount}
                                            onChange={(e) => setListAmount(parseInt(e.target.value) || 1)}
                                            className="bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded px-3 py-2 w-24"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Ask Price (CR)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={listPrice}
                                            onChange={(e) => setListPrice(parseInt(e.target.value) || 1)}
                                            className="bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded px-3 py-2 w-24"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateListing}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded font-mono font-bold text-xs uppercase tracking-wider border-b-2 border-emerald-700"
                                    >
                                        Broadcast Offer
                                    </button>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-3">
                                    * Orbital docking tariff: 10% deducted on sale.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-slate-300 border-b border-slate-800 pb-2">
                                    Open Orbital Contracts
                                </h3>
                                {gameState.marketListings && gameState.marketListings.length > 0 ? (
                                    <div className="grid gap-2.5">
                                        {gameState.marketListings.map(listing => (
                                            <div
                                                key={listing.id}
                                                className="bg-[#0b101a] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ResourceIcon type={listing.resource} size={32} />
                                                    <div>
                                                        <div className="text-white font-mono font-bold text-sm uppercase">
                                                            {listing.amount}x {listing.resource}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-slate-400">
                                                            CAPTAIN: {gameState.players[listing.sellerId]?.name || listing.sellerId}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right font-mono">
                                                        <div className="text-amber-400 font-bold text-sm flex items-center gap-1 justify-end">
                                                            {listing.price} <Coins size={13} />
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {(listing.price / listing.amount).toFixed(1)} CR/u
                                                        </div>
                                                    </div>
                                                    {listing.sellerId !== currentUser && (
                                                        <button
                                                            onClick={() => buyListing(listing.id)}
                                                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase"
                                                        >
                                                            Acquire
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 font-mono text-xs p-8 text-center border border-dashed border-slate-800 rounded-lg">
                                        NO OPEN CARGO CONTRACTS ON ORBITAL EXCHANGE.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'listings' && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-cyan-400 border-b border-slate-800 pb-2">
                                Your Posted Contracts
                            </h3>
                            {myListings.length === 0 ? (
                                <div className="text-slate-500 font-mono text-xs p-8 text-center border border-dashed border-slate-800 rounded-lg">
                                    YOU HAVE NO ACTIVE CARGO CONTRACTS.
                                </div>
                            ) : (
                                myListings.map(listing => (
                                    <div
                                        key={listing.id}
                                        className="bg-[#0b101a] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ResourceIcon type={listing.resource} size={28} />
                                            <div>
                                                <div className="font-mono font-bold text-sm text-white uppercase">
                                                    {listing.amount}x {listing.resource}
                                                </div>
                                                <div className="text-amber-400 font-mono text-xs">{listing.price} CR</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => cancelListing(listing.id)}
                                            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded text-xs font-mono border border-red-800/50"
                                        >
                                            Abort (5% Fee)
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
