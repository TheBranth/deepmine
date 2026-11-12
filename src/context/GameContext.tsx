import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameState, Player, Tile, TransportTask, ResourceType, CrewMember, MarketListing, CrewType } from '../types';
import { generateMap } from '../lib/mapGenerator';
import { updateVisibility } from '../lib/visibilityLogic';
import { RESEARCH_TREE } from '../data/researchTree';
import { socketClient, type ServerMessage } from '../lib/socketClient';

interface GameContextType {
    gameState: GameState;
    // Methods to manipulate state
    addPlayer: (player: Player) => void;
    updateTile: (tile: Tile) => void;
    login: (username: string) => void;
    buildBase: (tileId: string) => void;
    buildStructure: (tileId: string, structure: 'relay' | 'service') => void;
    dismantleStructure: (tileId: string) => void;
    unlockTech: (techId: string, cost: { minerals: number, bananium: number }) => void;
    getResearchBonus: (type: string) => number;
    setTileJob: (tileId: string, job: 'prospect' | 'mine' | null) => void;
    hireCrew: (type: string, cost: number) => void;
    // Navigation
    currentView: 'map' | 'crew' | 'research' | 'base' | 'market';
    setCurrentView: (view: 'map' | 'crew' | 'research' | 'base' | 'market') => void;
    // Market / Bank
    smeltResource: (resource: ResourceType, amount: number) => void;
    createListing: (resource: ResourceType, amount: number, price: number) => void;
    buyListing: (listingId: string) => void;
    cancelListing: (listingId: string) => void;
}

const defaultState: GameState = {
    players: {}, // Using an object for quick lookups by ID
    tiles: updateVisibility(generateMap(10, 20)), // Generate map 10 wide, 20 deep
    currentUser: null,
    baseLocation: null,
    baseLevel: 0,
    researchedTechs: [],
    transportQueue: [],
    marketListings: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameState, setGameState] = useState<GameState>(defaultState);
    const [currentView, setCurrentView] = useState<'map' | 'crew' | 'research' | 'base' | 'market'>('map');

    // Multiplayer Server State Synchronization
    useEffect(() => {
        const unsubscribe = socketClient.subscribe((msg: ServerMessage) => {
            if (msg.type === 'INIT_STATE') {
                const s = msg.state as Partial<GameState>;
                setGameState(prev => ({
                    ...prev,
                    tiles: s?.tiles || prev.tiles,
                    players: s?.players || prev.players,
                    marketListings: s?.marketListings || prev.marketListings,
                    transportQueue: s?.transportQueue || prev.transportQueue,
                }));
            } else if (msg.type === 'STATE_UPDATE' || msg.type === 'TICK_UPDATE') {
                const tiles = msg.tiles as Record<string, Tile> | undefined;
                const players = msg.players as Record<string, Player> | undefined;
                const transportQueue = msg.transportQueue as TransportTask[] | undefined;
                setGameState(prev => ({
                    ...prev,
                    tiles: tiles || prev.tiles,
                    players: { ...prev.players, ...players },
                    transportQueue: transportQueue !== undefined ? transportQueue : prev.transportQueue,
                }));
            } else if (msg.type === 'TILE_UPDATED') {
                const tile = msg.tile as Tile | undefined;
                if (tile) {
                    setGameState(prev => ({
                        ...prev,
                        tiles: { ...prev.tiles, [tile.id]: tile }
                    }));
                }
            } else if (msg.type === 'MARKET_UPDATED') {
                const listings = msg.listings as MarketListing[] | undefined;
                if (listings) {
                    setGameState(prev => ({
                        ...prev,
                        marketListings: listings
                    }));
                }
            } else if (msg.type === 'PLAYER_JOINED') {
                const player = msg.player as Player | undefined;
                if (player) {
                    setGameState(prev => ({
                        ...prev,
                        players: { ...prev.players, [player.id]: player }
                    }));
                }
            }
        });

        return unsubscribe;
    }, []);

    const addPlayer = (player: Player) => {
        setGameState((prev) => ({
            ...prev,
            players: { ...prev.players, [player.id]: player },
        }));
    };

    const updateTile = (tile: Tile) => {
        setGameState((prev) => {
            const newTiles = { ...prev.tiles, [`${tile.x},${tile.y}`]: tile };
            // If tile was mined, update visibility
            // Optimization: check if isMined changed
            if (tile.isMined && !prev.tiles[tile.id].isMined) {
                return {
                    ...prev,
                    tiles: updateVisibility(newTiles, prev.baseLocation),
                };
            }
            return {
                ...prev,
                tiles: newTiles,
            };
        });
    };

    const login = (username: string) => {
        setGameState((prev) => ({
            ...prev,
            currentUser: username,
        }));
        socketClient.send({ type: 'LOGIN', username });
    };

    const getResearchBonus = (type: string): number => {
        let total = 0;
        // Need to check researchedTechs from state
        gameState.researchedTechs.forEach(id => {
            const tech = RESEARCH_TREE.find(t => t.id === id);
            if (tech && tech.effect.type === type) {
                total += tech.effect.value;
            }
        });
        return total;
    };

    const buildBase = (tileId: string) => {
        if (gameState.currentUser) {
            socketClient.send({ type: 'BUILD_BASE', tileId, username: gameState.currentUser });
        }
        setGameState((prev) => {
            const newBaseLocation = tileId;

            // Calculate Visibility Radius
            let radius = 1; // Base radius
            prev.researchedTechs.forEach(id => {
                const tech = RESEARCH_TREE.find(t => t.id === id);
                if (tech && tech.effect.type === 'visibility') {
                    radius += tech.effect.value;
                }
            });

            // The base reveals adjacent tiles
            const tilesWithBaseVisibility = updateVisibility(prev.tiles, newBaseLocation, radius);

            // Mark the base tile as claimed and prospected (it's your home)
            const baseTile = tilesWithBaseVisibility[newBaseLocation];
            baseTile.isClaimed = true;
            baseTile.isProspected = true;
            baseTile.claimedBy = prev.currentUser || 'player';

            return {
                ...prev,
                tiles: tilesWithBaseVisibility,
                baseLocation: newBaseLocation,
                baseLevel: 1,
            };
        });
    };

    const buildStructure = (tileId: string, structure: 'relay' | 'service') => {
        if (gameState.currentUser) {
            socketClient.send({ type: 'BUILD_STRUCTURE', tileId, structure, username: gameState.currentUser });
        }
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            if (!player) return prev;

            const cost = structure === 'relay'
                ? { credits: 150, mineral: 50 }
                : { credits: 250, mineral: 100 };

            if (player.resources.credits >= cost.credits && (player.inventory.mineral || 0) >= cost.mineral) {
                // Deduct cost
                const newResources = {
                    ...player.resources,
                    credits: player.resources.credits - cost.credits
                };
                const newInventory = {
                    ...player.inventory,
                    mineral: (player.inventory.mineral || 0) - cost.mineral
                };

                const tile = prev.tiles[tileId];
                const updatedTile: Tile = {
                    ...tile,
                    structure,
                    isClaimed: true,
                    claimedBy: prev.currentUser!
                };

                return {
                    ...prev,
                    tiles: {
                        ...prev.tiles,
                        [tileId]: updatedTile
                    },
                    players: {
                        ...prev.players,
                        [prev.currentUser!]: {
                            ...player,
                            resources: newResources,
                            inventory: newInventory
                        }
                    }
                };
            }
            return prev;
        });
    };

    const dismantleStructure = (tileId: string) => {
        if (gameState.currentUser) {
            socketClient.send({ type: 'DISMANTLE_STRUCTURE', tileId, username: gameState.currentUser });
        }
        setGameState(prev => {
            const tile = prev.tiles[tileId];
            if (!tile || tile.claimedBy !== prev.currentUser) return prev;

            const updatedTile: Tile = {
                ...tile,
                structure: null,
                isClaimed: false,
                claimedBy: undefined
            };

            return {
                ...prev,
                tiles: {
                    ...prev.tiles,
                    [tileId]: updatedTile
                }
            };
        });
    };

    const unlockTech = (techId: string, cost: { minerals: number, bananium: number }) => {
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            if (!player) return prev;

            // Deduct cost
            const newInventory = { ...player.inventory };
            if (newInventory.mineral >= cost.minerals && newInventory.bananium >= cost.bananium) {
                newInventory.mineral -= cost.minerals;
                newInventory.bananium -= cost.bananium;

                const newResearchedTechs = [...prev.researchedTechs, techId];

                // Update Visibility if it was a visibility tech
                // This is tricky: we need to re-run updateVisibility with the new radius
                let radius = 1;
                newResearchedTechs.forEach(id => {
                    const tech = RESEARCH_TREE.find(t => t.id === id);
                    if (tech && tech.effect.type === 'visibility') {
                        radius += tech.effect.value;
                    }
                });

                // Only update visibility if base exists
                const newTiles = prev.baseLocation ? updateVisibility(prev.tiles, prev.baseLocation, radius) : prev.tiles;

                return {
                    ...prev,
                    tiles: newTiles,
                    players: {
                        ...prev.players,
                        [prev.currentUser!]: {
                            ...player,
                            inventory: newInventory
                        }
                    },
                    researchedTechs: newResearchedTechs
                };
            }
            return prev;
        });
    };

    // --- GAME LOOP ---
    useEffect(() => {
        const tickRate = 500; // 0.5s tick
        const interval = setInterval(() => {
            setGameState(prev => {
                const newState = { ...prev };
                const player = newState.currentUser ? newState.players[newState.currentUser] : null;

                if (!player) return prev; // No player logged in

                let tiles = { ...newState.tiles };
                const crew = [...player.crew];
                let stateChanged = false;

                // 1. Assign Idle Crew to Jobs
                const idleCrewIndices = crew.map((c, i) => c.state === 'idle' ? i : -1).filter(i => i !== -1);

                // Find the active job tile for this player (assuming single tile limit)
                const activeJobTiles = Object.values(tiles).filter(t => t.job && t.claimedBy === newState.currentUser);

                if (activeJobTiles.length > 0 && idleCrewIndices.length > 0) {
                    const targetTile = activeJobTiles[0];

                    idleCrewIndices.forEach(crewIdx => {
                        const crewMember = crew[crewIdx];
                        crew[crewIdx] = { ...crewMember, state: 'working', currentTileId: targetTile.id };

                        // Update tile's crew list
                        const currentIds = tiles[targetTile.id].assignedCrewIds || [];
                        // Avoid duplicates just in case
                        if (!currentIds.includes(crewMember.id)) {
                            tiles[targetTile.id] = {
                                ...tiles[targetTile.id],
                                assignedCrewIds: [...currentIds, crewMember.id]
                            };
                        } else {
                            // Already in list? Just update reference
                            tiles[targetTile.id] = { ...tiles[targetTile.id] };
                        }
                        stateChanged = true;
                    });
                }

                // Find tiles needing jobs
                // Priority: Build Base? Survey? Mine?
                // Let's say: Survey -> Mine
                // const jobTiles = Object.values(tiles).filter(t => t.job && !t.assignedCrewId); // DEPRECATED logics && t.assignedCrewIds.length > 0);

                // 2. Process Active Jobs (Iterate Tiles)
                const processingTiles = Object.values(tiles).filter(t => t.job && t.assignedCrewIds && t.assignedCrewIds.length > 0);

                processingTiles.forEach(tile => {
                    // Calculate Total Speed
                    let totalSpeed = 0;

                    // Filter out invalid crew IDs (if crew fired/died?)
                    const validCrewIds = tile.assignedCrewIds!.filter(id => crew.find(c => c.id === id));

                    validCrewIds.forEach(crewId => {
                        const c = crew.find(member => member.id === crewId);
                        if (!c) return;

                        const prospectiveSpeed = c.stats?.prospectiveSpeed ?? 1;
                        const digSpeed = c.stats?.digSpeed ?? 1;

                        if (tile.job === 'prospect') {
                            totalSpeed += 10 * prospectiveSpeed;
                        } else if (tile.job === 'mine') {
                            let bonus = 0;
                            newState.researchedTechs.forEach(id => {
                                const tech = RESEARCH_TREE.find(t => t.id === id);
                                if (tech && tech.effect.type === 'mining_speed') bonus += tech.effect.value;
                            });
                            totalSpeed += 1 * digSpeed * (1 + bonus);
                        }
                    });

                    // Update Time Left
                    if (totalSpeed > 0) {
                        const ticksLeft = tile.health / totalSpeed;
                        tiles[tile.id].timeLeft = Math.ceil(ticksLeft * tickRate);
                    }

                    // Apply Progress
                    let completed = false;
                    if (tile.job === 'prospect') {
                        const newProgress = Math.min((tile.prospectProgress || 0) + totalSpeed, 100);
                        tiles[tile.id] = { ...tile, prospectProgress: newProgress };
                        if (newProgress >= 100) {
                            tiles[tile.id].isProspected = true;
                            tiles[tile.id].job = null;
                            tiles[tile.id].assignedCrewIds = [];
                            completed = true;
                        }
                        stateChanged = true;
                    } else if (tile.job === 'mine') {
                        const newHealth = Math.max(0, tile.health - totalSpeed);
                        tiles[tile.id] = { ...tile, health: newHealth };
                        tiles[tile.id].miningProgress = 100 - (newHealth / tile.maxHealth) * 100;

                        if (newHealth <= 0) {
                            tiles[tile.id].isMined = true;
                            tiles[tile.id].job = null;
                            tiles[tile.id].assignedCrewIds = [];
                            tiles[tile.id].isClaimed = false;
                            tiles[tile.id].claimedBy = undefined;
                            tiles[tile.id].timeLeft = 0;

                            // Update Visibility
                            tiles = updateVisibility(tiles, newState.baseLocation!);

                            // Start Transport
                            const fromTile = tile;
                            const baseTile = tiles[newState.baseLocation!];
                            if (baseTile && player) {
                                // Find closest owned node (base or logistics relay)
                                let destinationId = newState.baseLocation!;
                                const destTile = tiles[destinationId];
                                let minDistance = Math.abs(fromTile.x - destTile.x) + Math.abs(fromTile.y - destTile.y);

                                Object.values(tiles).forEach(t => {
                                    if (t.structure === 'relay' && t.claimedBy === newState.currentUser) {
                                        const dist = Math.abs(fromTile.x - t.x) + Math.abs(fromTile.y - t.y);
                                        if (dist < minDistance) {
                                            minDistance = dist;
                                            destinationId = t.id;
                                        }
                                    }
                                });

                                const distance = minDistance;

                                let logisticsSpeedMult = 1;
                                newState.researchedTechs.forEach(id => {
                                    const tech = RESEARCH_TREE.find(t => t.id === id);
                                    if (tech && tech.effect.type === 'logistics') logisticsSpeedMult += tech.effect.value;
                                });

                                const duration = (distance * 5000) / logisticsSpeedMult;

                                // Determine resource type to gain (map soil/rock to mineral)
                                let resourceGained = 'mineral';
                                if (['iron', 'copper', 'lithium', 'bananium', 'mineral'].includes(fromTile.type)) {
                                    resourceGained = fromTile.type;
                                }

                                const transportTask: TransportTask = {
                                    id: `trans-${Date.now()}-${Math.random()}`,
                                    ownerId: newState.currentUser!,
                                    resource: resourceGained,
                                    amount: 10,
                                    fromId: tile.id,
                                    toId: destinationId,
                                    startTime: Date.now(),
                                    duration: duration,
                                    arrivalTime: Date.now() + duration
                                };
                                newState.transportQueue = [...newState.transportQueue, transportTask];
                            }
                            completed = true;
                        }
                        stateChanged = true;
                    }

                    if (completed) {
                        // Free all crew assigned to this tile
                        tile.assignedCrewIds!.forEach(crewId => {
                            const crewIndex = crew.findIndex(c => c.id === crewId);
                            if (crewIndex !== -1) {
                                crew[crewIndex] = { ...crew[crewIndex], state: 'idle', currentTileId: null };
                            }
                        });
                    }
                });

                // 3. Process Transport Queue
                const now = Date.now();
                const arrivedTasks = newState.transportQueue.filter(t => now >= t.arrivalTime);

                if (arrivedTasks.length > 0) {
                    const activeTasks = newState.transportQueue.filter(t => now < t.arrivalTime);
                    newState.transportQueue = activeTasks;
                    stateChanged = true;

                    // Add resources
                    const currentPlayer = newState.players[newState.currentUser!];
                    const newInventory = { ...currentPlayer.inventory };

                    arrivedTasks.forEach(task => {
                        const res = task.resource;
                        newInventory[res] = (newInventory[res] || 0) + task.amount;
                    });

                    newState.players = {
                        ...newState.players,
                        [newState.currentUser!]: {
                            ...currentPlayer,
                            inventory: newInventory
                        }
                    };
                }

                if (stateChanged) {
                    return {
                        ...newState,
                        tiles,
                        players: {
                            ...newState.players,
                            [newState.currentUser!]: {
                                ...newState.players[newState.currentUser!],
                                crew
                            }
                        }
                    };
                }

                return prev;
            });
        }, tickRate);

        return () => clearInterval(interval);
    }, []); // Run once on mount (the interval handles state updates)


    // ... inside GameProvider render ...


    const setTileJob = (tileId: string, job: 'prospect' | 'mine' | null) => {
        if (gameState.currentUser) {
            socketClient.send({ type: 'SET_TILE_JOB', tileId, job, username: gameState.currentUser });
        }
        setGameState(prev => {
            const tile = prev.tiles[tileId];
            if (!tile) return prev;

            const currentUser = prev.currentUser;
            if (!currentUser) return prev;

            // Enforce Single Tile Limit
            // If we are setting a NEW job (starting interaction), check if we already have an active tile
            if (job) {
                const activeTile = Object.values(prev.tiles).find(t =>
                    t.claimedBy === currentUser &&
                    t.id !== prev.baseLocation &&
                    t.id !== tileId // Ignore self if we are upgrading prospect->mine
                );

                if (activeTile) {
                    // console.log("Limit reached: Cannot claim more than one tile.");
                    return prev;
                }
            }

            // Check if already claimed by another user
            if (job && tile.isClaimed && tile.claimedBy && tile.claimedBy !== currentUser) {
                // console.log("Tile already claimed by another user");
                return prev;
            }

            // Logic for Cancel/Release
            if (job === null) {
                // "Release" logic
                let players = prev.players;
                // Free crew if assigned
                if (tile.assignedCrewIds && tile.assignedCrewIds.length > 0) {
                    const player = prev.players[currentUser];
                    const newCrew = player.crew.map(c =>
                        tile.assignedCrewIds!.includes(c.id) ? { ...c, state: 'idle' as const, currentTileId: null } : c
                    );
                    players = {
                        ...prev.players,
                        [currentUser]: { ...player, crew: newCrew }
                    };
                }

                return {
                    ...prev,
                    players: tile.assignedCrewIds && tile.assignedCrewIds.length > 0 ? players : prev.players,
                    tiles: {
                        ...prev.tiles,
                        [tileId]: {
                            ...tile,
                            job: null,
                            assignedCrewIds: [],
                            isClaimed: false, // Release claim
                            claimedBy: undefined
                        }
                    }
                };
            }

            // Logic for Starting/Updating Job (Claiming)
            return {
                ...prev,
                tiles: {
                    ...prev.tiles,
                    [tileId]: {
                        ...tile,
                        job: job,
                        // If we are starting a job, we claim it
                        isClaimed: true,
                        claimedBy: currentUser,
                        // If tile was already assigned (switching job type?), keep it, otherwise null waits for loop
                        assignedCrewIds: tile.assignedCrewIds || []
                    }
                }
            };
        });
    };

    const hireCrew = (type: string, cost: number) => {
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            if (!player) return prev;

            if (player.resources.credits >= cost) {
                // Create new crew member
                const newCrew: CrewMember = {
                    id: `crew-${Date.now()}`,
                    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Math.floor(Math.random() * 1000)}`,
                    type: type as CrewType,
                    state: 'idle',
                    currentTileId: null,
                    stats: {
                        digSpeed: type === 'miner' ? 1.5 : 1,
                        prospectiveSpeed: type === 'scientist' ? 1.5 : 1
                    }
                };

                return {
                    ...prev,
                    players: {
                        ...prev.players,
                        [prev.currentUser!]: {
                            ...player,
                            resources: {
                                ...player.resources,
                                credits: player.resources.credits - cost
                            },
                            crew: [...player.crew, newCrew]
                        }
                    }
                };
            }
            return prev;
        });
    };

    const smeltResource = (resource: ResourceType, amount: number) => {
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            if (!player) return prev;
            const currentAmount = player.inventory[resource] || 0;

            if (currentAmount >= amount) {
                // Fixed rate for now: 10 Credits per unit
                // TODO: Make this dynamic or research based
                const rate = 10;
                const bonus = 0;
                // Example: Research "Smelting Efficiency"
                // prev.researchedTechs...

                const creditsGained = amount * rate * (1 + bonus);

                return {
                    ...prev,
                    players: {
                        ...prev.players,
                        [prev.currentUser!]: {
                            ...player,
                            inventory: {
                                ...player.inventory,
                                [resource]: currentAmount - amount
                            },
                            resources: {
                                ...player.resources,
                                credits: player.resources.credits + creditsGained
                            }
                        }
                    }
                };
            }
            return prev;
        });
    };

    const createListing = (resource: ResourceType, amount: number, price: number) => {
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            if (!player) return prev;
            const currentAmount = player.inventory[resource] || 0;

            if (currentAmount >= amount) {
                const newListing: MarketListing = {
                    id: `list-${Date.now()}-${Math.random()}`,
                    sellerId: prev.currentUser!,
                    resource,
                    amount,
                    price,
                    currency: 'credits',
                    timestamp: Date.now()
                };

                socketClient.send({ type: 'CREATE_LISTING', listing: newListing });

                return {
                    ...prev,
                    marketListings: [...(prev.marketListings || []), newListing],
                    players: {
                        ...prev.players,
                        [prev.currentUser!]: {
                            ...player,
                            inventory: {
                                ...player.inventory,
                                [resource]: currentAmount - amount
                            }
                        }
                    }
                };
            }
            return prev;
        });
    };

    const buyListing = (listingId: string) => {
        socketClient.send({ type: 'BUY_LISTING', listingId });
        setGameState(prev => {
            const buyerId = prev.currentUser!;
            const buyer = prev.players[buyerId];
            const listingIndex = prev.marketListings.findIndex(l => l.id === listingId);

            if (listingIndex === -1 || !buyer) return prev;

            const listing = prev.marketListings[listingIndex];

            // Prevent buying own listing (though UI hides it)
            if (listing.sellerId === buyerId) return prev;

            if (buyer.resources.credits >= listing.price) {
                const seller = prev.players[listing.sellerId];

                // 10% Market Fee
                const fee = Math.floor(listing.price * 0.10);
                const sellerRevenue = listing.price - fee;

                // Update Buyer
                const newBuyer = {
                    ...buyer,
                    resources: { ...buyer.resources, credits: buyer.resources.credits - listing.price },
                    inventory: {
                        ...buyer.inventory,
                        [listing.resource]: (buyer.inventory[listing.resource] || 0) + listing.amount
                    }
                };

                // Update Seller (if they exist/online, otherwise just update state)
                // Since players are in state, we just update the object
                let newSeller = seller;
                if (seller) {
                    newSeller = {
                        ...seller,
                        resources: { ...seller.resources, credits: seller.resources.credits + sellerRevenue }
                    };
                }

                const newListings = [...prev.marketListings];
                newListings.splice(listingIndex, 1);

                return {
                    ...prev,
                    marketListings: newListings,
                    players: {
                        ...prev.players,
                        [buyerId]: newBuyer,
                        ...(seller ? { [listing.sellerId]: newSeller } : {})
                    }
                };
            }
            return prev;
        });
    };

    const cancelListing = (listingId: string) => {
        socketClient.send({ type: 'CANCEL_LISTING', listingId });
        setGameState(prev => {
            const player = prev.players[prev.currentUser!];
            const listingIndex = prev.marketListings.findIndex(l => l.id === listingId);

            if (listingIndex === -1 || !player) return prev;

            const listing = prev.marketListings[listingIndex];

            // Only seller can cancel
            if (listing.sellerId !== prev.currentUser) return prev;

            // 5% Penalty (Item loss)
            // "When canceled, you get 95% back"
            const returnedAmount = Math.floor(listing.amount * 0.95);

            const newListings = [...prev.marketListings];
            newListings.splice(listingIndex, 1);

            return {
                ...prev,
                marketListings: newListings,
                players: {
                    ...prev.players,
                    [prev.currentUser!]: {
                        ...player,
                        inventory: {
                            ...player.inventory,
                            [listing.resource]: (player.inventory[listing.resource] || 0) + returnedAmount
                        }
                    }
                }
            };
        });
    };

    return (
        <GameContext.Provider value={{ gameState, addPlayer, updateTile, login, buildBase, buildStructure, dismantleStructure, unlockTech, getResearchBonus, setTileJob, hireCrew, smeltResource, createListing, buyListing, cancelListing, currentView, setCurrentView }}>
            {children}
        </GameContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
