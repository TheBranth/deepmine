import React, { useState } from 'react';
import { Coins, Flame, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ResourceIcon } from './ResourceIcon';
import type { ResourceType } from '../types';

export const MarketView: React.FC = () => {
    const { gameState, smeltResource, createListing, buyListing, cancelListing } = useGame();
    const [activeTab, setActiveTab] = useState<'bank' | 'market' | 'listings'>('bank');

    // Bank/Smelting State
    const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
    const [smeltAmount, setSmeltAmount] = useState(1);

    // Market State
    const [listResource, setListResource] = useState<ResourceType>('iron');
    const [listAmount, setListAmount] = useState(1);
    const [listPrice, setListPrice] = useState(10);

    const currentUser = gameState.currentUser!;
    const player = gameState.players[currentUser];
    const inventory = player?.inventory || {};

    const resources: ResourceType[] = ['iron', 'copper', 'lithium', 'bananium', 'mineral' as ResourceType];

    // --- Bank Logic ---
    const handleSmelt = () => {
        if (selectedResource && smeltAmount > 0) {
            smeltResource(selectedResource, smeltAmount);
        }
    };

    // --- Market Logic ---
    const handleCreateListing = () => {
        if (listAmount > 0 && listPrice > 0) {
            createListing(listResource, listAmount, listPrice);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
            {/* Header / Tabs */}
            <div className="flex border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('bank')}
                    className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'bank' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Flame size={20} /> Bank & Smelting
                </button>
                <button
                    onClick={() => setActiveTab('market')}
                    className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'market' ? 'bg-slate-800 text-green-400 border-b-2 border-green-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <TrendingUp size={20} /> Global Market
                </button>
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'listings' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <ArrowRightLeft size={20} /> My Listings
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'bank' && (
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Flame className="text-orange-500" /> Instant Smelting Service
                            </h3>
                            <p className="text-slate-300 text-sm mb-4">
                                Sell your raw resources directly to the system for Credits. Rates are lower than the open market, but instant.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {resources.map(res => (
                                    <button
                                        key={res}
                                        onClick={() => setSelectedResource(res)}
                                        className={`p-3 rounded-lg border text-center capitalize transition-all flex flex-col items-center gap-2 ${selectedResource === res
                                            ? 'bg-blue-600/80 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80'
                                            }`}
                                    >
                                        <ResourceIcon type={res} size={24} />
                                        <span className="font-bold text-sm">{res}</span>
                                        <div className="text-[10px] opacity-70">Owned: {inventory[res] || 0}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedResource && (
                                <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-slate-300">Amount to Smelt:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={inventory[selectedResource] || 0}
                                            value={smeltAmount}
                                            onChange={(e) => setSmeltAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-24 text-right"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-yellow-400 font-bold text-lg border-t border-slate-700 pt-2 mb-4">
                                        <span>Total Value:</span>
                                        <span className="flex items-center gap-1">
                                            {/* TODO: Dynamic Rates */}
                                            {smeltAmount * 10} <Coins size={16} />
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSmelt}
                                        disabled={!inventory[selectedResource] || inventory[selectedResource] < smeltAmount}
                                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition-colors"
                                    >
                                        Smelt for Credits
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4">Create New Listing</h3>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Resource</label>
                                    <select
                                        value={listResource}
                                        onChange={(e) => setListResource(e.target.value as ResourceType)}
                                        className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                                    >
                                        {resources.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={listAmount}
                                        onChange={(e) => setListAmount(parseInt(e.target.value))}
                                        className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 w-24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Price (Cr)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={listPrice}
                                        onChange={(e) => setListPrice(parseInt(e.target.value))}
                                        className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 w-24"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateListing}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold"
                                >
                                    List Item
                                </button>
                            </div>
                            <div className="text-xs text-slate-400 mt-2">
                                * 10% Market Fee applies on sale.
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white">Active Listings</h3>
                        <div className="grid gap-2">
                            {gameState.marketListings && gameState.marketListings.length > 0 ? (
                                gameState.marketListings.map(listing => (
                                    <div key={listing.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ResourceIcon type={listing.resource} size={36} />
                                            <div>
                                                <div className="text-white font-bold capitalize flex items-center gap-1">
                                                    {listing.amount}x {listing.resource}
                                                </div>
                                                <div className="text-xs text-slate-400">Seller: {gameState.players[listing.sellerId]?.name || 'Unknown'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-yellow-400 font-bold flex items-center gap-1 justify-end">
                                                    {listing.price} <Coins size={14} />
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {(listing.price / listing.amount).toFixed(1)} per unit
                                                </div>
                                            </div>
                                            {listing.sellerId !== currentUser && (
                                                <button
                                                    onClick={() => buyListing(listing.id)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold"
                                                >
                                                    Buy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-500 italic p-4 text-center">No active listings found.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'listings' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Your Listings</h3>
                        {gameState.marketListings?.filter(l => l.sellerId === currentUser).map(listing => (
                            <div key={listing.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex items-center justify-between opacity-75">
                                <div className="flex items-center gap-3">
                                    <ResourceIcon type={listing.resource} size={28} />
                                    <div>
                                        <div className="font-bold text-white capitalize">{listing.amount}x {listing.resource}</div>
                                        <div className="text-yellow-400 font-mono text-sm">{listing.price} Cr</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => cancelListing(listing.id)}
                                    className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-xs border border-red-800"
                                >
                                    Cancel (5% Penalty)
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
