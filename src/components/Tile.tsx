import React from 'react';
import type { Tile as TileType } from '../types';
import { Scan } from 'lucide-react'; // Added icons
import { BaseIcon } from './BaseIcon';
import { DrillOverlay } from './DrillOverlay';
import { ResourceIcon } from './ResourceIcon';
import styles from './Tile.module.css';

interface TileProps {
    tile: TileType;
    onClick: (id: string) => void;
    isBase?: boolean;
    baseLevel?: number;
    currentUser?: string | null;
}

export const Tile: React.FC<TileProps> = ({ tile, onClick, isBase, baseLevel = 0, currentUser }) => {
    // Fog of War
    if (!tile.isVisible && !tile.isMined) {
        return <div className={styles.tileHidden} />;
    }

    const getIcon = () => {
        if (isBase) return <BaseIcon level={baseLevel} size={48} />;
        if (!tile.isProspected && !tile.isMined && tile.y !== 0) return <Scan className="text-gray-500" size={20} />;

        return <ResourceIcon type={tile.type} size={24} />;
    };

    const getBgClass = () => {
        if (tile.isMined) return styles.bgMined;
        if (!tile.isProspected && tile.y !== 0) return styles.bgUnknown; // New class

        // Surface specific background
        if (tile.y === 0) return styles.bgSurface;

        if (tile.type === 'bananium') return styles.bgBananium;
        if (tile.type === 'mineral') return styles.bgMineral;
        if (tile.type === 'rock') return styles.bgRock;
        return styles.bgSoil;
    };

    const getBorderClass = () => {
        if (!tile.isClaimed || !tile.claimedBy) return '';
        if (tile.claimedBy === currentUser) return styles.claimedByMe;
        return styles.claimedByOther;
    };

    return (
        <div
            onClick={() => onClick(tile.id)}
            className={`${styles.tile} ${getBgClass()} ${getBorderClass()}`}
            title={`${tile.type} (${tile.health}/${tile.maxHealth})`}
        >
            {/* Icon */}
            {!tile.isMined && getIcon()}

            {/* Prospect Progress */}
            {tile.isClaimed && !tile.isProspected && (
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${tile.prospectProgress}%` }} />
                </div>
            )}

            {/* Health Bar (Mining Progress) */}
            {!tile.isMined && tile.isProspected && tile.health < tile.maxHealth && (
                <div className={styles.healthBarContainer}>
                    <div
                        className={styles.healthBar}
                        style={{ width: `${(tile.health / tile.maxHealth) * 100}%` }}
                    />
                </div>
            )}

            {/* Job Overlays */}
            {tile.job === 'mine' && tile.assignedCrewIds && tile.assignedCrewIds.length > 0 && (
                <DrillOverlay depth={tile.y} timeLeft={tile.timeLeft || 0} />
            )}

            {/* Claim Owner Tag */}
            {tile.isClaimed && tile.claimedBy && !isBase && (
                <span
                    className={`absolute top-0.5 right-0.5 px-1 rounded text-[9px] font-mono font-bold uppercase ${
                        tile.claimedBy === currentUser
                            ? 'bg-cyan-500/80 text-slate-950'
                            : 'bg-rose-500/90 text-white'
                    }`}
                >
                    {tile.claimedBy === currentUser ? 'YOU' : tile.claimedBy.slice(0, 5)}
                </span>
            )}

            {/* Coordinates */}
            <span className={styles.coordinates}>
                {tile.x},{tile.y}
            </span>
        </div>
    );
};
