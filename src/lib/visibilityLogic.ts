import type { Tile } from '../types';

export const updateVisibility = (tiles: Record<string, Tile>, baseLocation?: string | null, radius: number = 1): Record<string, Tile> => {
    // If no base, everything underground is hidden (except maybe surface?)
    // Actually, surface (y=0) is always visible? Let's assume surface is visible for now.

    // Create a new map to avoid mutation
    const newTiles = { ...tiles };

    // 1. Reveal Surface (y=0) and check for Mined tiles to reveal neighbors
    // This is a simple pass. Since we don't have recursive cascades in a single tick (mining takes time), 
    // we just need to check: Is this tile Y=0? OR Is a neighbor Mined?
    // Actually, we iterate the "sources" of light.

    // Map of ID to Tile to return
    // We can't modify `newTiles` in place while iterating easily if we want to be pure, but we initialized it.

    // Better approach:
    // 1. Set all Y=0 to Visible.
    // 2. Find all Mined tiles.
    // 3. For each Mined tile (or Base), reveal neighbors.

    // Base logic: If base exists, it reveals neighbors (radius 1 default)
    // PLUS: Any Mined tile reveals its neighbors.

    const revealNeighbors = (tileId: string, range: number = 1) => {
        const source = newTiles[tileId];
        if (!source) return;

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                if (dx === 0 && dy === 0) continue;
                // Orthogonal only? User said "all tiles around it". Usually includes diagonals or just N/S/E/W?
                // "minable if it has an empty tile next to it". "Next to" usually implies orthogonal in grid games, but let's do Moore neighborhood (8) to be generous or Von Neumann (4)?
                // Let's stick to 8 (radius 1 box) as per previous code.

                const tx = source.x + dx;
                const ty = source.y + dy;
                const tid = `${tx},${ty}`;

                if (newTiles[tid]) {
                    // Reveal the tile
                    const isSurface = newTiles[tid].y === 0;
                    newTiles[tid] = {
                        ...newTiles[tid],
                        isVisible: true,
                        // Only Surface is automatically prospected
                        isProspected: newTiles[tid].isProspected || isSurface
                    };
                }
            }
        }
    };

    // Apply Surface Visibility & Reveal Neighbors of Surface
    // User rule: "all lv1 tiles are by default minable as the lv0 are automatically 'mined'"
    Object.values(newTiles).forEach(t => {
        if (t.y === 0) {
            newTiles[t.id] = { ...t, isVisible: true, isProspected: true };
            revealNeighbors(t.id, 1); // Reveal Y=1
        }
    });

    // Apply Base Radius
    if (baseLocation) {
        revealNeighbors(baseLocation, radius);
    }

    // Apply Mining Visibility (Chain Reaction)
    // We iterate original tiles to find sources
    Object.values(tiles).forEach(tile => {
        if (tile.isMined) {
            revealNeighbors(tile.id, 1);
        }
    });

    return newTiles;
};

export const getClaimRestriction = (
    tiles: Record<string, Tile>,
    baseLocation: string | null | undefined,
    username: string | null | undefined,
    targetTile: Tile | null | undefined
): { allowed: boolean; reason?: string } => {
    if (!targetTile || !username) return { allowed: false, reason: 'Invalid target' };
    if (!baseLocation || !tiles[baseLocation]) {
        return { allowed: false, reason: 'Deploy Command Dome on Surface (Row 0) first' };
    }
    if (targetTile.y === 0) {
        return { allowed: false, reason: 'Surface Row 0 is reserved for Command Domes' };
    }
    if (targetTile.isClaimed && targetTile.claimedBy !== username) {
        return { allowed: false, reason: `Claimed by ${targetTile.claimedBy}` };
    }

    const baseTile = tiles[baseLocation];
    const underBaseTile = tiles[`${baseTile.x},${baseTile.y + 1}`];
    const hasMinedTile = Object.values(tiles).some(t => t.isMined && t.claimedBy === username);

    if (!hasMinedTile && underBaseTile && !underBaseTile.isMined) {
        if (targetTile.id !== underBaseTile.id) {
            return {
                allowed: false,
                reason: `First turn: claim sector [${underBaseTile.x}, ${underBaseTile.y}] under your base first`,
            };
        }
    }

    return { allowed: true };
};
