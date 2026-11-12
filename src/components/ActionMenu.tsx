import React from 'react';
import type { Tile } from '../types';
import styles from './ActionMenu.module.css';

import { useGame } from '../context/GameContext';

interface ActionMenuProps {
    tile: Tile;
    onClose: () => void;
    onSetJob: (job: 'prospect' | 'mine' | null) => void;
    onBuildBase: () => void;
    onManageBase: () => void;
    canBuildBase: boolean;
    isBase: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ tile, onClose, onSetJob, onBuildBase, onManageBase, canBuildBase, isBase }) => {
    const { gameState, buildStructure, dismantleStructure } = useGame();

    // Check if player has another active tile
    const currentUser = gameState.currentUser;
    const isLimitReached = React.useMemo(() => {
        if (!currentUser || !tile) return false;
        return Object.values(gameState.tiles).some(t =>
            t.claimedBy === currentUser &&
            t.id !== gameState.baseLocation &&
            t.id !== tile.id && // Don't count self
            (t.isClaimed) // Any claimed tile counts as active
        );
    }, [gameState.tiles, currentUser, gameState.baseLocation, tile]);

    const player = gameState.currentUser ? gameState.players[gameState.currentUser] : null;
    const canAffordRelay = player && player.resources.credits >= 150 && (player.inventory.mineral || 0) >= 50;
    const canAffordService = player && player.resources.credits >= 250 && (player.inventory.mineral || 0) >= 100;

    if (!tile) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>
                    Tile {tile.x},{tile.y}
                </h3>

                <div className={styles.actions}>
                    {canBuildBase && (
                        <button className={`${styles.button} ${styles.buttonClaim}`} onClick={onBuildBase} style={{ backgroundColor: '#16a34a' }}>
                            Establish Base
                        </button>
                    )}

                    {isBase && (
                        <div className="flex flex-col gap-2">
                            <div className="text-green-400 font-bold py-2">
                                Home Base (Level 1)
                            </div>
                            <button
                                className={`${styles.button} ${styles.buttonClaim}`}
                                onClick={onManageBase}
                                style={{ backgroundColor: '#2563eb' }}
                            >
                                Open Base Station
                            </button>
                        </div>
                    )}

                    {!isBase && !tile.isMined && !canBuildBase && (
                        <>
                            {!tile.isProspected && (
                                <button
                                    className={`${styles.button} ${tile.job === 'prospect' ? styles.buttonCancel : styles.buttonClaim}`}
                                    onClick={() => onSetJob(tile.job === 'prospect' ? null : 'prospect')}
                                    disabled={isLimitReached && tile.job !== 'prospect'}
                                    style={isLimitReached && tile.job !== 'prospect' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    {tile.job === 'prospect' ? 'Cancel Survey' : (isLimitReached ? 'Locked (Limit 1)' : 'Mark for Survey')}
                                </button>
                            )}

                            {tile.isProspected && (
                                <>
                                    <button
                                        className={`${styles.button} ${tile.job === 'mine' ? styles.buttonCancel : styles.buttonMine}`}
                                        onClick={() => onSetJob(tile.job === 'mine' ? null : 'mine')}
                                        disabled={isLimitReached && tile.job !== 'mine'}
                                        style={isLimitReached && tile.job !== 'mine' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        {tile.job === 'mine' ? 'Cancel Excavation' : (isLimitReached ? 'Locked (Limit 1)' : 'Mark for Excavation')}
                                    </button>

                                    {tile.isClaimed && tile.claimedBy === currentUser && !tile.job && (
                                        <button
                                            className={`${styles.button} ${styles.buttonCancel}`}
                                            onClick={() => onSetJob(null)}
                                            style={{ marginTop: '0.5rem', backgroundColor: '#ef4444' }}
                                        >
                                            Release Claim
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {tile.job && (
                        <div className="text-blue-300 text-sm py-2 italic">
                            {tile.assignedCrewIds && tile.assignedCrewIds.length > 0
                                ? `${tile.assignedCrewIds.length} Crew working...`
                                : 'Waiting for crew...'}
                        </div>
                    )}

                    {tile.isMined && (
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                            <div className="text-green-400 text-sm font-semibold">
                                Excavation Complete (Dug Tile)
                            </div>
                            
                            {!tile.structure ? (
                                <>
                                    <button
                                        onClick={() => {
                                            buildStructure(tile.id, 'relay');
                                            onClose();
                                        }}
                                        disabled={!canAffordRelay}
                                        className={`${styles.button}`}
                                        style={canAffordRelay ? { backgroundColor: '#2563eb' } : { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#334155' }}
                                    >
                                        Construct Relay (150 Cr, 50 Min)
                                    </button>
                                    <button
                                        onClick={() => {
                                            buildStructure(tile.id, 'service');
                                            onClose();
                                        }}
                                        disabled={!canAffordService}
                                        className={`${styles.button}`}
                                        style={canAffordService ? { backgroundColor: '#4f46e5' } : { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#334155' }}
                                    >
                                        Construct Station (250 Cr, 100 Min)
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-center">
                                    <div className="text-blue-300 font-bold capitalize">
                                        {tile.structure === 'relay' ? 'Logistics Relay' : 'Service Station'}
                                    </div>
                                    <button
                                        onClick={() => {
                                            dismantleStructure(tile.id);
                                            onClose();
                                        }}
                                        className={`${styles.button}`}
                                        style={{ backgroundColor: '#ef4444', marginTop: '0.5rem' }}
                                    >
                                        Dismantle Structure
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button className={`${styles.button} ${styles.buttonCancel}`} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
