import type { Tile, TileType } from '../types';

export const generateMap = (width: number, depth: number = width): Record<string, Tile> => {
    const map: Record<string, Tile> = {};
    const radius = Math.floor(width / 2);

    for (let x = -radius; x <= radius; x++) {
        for (let y = 0; y <= depth; y++) {
            let type: TileType = 'soil';
            let yieldAmount = 10;

            if (y === 0) {
                // Row 0 is reserved for Command Domes / surface operations
                type = 'soil';
                yieldAmount = 5;
            } else {
                const rand = Math.random();
                if (y === 1) {
                    // Shallow crust: soil, rock, or occasional iron — never bananium
                    if (rand > 0.85) type = 'iron';
                    else if (rand > 0.65) type = 'rock';
                    else type = 'soil';
                    yieldAmount = 8 + Math.floor(Math.random() * 5);
                } else if (y < 5) {
                    if (rand > 0.88) type = 'copper';
                    else if (rand > 0.72) type = 'iron';
                    else if (rand > 0.45) type = 'rock';
                    else type = 'soil';
                    yieldAmount = 10 + y * 2 + Math.floor(Math.random() * 6);
                } else if (y < 9) {
                    if (rand > 0.90) type = 'lithium';
                    else if (rand > 0.76) type = 'mineral';
                    else if (rand > 0.60) type = 'copper';
                    else if (rand > 0.45) type = 'iron';
                    else type = 'rock';
                    yieldAmount = 14 + y * 2 + Math.floor(Math.random() * 8);
                } else if (y < 14) {
                    // Mid-deep: rare bananium starts appearing
                    if (rand > 0.92) type = 'bananium';
                    else if (rand > 0.78) type = 'lithium';
                    else if (rand > 0.60) type = 'mineral';
                    else if (rand > 0.45) type = 'copper';
                    else type = 'rock';
                    yieldAmount = 18 + y * 2 + Math.floor(Math.random() * 10);
                } else {
                    // Deep core: rich bananium, lithium, and mineral veins
                    if (rand > 0.82) type = 'bananium';
                    else if (rand > 0.62) type = 'lithium';
                    else if (rand > 0.40) type = 'mineral';
                    else type = 'rock';
                    yieldAmount = 25 + y * 2 + Math.floor(Math.random() * 15);
                }
            }

            const baseHealth = y === 0 ? 50 : 60 + y * 20;
            let typeModifier = 1;
            switch (type) {
                case 'soil': typeModifier = 1; break;
                case 'rock': typeModifier = 1.4; break;
                case 'iron': typeModifier = 1.5; break;
                case 'copper': typeModifier = 1.6; break;
                case 'mineral': typeModifier = 1.8; break;
                case 'lithium': typeModifier = 2.0; break;
                case 'bananium': typeModifier = 2.5; break;
            }

            const health = Math.floor(baseHealth * typeModifier);
            const id = `${x},${y}`;

            map[id] = {
                id,
                x,
                y,
                type,
                health,
                maxHealth: health,
                yield: yieldAmount,
                isClaimed: false,
                claimedBy: undefined,
                isProspected: y === 0,
                isVisible: y === 0,
                prospectProgress: y === 0 ? 100 : 0,
                miningProgress: 0,
                isMined: false,
                structure: null,
                building: null,
            };
        }
    }

    return map;
};
