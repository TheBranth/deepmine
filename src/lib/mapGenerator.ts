import type { Tile, TileType } from '../types';

export const generateMap = (width: number, depth: number = width): Record<string, Tile> => {
    const map: Record<string, Tile> = {};
    const radius = Math.floor(width / 2);

    for (let x = -radius; x <= radius; x++) {
        for (let y = 0; y <= depth; y++) {
            let type: TileType = 'soil';
            let health = 100;

            // Surface Level (y=0)
            if (y === 0) {
                type = 'soil';
                health = 50;
            } else {
                // Underground (y > 0)
                const rand = Math.random();

                // Generation Logic based on depth (y)
                if (y < 2) {
                    type = 'soil';
                } else if (y < 5) {
                    if (rand > 0.8) type = 'rock';
                } else if (y < 10) {
                    if (rand > 0.85) type = 'mineral';
                    else if (rand > 0.6) type = 'rock';
                } else {
                    // Deep underground
                    if (rand > 0.95) type = 'bananium';
                    else if (rand > 0.85) type = 'mineral';
                    else if (rand > 0.5) type = 'rock';
                }
            }

            // Adjust health based on type and depth
            const baseHealth = y === 0 ? 10 : 180 * (y * y); // 180 health / 1.5 speed = 120 ticks = 60s

            let typeModifier = 1;
            switch (type) {
                case 'soil': typeModifier = 1; break;
                case 'rock': typeModifier = 1.5; break;
                case 'mineral': typeModifier = 2; break;
                case 'bananium': typeModifier = 3; break;
            }

            health = Math.floor(baseHealth * typeModifier);

            const id = `${x},${y}`;
            map[id] = {
                id,
                x,
                y,
                type,
                health,
                maxHealth: health,
                isClaimed: false,
                claimedBy: undefined,

                isProspected: false,
                isVisible: y === 0, // Surface is always visible
                prospectProgress: 0,
                miningProgress: 0,

                isMined: false,
            };
        }
    }

    return map;
};
