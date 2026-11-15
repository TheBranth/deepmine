export type ResourceType = 'water' | 'food' | 'energy' | 'fuel' | 'credits' | 'iron' | 'copper' | 'lithium' | 'bananium';

export interface Resources {
  water: number;
  food: number;
  energy: number;
  fuel: number;
  credits: number;
}

export type TileType = 'soil' | 'rock' | 'mineral' | 'iron' | 'copper' | 'lithium' | 'bananium';

export type StructureType = 'relay' | 'scanner' | 'command' | 'drone';

export interface TileBuilding {
  type: 'base' | StructureType;
  owner: string;
  level: number;
  lastExtractTime?: number;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  type: TileType;
  health: number; // Health of the tile (mining progress)
  maxHealth: number;
  yield?: number;
  isClaimed: boolean;
  claimedBy?: string; // Player ID

  // Idle Game State
  isProspected: boolean; // True if content is known
  isVisible: boolean; // True if not in fog of war
  prospectProgress: number; // 0-100
  miningProgress: number; // 0-100 (visual or logic)

  isMined: boolean;
  content?: ResourceType; // What's inside strictly speaking (maybe revealed after prospecting)
  amount?: number;
  timeLeft?: number; // Estimated time remaining in ms

  // Job System
  job?: 'prospect' | 'mine' | null;
  assignedCrewIds?: string[]; // Multiple crew support
  structure?: StructureType | null;
  building?: TileBuilding | null;
}

export type CrewType = 'engineer' | 'miner' | 'scientist';

export interface CrewMember {
  id: string;
  name: string;
  type: CrewType;
  state: 'idle' | 'working' | 'resting';
  currentTileId?: string | null;
  stats: {
    digSpeed: number; // Modifier
    prospectiveSpeed: number; // Modifier
  };
}

export interface Player {
  id: string;
  name: string;
  resources: Resources;
  inventory: Record<string, number>;
  crew: CrewMember[];
  baseLocation?: string | null;
  baseLevel?: number;
  // Equipment slots, etc.
}

export interface TransportLeg {
  x: number;
  y: number;
  fast: boolean;
  startFrac: number; // 0..1 within leg
  endFrac: number;   // 0..1 within leg
}

export interface TransportTask {
  id: string;
  ownerId: string; // Player ID who owns this transport
  resource: string; // 'mineral' | 'bananium'
  amount: number;
  fromId: string;
  toId: string; // Nearest hub / baseLocation
  startTime: number;
  duration: number; // ms
  arrivalTime: number;
  route?: Array<{ x: number; y: number; fast: boolean }>;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  resource: ResourceType;
  amount: number;
  price: number;
  currency: 'credits';
  timestamp: number;
}

export interface GameState {
  players: Record<string, Player>;
  tiles: Record<string, Tile>; // Map of "x,y" to Tile
  currentUser: string | null;
  baseLocation: string | null; // Tile ID of the base
  baseLevel: number;
  researchedTechs: string[];
  transportQueue: TransportTask[];
  marketListings: MarketListing[];
}
