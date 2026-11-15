import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ResourceIcon } from './ResourceIcon';

export const SupplyRouteRenderer: React.FC = () => {
    const { gameState } = useGame();
    const { transportQueue, tiles, currentUser, baseLocation } = gameState;
    const [now, setNow] = useState(() => Date.now());
    const requestRef = useRef<number | null>(null);

    // Animation loop for smooth movement of cargo pulses
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

    // Get grid offsets to calculate coordinates
    const tileValues = Object.values(tiles);
    if (tileValues.length === 0) return null;

    const xs = tileValues.map(t => t.x);
    const minX = Math.min(...xs);
    const minY = Math.min(...tileValues.map(t => t.y));

    const TILE_SIZE_REM = 6; // Center line inside Tile.module.css

    const getCoords = (tileId: string) => {
        const tile = tiles[tileId];
        if (!tile) return null;
        return {
            x: (tile.x - minX) * TILE_SIZE_REM + TILE_SIZE_REM / 2,
            y: (tile.y - minY) * TILE_SIZE_REM + TILE_SIZE_REM / 2
        };
    };

    const getManhattanPath = (x1: number, y1: number, x2: number, y2: number) => {
        // Horizontal then Vertical path
        return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
    };

    const getPointOnManhattanPath = (x1: number, y1: number, x2: number, y2: number, progress: number) => {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const total = dx + dy;
        if (total === 0) return { x: x1, y: y1 };

        const threshold = dx / total; // proportion of horizontal distance
        if (progress <= threshold) {
            const segmentProgress = threshold > 0 ? progress / threshold : 0;
            return {
                x: x1 + (x2 - x1) * segmentProgress,
                y: y1
            };
        } else {
            const segmentProgress = threshold < 1 ? (progress - threshold) / (1 - threshold) : 0;
            return {
                x: x2,
                y: y1 + (y2 - y1) * segmentProgress
            };
        }
    };

    // 1. Render permanent zipline tubes between Base and Relays within 5 cells
    const relaySupplyLines: React.ReactElement[] = [];
    const hubs: Array<{ id: string; x: number; y: number }> = [];
    if (baseLocation && tiles[baseLocation]) {
        const b = tiles[baseLocation];
        hubs.push({ id: b.id, x: b.x, y: b.y });
    }
    Object.values(tiles).forEach(t => {
        if (t.structure === 'relay' && t.isMined && t.claimedBy === currentUser) {
            hubs.push({ id: t.id, x: t.x, y: t.y });
        }
    });

    for (let i = 0; i < hubs.length; i++) {
        for (let j = i + 1; j < hubs.length; j++) {
            const a = hubs[i];
            const b = hubs[j];
            const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            if (dist <= 5) {
                const cA = getCoords(a.id);
                const cB = getCoords(b.id);
                if (cA && cB) {
                    const pathData = `M ${cA.x} ${cA.y} L ${cB.x} ${cB.y}`;
                    relaySupplyLines.push(
                        <g key={`zipline-${a.id}-${b.id}`}>
                            <path
                                d={pathData}
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="3"
                                opacity="0.28"
                                strokeLinecap="round"
                            />
                            <path
                                d={pathData}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                                strokeDasharray="6 10"
                                strokeLinecap="round"
                                opacity="0.7"
                            />
                        </g>
                    );
                }
            }
        }
    }

    // 1b. Render Wormhole warp tethers between paired wormhole tiles
    const drawnWormholes = new Set<string>();
    Object.values(tiles).forEach(t => {
        const linkedId = t.building?.linkedTileId;
        if (t.structure === 'wormhole' && linkedId && tiles[linkedId]) {
            const pairKey = [t.id, linkedId].sort().join('--');
            if (drawnWormholes.has(pairKey)) return;
            drawnWormholes.add(pairKey);

            const cA = getCoords(t.id);
            const cB = getCoords(linkedId);
            if (cA && cB) {
                const pathData = `M ${cA.x} ${cA.y} L ${cB.x} ${cB.y}`;
                relaySupplyLines.push(
                    <g key={`wormhole-${pairKey}`}>
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="3.5"
                            opacity="0.3"
                            strokeLinecap="round"
                        />
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="1.75"
                            strokeDasharray="5 8"
                            strokeLinecap="round"
                            opacity="0.85"
                        />
                    </g>
                );
            }
        }
    });

    // 2. Render active transport lines (mining -> target)
    const activeRouteLines: React.ReactElement[] = [];
    const cargoPulses: React.ReactElement[] = [];

    transportQueue.forEach(task => {
        const fromCoords = getCoords(task.fromId);
        const toCoords = getCoords(task.toId);

        if (!fromCoords || !toCoords) return;

        const pathData = getManhattanPath(fromCoords.x, fromCoords.y, toCoords.x, toCoords.y);
        const isMyTask = task.ownerId === currentUser;

        // Path Colors
        const strokeColor = isMyTask ? '#0ea5e9' : '#b45309'; // sky-blue vs amber
        const glowColor = isMyTask ? 'rgba(56,189,248,0.4)' : 'rgba(245,158,11,0.4)';

        // Draw active transport path
        activeRouteLines.push(
            <path
                key={`active-route-${task.id}`}
                d={pathData}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-[flow_1.5s_linear_infinite]"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
            />
        );

        // Calculate Pulse Position
        const elapsed = now - task.startTime;
        const progress = Math.min(1, Math.max(0, elapsed / task.duration));
        const pulsePos = getPointOnManhattanPath(fromCoords.x, fromCoords.y, toCoords.x, toCoords.y, progress);

        // Draw glowing circular resource packet
        cargoPulses.push(
            <g key={`pulse-${task.id}`}>
                {/* Glow ring */}
                <circle
                    cx={`${pulsePos.x}rem`}
                    cy={`${pulsePos.y}rem`}
                    r="0.6rem"
                    fill={glowColor}
                    className="animate-pulse"
                />
                {/* Core particle */}
                <circle
                    cx={`${pulsePos.x}rem`}
                    cy={`${pulsePos.y}rem`}
                    r="0.3rem"
                    fill={isMyTask ? '#22d3ee' : '#f59e0b'}
                />
                {/* Mini Resource Icon Floating above for self shipments */}
                {isMyTask && progress > 0.05 && progress < 0.95 && (
                    <foreignObject
                        x={`${pulsePos.x - 0.4}rem`}
                        y={`${pulsePos.y - 0.9}rem`}
                        width="0.8rem"
                        height="0.8rem"
                        className="pointer-events-none"
                    >
                        <ResourceIcon type={task.resource} size={12} className="opacity-90 drop-shadow-md" />
                    </foreignObject>
                )}
            </g>
        );
    });

    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                    <style>
                        {`
                            @keyframes flow {
                                from { stroke-dashoffset: 18; }
                                to { stroke-dashoffset: 0; }
                            }
                        `}
                    </style>
                </defs>
                {/* 1. Permanent Relay-to-Base lines */}
                {relaySupplyLines}
                {/* 2. Active mining-to-base dashed lines */}
                {activeRouteLines}
                {/* 3. Glowing cargo particle pulses */}
                {cargoPulses}
            </svg>
        </div>
    );
};
