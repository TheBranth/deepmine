import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Tile } from './Tile';
import { ActionMenu } from './ActionMenu';
import { SupplyRouteRenderer } from './SupplyRouteRenderer';
import { SubterraneanCanvas } from '../gfx/SubterraneanCanvas';
import { Box, Layers } from 'lucide-react';
import styles from './TileGrid.module.css';

export const TileGrid: React.FC = () => {
    const { gameState, buildBase, setTileJob, setCurrentView } = useGame();
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

    const tiles = Object.values(gameState.tiles);

    if (tiles.length === 0) return <div>No tiles generated</div>;

    // Determine grid size based on coordinates
    const xs = tiles.map(t => t.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const width = maxX - minX + 1;

    const handleTileClick = (id: string) => {
        const tile = gameState.tiles[id];
        if (!gameState.baseLocation && tile.y !== 0) return;
        if (tile.y !== 0 && !tile.isVisible) return;

        setSelectedTileId(id);
    };

    const handleCloseMenu = () => {
        setSelectedTileId(null);
    };

    const handleBuildBase = () => {
        if (selectedTileId) {
            buildBase(selectedTileId);
            handleCloseMenu();
        }
    };

    const activeTile = selectedTileId ? gameState.tiles[selectedTileId] : null;

    return (
        <div className={styles.gridContainer}>
            {/* View Mode Switcher */}
            <div className="absolute top-4 right-4 z-40 flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
                <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === '3d'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Box size={14} /> 3D Diorama
                </button>
                <button
                    onClick={() => setViewMode('2d')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === '2d'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Layers size={14} /> 2D Grid
                </button>
            </div>

            {viewMode === '3d' ? (
                <div className="w-full h-full min-h-[600px] relative p-4">
                    <SubterraneanCanvas
                        onSelectTile={handleTileClick}
                        selectedTileId={selectedTileId}
                    />
                </div>
            ) : (
                <div
                    className={styles.grid}
                    style={{
                        gridTemplateColumns: `repeat(${width}, min-content)`
                    }}
                >
                    {tiles
                        .sort((a, b) => (a.y - b.y) || (a.x - b.x))
                        .map((tile) => (
                            <Tile
                                key={tile.id}
                                tile={tile}
                                onClick={handleTileClick}
                                isBase={tile.id === gameState.baseLocation}
                                baseLevel={gameState.baseLevel}
                                currentUser={gameState.currentUser}
                            />
                        ))}
                    <SupplyRouteRenderer />
                </div>
            )}

            {activeTile && (
                <ActionMenu
                    tile={activeTile}
                    onClose={handleCloseMenu}
                    onSetJob={(job) => {
                        setTileJob(activeTile.id, job);
                        handleCloseMenu();
                    }}
                    onBuildBase={handleBuildBase}
                    onManageBase={() => {
                        setCurrentView('base');
                        handleCloseMenu();
                    }}
                    canBuildBase={activeTile.y === 0 && !gameState.baseLocation}
                    isBase={activeTile.id === gameState.baseLocation}
                />
            )}
        </div>
    );
};
