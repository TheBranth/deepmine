import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Box } from 'lucide-react';

export const TransportRenderer: React.FC = () => {
    const { gameState } = useGame();
    const { transportQueue, tiles } = gameState;
    const [now, setNow] = useState(() => Date.now());
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = () => {
            setNow(Date.now());
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    if (transportQueue.length === 0) return null;

    // Determine grid bounds for relative positioning
    // We assume the grid is rendered from minX, minY at 0,0 locally in the container
    // But GameContext tiles have absolute x,y.
    // We need to normalize.
    const tileValues = Object.values(tiles);
    if (tileValues.length === 0) return null;

    // Calculate Grid Offsets (same logic as TileGrid)
    const xs = tileValues.map(t => t.x);
    const minX = Math.min(...xs);
    const minY = Math.min(...tileValues.map(t => t.y)); // Usually 0

    const TILE_SIZE_REM = 6; // Matching Tile.module.css

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {transportQueue.map(task => {
                const fromTile = tiles[task.fromId];
                const toTile = tiles[task.toId];

                if (!fromTile || !toTile) return null;

                // Calculate Progress
                const elapsed = now - task.startTime;
                const progress = Math.min(1, Math.max(0, elapsed / task.duration));

                // Coordinates (normalized to grid container)
                const startX = (fromTile.x - minX) * TILE_SIZE_REM;
                const startY = (fromTile.y - minY) * TILE_SIZE_REM;
                const endX = (toTile.x - minX) * TILE_SIZE_REM;
                const endY = (toTile.y - minY) * TILE_SIZE_REM;

                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;

                const isMyTransport = task.ownerId === gameState.currentUser;
                const bgColor = isMyTransport ? 'bg-blue-600' : 'bg-amber-600'; // Blue for me, Amber for others

                return (
                    <div
                        key={task.id}
                        style={{
                            position: 'absolute',
                            left: `${currentX}rem`,
                            top: `${currentY}rem`,
                            width: `${TILE_SIZE_REM}rem`,
                            height: `${TILE_SIZE_REM}rem`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div className={`${bgColor} p-2 rounded-full shadow-lg animate-pulse text-white`}>
                            <Box size={24} />
                        </div>
                        {/* Optional: Show amount */}
                        <span className="absolute -top-1 bg-black/50 text-white text-xs px-1 rounded">
                            {task.amount}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
