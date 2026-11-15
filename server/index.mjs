import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, 'data');
const WORLD_FILE = path.join(DATA_DIR, 'world.jsonl');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const LEGACY_STATE_FILE = path.join(DATA_DIR, 'gamestate.json');

const PORT = process.env.PORT || 3000;
const ZIPLINE_RANGE = 5;
const ZIPLINE_SPEED_MULT = 3.0;
const DRONE_INTERVAL_MS = 3600000; // 1 unit per hour

const STRUCTURE_COSTS = {
  relay: { credits: 150, mineral: 50 },
  scanner: { credits: 250, mineral: 100 },
  command: { credits: 300, mineral: 120 },
  drone: { credits: 400, mineral: 150 },
  wormhole: { credits: 300, mineral: 0 },
};

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.woff2': 'font/woff2',
};

// ---------------------------------------------------------
// Map Generation & Visibility Logic (Server Authoritative)
// ---------------------------------------------------------
function generateMap(width = 10, depth = 20) {
  const map = {};
  const radius = Math.floor(width / 2);

  for (let x = -radius; x <= radius; x++) {
    for (let y = 0; y <= depth; y++) {
      let type = 'soil';
      let yieldAmount = 10;

      if (y === 0) {
        // Row 0 is reserved for Command Domes / surface bases
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

  return updateVisibility(map);
}

function updateVisibility(tiles, baseLocations = []) {
  const newTiles = { ...tiles };

  const revealNeighbors = (tileId) => {
    const source = newTiles[tileId];
    if (!source) return;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tid = `${source.x + dx},${source.y + dy}`;
        if (newTiles[tid]) {
          newTiles[tid] = {
            ...newTiles[tid],
            isVisible: true,
            isProspected: newTiles[tid].isProspected || newTiles[tid].y === 0,
          };
        }
      }
    }
  };

  Object.values(newTiles).forEach(t => {
    if (t.y === 0) t.isVisible = true;
  });

  baseLocations.forEach(bId => {
    if (bId && newTiles[bId]) revealNeighbors(bId);
  });

  Object.values(newTiles).forEach(t => {
    if (t.isMined) revealNeighbors(t.id);
  });

  return newTiles;
}

// ---------------------------------------------------------
// JSONL World Serialization (1 depth row per line)
// ---------------------------------------------------------
function serializeWorldJsonl(tiles) {
  const rowsByDepth = new Map();
  Object.values(tiles).forEach(t => {
    if (!rowsByDepth.has(t.y)) {
      rowsByDepth.set(t.y, {});
    }
    rowsByDepth.get(t.y)[String(t.x)] = {
      status: t.isMined ? 'mined' : t.isProspected ? 'prospected' : 'raw',
      isVisible: Boolean(t.isVisible),
      material: t.type,
      yield: t.yield || 10,
      health: t.health,
      maxHealth: t.maxHealth,
      claim: t.claimedBy || null,
      building: t.building || (t.structure ? { type: t.structure, owner: t.claimedBy || null, level: 1 } : null),
      job: t.job || null,
      prospectProgress: t.prospectProgress || 0,
      miningProgress: t.miningProgress || 0,
      assignedCrewIds: t.assignedCrewIds || [],
    };
  });

  const depths = Array.from(rowsByDepth.keys()).sort((a, b) => a - b);
  return depths.map(depth => JSON.stringify({ depth, cells: rowsByDepth.get(depth) })).join('\n') + '\n';
}

function parseWorldJsonl(content) {
  const tiles = {};
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  for (const line of lines) {
    const row = JSON.parse(line);
    const y = Number(row.depth);
    const cells = row.cells || {};
    for (const [xStr, cell] of Object.entries(cells)) {
      const x = Number(xStr);
      const id = `${x},${y}`;
      const building = cell.building || null;
      const structure = building && building.type !== 'base' ? building.type : null;
      tiles[id] = {
        id,
        x,
        y,
        type: cell.material || 'soil',
        health: cell.health ?? 100,
        maxHealth: cell.maxHealth ?? 100,
        yield: cell.yield ?? 10,
        isClaimed: Boolean(cell.claim),
        claimedBy: cell.claim || undefined,
        isProspected: cell.status === 'prospected' || cell.status === 'mined',
        isVisible: Boolean(cell.isVisible),
        prospectProgress: cell.prospectProgress ?? (cell.status !== 'raw' ? 100 : 0),
        miningProgress: cell.miningProgress ?? (cell.status === 'mined' ? 100 : 0),
        isMined: cell.status === 'mined',
        job: cell.job || null,
        assignedCrewIds: cell.assignedCrewIds || [],
        structure,
        building,
      };
    }
  }
  return tiles;
}

// ---------------------------------------------------------
// Global Shared Game State & Disk Persistence
// ---------------------------------------------------------
function loadState() {
  try {
    if (fs.existsSync(WORLD_FILE)) {
      const worldRaw = fs.readFileSync(WORLD_FILE, 'utf8');
      const tiles = parseWorldJsonl(worldRaw);
      let playerData = { players: {}, marketListings: [], transportQueue: [] };
      if (fs.existsSync(PLAYERS_FILE)) {
        playerData = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
      }
      if (Object.keys(tiles).length > 0) {
        console.log(`[Persistence] Loaded world.jsonl (${Object.keys(tiles).length} cells, ${Object.keys(playerData.players || {}).length} captains)`);
        return {
          tiles,
          players: playerData.players || {},
          marketListings: playerData.marketListings || [],
          transportQueue: playerData.transportQueue || [],
        };
      }
    } else if (fs.existsSync(LEGACY_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_STATE_FILE, 'utf8'));
      if (parsed && parsed.tiles && Object.keys(parsed.tiles).length > 0) {
        console.log('[Persistence] Migrated legacy gamestate.json to world.jsonl');
        return {
          tiles: parsed.tiles,
          players: parsed.players || {},
          marketListings: parsed.marketListings || [],
          transportQueue: parsed.transportQueue || [],
        };
      }
    }
  } catch (err) {
    console.error('[Persistence] Failed to load state, generating fresh world:', err);
  }

  return {
    tiles: generateMap(10, 20),
    players: {},
    marketListings: [],
    transportQueue: [],
  };
}

const gameState = loadState();
let stateDirty = false;

function saveStateNow() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const worldTmp = `${WORLD_FILE}.tmp`;
    fs.writeFileSync(worldTmp, serializeWorldJsonl(gameState.tiles), 'utf8');
    fs.renameSync(worldTmp, WORLD_FILE);

    const playersTmp = `${PLAYERS_FILE}.tmp`;
    fs.writeFileSync(
      playersTmp,
      JSON.stringify({
        players: gameState.players,
        marketListings: gameState.marketListings,
        transportQueue: gameState.transportQueue,
      }),
      'utf8'
    );
    fs.renameSync(playersTmp, PLAYERS_FILE);
    stateDirty = false;
  } catch (err) {
    console.error('[Persistence] Failed to save state:', err);
  }
}

// Pre-write world.jsonl on first boot so the season file exists immediately
if (!fs.existsSync(WORLD_FILE)) {
  saveStateNow();
}

function markDirty(immediate = false) {
  stateDirty = true;
  if (immediate) {
    saveStateNow();
  }
}

setInterval(() => {
  if (stateDirty) {
    saveStateNow();
  }
}, 2000);

process.on('SIGINT', () => {
  if (stateDirty) saveStateNow();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (stateDirty) saveStateNow();
  process.exit(0);
});

function canPlayerClaimTile(tiles, player, targetTile) {
  if (!player?.baseLocation) return false;
  const baseTile = tiles[player.baseLocation];
  if (!baseTile) return false;
  if (targetTile.y === 0) return false;
  if (targetTile.y === 1 && targetTile.x !== baseTile.x) return false;
  if (targetTile.isClaimed && targetTile.claimedBy !== player.id) return false;

  const underBaseTile = tiles[`${baseTile.x},${baseTile.y + 1}`];
  const hasMinedTile = Object.values(tiles).some(t => t.isMined && t.claimedBy === player.id);

  if (!hasMinedTile && underBaseTile && !underBaseTile.isMined) {
    return targetTile.id === underBaseTile.id;
  }

  return true;
}

// ---------------------------------------------------------
// Structure Effect & Shuttle Route Helpers
// ---------------------------------------------------------
function hasScannerConeBoost(tiles, targetTile) {
  return Object.values(tiles).some(s => {
    const type = s.building?.type || s.structure;
    if (type !== 'scanner') return false;
    const dy = targetTile.y - s.y;
    // 1, 3, 5, 7 width straight below (dy = 1..4)
    return dy >= 1 && dy <= 4 && Math.abs(targetTile.x - s.x) <= dy - 1;
  });
}

function hasCommandAuraBoost(tiles, targetTile, playerId) {
  return Object.values(tiles).some(c => {
    const type = c.building?.type || c.structure;
    if (type !== 'command' || c.claimedBy !== playerId) return false;
    // Affects only the 3 cells around/below (left, right, directly below)
    const dx = Math.abs(targetTile.x - c.x);
    const dy = targetTile.y - c.y;
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  });
}

function buildShuttleRoute(tiles, player, minedTile) {
  const baseTile = player.baseLocation ? tiles[player.baseLocation] : null;
  if (!baseTile) return null;

  const hubs = [baseTile];
  Object.values(tiles).forEach(t => {
    if ((t.structure === 'relay' || t.structure === 'wormhole') && t.claimedBy === player.id) {
      hubs.push(t);
    }
  });

  // BFS from baseTile along zipline links (Manhattan distance <= ZIPLINE_RANGE) or wormhole warp links
  const paths = new Map();
  paths.set(baseTile.id, [{ x: baseTile.x, y: baseTile.y, fast: true }]);
  const queue = [baseTile];

  while (queue.length > 0) {
    const curr = queue.shift();
    const currPath = paths.get(curr.id);

    for (const next of hubs) {
      if (paths.has(next.id)) continue;
      const dist = Math.abs(curr.x - next.x) + Math.abs(curr.y - next.y);
      const isWormholePair = curr.building?.linkedTileId === next.id;
      if (dist <= ZIPLINE_RANGE || isWormholePair) {
        paths.set(next.id, [...currPath, { x: next.x, y: next.y, fast: true }]);
        queue.push(next);
      }
    }
  }

  // Pick reachable hub with shortest total travel cost to minedTile
  let bestHub = baseTile;
  let bestPath = paths.get(baseTile.id);
  let bestScore = Infinity;

  for (const hub of hubs) {
    const hubPath = paths.get(hub.id);
    if (!hubPath) continue; // Only zipline-connected hubs get zipline routing

    let zipDist = 0;
    for (let i = 0; i < hubPath.length - 1; i++) {
      zipDist += Math.abs(hubPath[i + 1].x - hubPath[i].x) + Math.abs(hubPath[i + 1].y - hubPath[i].y);
    }
    const chugDist = Math.abs(minedTile.x - hub.x) + Math.abs(minedTile.y - hub.y);
    const score = zipDist / ZIPLINE_SPEED_MULT + chugDist;

    if (score < bestScore) {
      bestScore = score;
      bestHub = hub;
      bestPath = hubPath;
    }
  }

  const route = [...bestPath, { x: minedTile.x, y: minedTile.y, fast: false }];
  // Round-trip duration: 2 * (zipDist * (2500 / 3) + chugDist * 2500)
  const duration = Math.max(3000, Math.round(bestScore * 5000));

  return {
    destinationId: bestHub.id,
    route,
    duration,
  };
}

// ---------------------------------------------------------
// HTTP Server (Serving compiled Vite frontend & assets)
// ---------------------------------------------------------
const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/api/reset') {
    gameState.tiles = generateMap(10, 20);
    gameState.players = {};
    gameState.marketListings = [];
    gameState.transportQueue = [];
    saveStateNow();
    broadcast({
      type: 'INIT_STATE',
      state: {
        tiles: gameState.tiles,
        players: gameState.players,
        marketListings: gameState.marketListings,
        transportQueue: gameState.transportQueue,
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'World reset successfully' }));
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Build not found. Run npm run build first.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  });

  fs.createReadStream(filePath).pipe(res);
});

// ---------------------------------------------------------
// WebSocket Multiplayer Sync Server
// ---------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data, excludeWs = null) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function getBaseLocations() {
  const bases = [];
  Object.values(gameState.players).forEach(p => {
    if (p.baseLocation) bases.push(p.baseLocation);
  });
  return bases;
}

wss.on('connection', (ws) => {
  let currentUser = null;

  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    state: {
      tiles: gameState.tiles,
      players: gameState.players,
      marketListings: gameState.marketListings,
      transportQueue: gameState.transportQueue,
    }
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      switch (msg.type) {
        case 'LOGIN': {
          currentUser = msg.username;
          if (!gameState.players[currentUser]) {
            gameState.players[currentUser] = {
              id: currentUser,
              username: currentUser,
              baseLocation: null,
              baseLevel: 0,
              resources: { credits: 500, mineral: 0, bananium: 0 },
              inventory: {},
              crew: [
                {
                  id: `c-${Date.now()}-1`,
                  name: 'Chief Drill',
                  type: 'miner',
                  state: 'idle',
                  currentTileId: null,
                  stats: { digSpeed: 1.5, prospectiveSpeed: 1.0 },
                },
                {
                  id: `c-${Date.now()}-2`,
                  name: 'Scout Bob',
                  type: 'scientist',
                  state: 'idle',
                  currentTileId: null,
                  stats: { digSpeed: 1.0, prospectiveSpeed: 1.5 },
                },
              ],
            };
            markDirty(true);
          }
          const player = gameState.players[currentUser];
          ws.send(JSON.stringify({
            type: 'LOGIN_SUCCESS',
            username: currentUser,
            baseLocation: player.baseLocation,
            baseLevel: player.baseLevel,
            player,
          }));
          broadcast({ type: 'PLAYER_JOINED', player });
          break;
        }

        case 'RESET_WORLD': {
          gameState.tiles = generateMap(10, 20);
          gameState.players = {};
          gameState.marketListings = [];
          gameState.transportQueue = [];
          saveStateNow();
          broadcast({
            type: 'INIT_STATE',
            state: {
              tiles: gameState.tiles,
              players: gameState.players,
              marketListings: gameState.marketListings,
              transportQueue: gameState.transportQueue,
            }
          });
          break;
        }

        case 'BUILD_BASE': {
          const { tileId, username } = msg;
          const player = gameState.players[username];
          const tile = gameState.tiles[tileId];
          if (player && tile && tile.y === 0 && !player.baseLocation && !tile.building) {
            player.baseLocation = tileId;
            player.baseLevel = 1;
            tile.isClaimed = true;
            tile.claimedBy = username;
            tile.isProspected = true;
            tile.building = { type: 'base', owner: username, level: 1 };
            gameState.tiles = updateVisibility(gameState.tiles, getBaseLocations());

            ws.send(JSON.stringify({
              type: 'LOGIN_SUCCESS',
              username,
              baseLocation: tileId,
              baseLevel: 1,
              player,
            }));

            broadcast({
              type: 'STATE_UPDATE',
              tiles: gameState.tiles,
              players: gameState.players,
            });
            markDirty(true);
          }
          break;
        }

        case 'BUILD_STRUCTURE': {
          const { tileId, structure, username } = msg;
          const tile = gameState.tiles[tileId];
          const player = gameState.players[username];
          const cost = STRUCTURE_COSTS[structure];
          if (
            tile &&
            player &&
            cost &&
            tile.isMined &&
            !tile.structure &&
            player.resources.credits >= cost.credits &&
            (player.inventory.mineral || 0) >= cost.mineral
          ) {
            if (structure === 'wormhole') {
              const hasWormhole = Object.values(gameState.tiles).some(
                t => t.structure === 'wormhole' && t.claimedBy === username
              );
              if (hasWormhole) break;

              let maxExploredY = 0;
              Object.values(gameState.tiles).forEach(t => {
                if ((t.isProspected || t.isMined) && t.y > maxExploredY) {
                  maxExploredY = t.y;
                }
              });
              const exitY = Math.max(2, Math.min(20, maxExploredY + 1));
              const exitCandidates = Object.values(gameState.tiles)
                .filter(t => t.y === exitY && !t.structure && !t.building && t.id !== tile.id)
                .sort((a, b) => Math.abs(a.x - tile.x) - Math.abs(b.x - tile.x));
              const exitTile = exitCandidates[0];
              if (!exitTile) break;

              player.resources.credits -= cost.credits;
              player.inventory.mineral = (player.inventory.mineral || 0) - cost.mineral;

              tile.structure = 'wormhole';
              tile.isClaimed = true;
              tile.claimedBy = username;
              tile.building = {
                type: 'wormhole',
                owner: username,
                level: 1,
                linkedTileId: exitTile.id,
              };

              exitTile.structure = 'wormhole';
              exitTile.isMined = true;
              exitTile.isProspected = true;
              exitTile.isVisible = true;
              exitTile.isClaimed = true;
              exitTile.claimedBy = username;
              exitTile.building = {
                type: 'wormhole',
                owner: username,
                level: 1,
                linkedTileId: tile.id,
              };

              const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
              for (const [dx, dy] of dirs) {
                const neighbor = gameState.tiles[`${exitTile.x + dx},${exitTile.y + dy}`];
                if (neighbor) neighbor.isVisible = true;
              }
              gameState.tiles = updateVisibility(gameState.tiles, getBaseLocations());

              broadcast({
                type: 'STATE_UPDATE',
                tiles: gameState.tiles,
                players: gameState.players,
              });
              markDirty(true);
              break;
            }

            player.resources.credits -= cost.credits;
            player.inventory.mineral = (player.inventory.mineral || 0) - cost.mineral;

            tile.structure = structure;
            tile.isClaimed = true;
            tile.claimedBy = username;
            tile.building = {
              type: structure,
              owner: username,
              level: 1,
              ...(structure === 'drone' ? { lastExtractTime: Date.now() } : {}),
            };

            broadcast({
              type: 'STATE_UPDATE',
              tiles: gameState.tiles,
              players: gameState.players,
            });
            markDirty(true);
          }
          break;
        }

        case 'DISMANTLE_STRUCTURE': {
          const { tileId, username } = msg;
          const tile = gameState.tiles[tileId];
          if (tile && tile.claimedBy === username) {
            const linkedId = tile.building?.linkedTileId;
            tile.structure = null;
            tile.building = null;
            tile.isClaimed = false;
            tile.claimedBy = undefined;

            if (linkedId && gameState.tiles[linkedId]) {
              const linked = gameState.tiles[linkedId];
              linked.structure = null;
              linked.building = null;
              linked.isClaimed = false;
              linked.claimedBy = undefined;
              broadcast({
                type: 'STATE_UPDATE',
                tiles: gameState.tiles,
                players: gameState.players,
              });
            } else {
              broadcast({ type: 'TILE_UPDATED', tile });
            }
            markDirty(true);
          }
          break;
        }

        case 'SET_TILE_JOB': {
          const { tileId, job, username } = msg;
          const tile = gameState.tiles[tileId];
          const player = gameState.players[username];

          if (tile && player) {
            if (job === null) {
              tile.job = null;
              tile.isClaimed = false;
              tile.claimedBy = undefined;
              tile.assignedCrewIds = [];
            } else {
              if (!canPlayerClaimTile(gameState.tiles, player, tile)) {
                break;
              }

              // Enforce active job limit (1 base + 1 per Forward Command Post)
              const commandPosts = Object.values(gameState.tiles).filter(
                t => t.structure === 'command' && t.claimedBy === username
              ).length;
              const maxActiveJobs = 1 + commandPosts;
              const currentActiveJobs = Object.values(gameState.tiles).filter(
                t => t.claimedBy === username && t.id !== tileId && Boolean(t.job)
              ).length;

              if (currentActiveJobs >= maxActiveJobs) {
                break;
              }

              tile.job = job;
              tile.isClaimed = true;
              tile.claimedBy = username;
              tile.assignedCrewIds = player.crew.map(c => c.id);
            }

            broadcast({ type: 'TILE_UPDATED', tile });
            markDirty(true);
          }
          break;
        }

        case 'CREATE_LISTING': {
          const { listing } = msg;
          gameState.marketListings.push(listing);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
          markDirty(true);
          break;
        }

        case 'BUY_LISTING': {
          const { listingId } = msg;
          gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
          markDirty(true);
          break;
        }

        case 'CANCEL_LISTING': {
          const { listingId } = msg;
          gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
          markDirty(true);
          break;
        }

        case 'ADMIN_GIVE_RESOURCES': {
          const { username, credits, mineral, bananium } = msg;
          let player = gameState.players[username];
          if (!player) {
            player = {
              id: username,
              username,
              baseLocation: null,
              baseLevel: 0,
              resources: { credits: 500, mineral: 0, bananium: 0 },
              inventory: {},
              crew: [],
            };
            gameState.players[username] = player;
          }
          if (credits) player.resources.credits = Math.max(0, (player.resources.credits || 0) + Number(credits));
          if (mineral) player.inventory.mineral = Math.max(0, (player.inventory.mineral || 0) + Number(mineral));
          if (bananium) player.inventory.bananium = Math.max(0, (player.inventory.bananium || 0) + Number(bananium));
          broadcast({
            type: 'STATE_UPDATE',
            tiles: gameState.tiles,
            players: gameState.players,
          });
          markDirty(true);
          break;
        }

        case 'ADMIN_REVEAL_ALL': {
          Object.values(gameState.tiles).forEach(t => {
            t.isVisible = true;
            t.isProspected = true;
          });
          broadcast({
            type: 'STATE_UPDATE',
            tiles: gameState.tiles,
            players: gameState.players,
          });
          markDirty(true);
          break;
        }

        case 'ADMIN_CLEAR_PLAYER_BASE': {
          const { username } = msg;
          const player = gameState.players[username];
          if (player && player.baseLocation) {
            const oldTile = gameState.tiles[player.baseLocation];
            if (oldTile) {
              oldTile.isClaimed = false;
              oldTile.claimedBy = undefined;
              oldTile.building = null;
            }
            player.baseLocation = null;
            player.baseLevel = 0;
            gameState.tiles = updateVisibility(gameState.tiles, getBaseLocations());
            broadcast({
              type: 'STATE_UPDATE',
              tiles: gameState.tiles,
              players: gameState.players,
            });
            markDirty(true);
          }
          break;
        }
      }
    } catch (err) {
      console.error('[WS Error]', err);
    }
  });

  ws.on('close', () => {
    // Player disconnected
  });
});

// ---------------------------------------------------------
// Authoritative Game Loop (500ms Tick)
// ---------------------------------------------------------
setInterval(() => {
  let stateChanged = false;
  const now = Date.now();

  // 1. Process active jobs (prospecting & mining)
  Object.values(gameState.tiles).forEach(tile => {
    if (tile.job && tile.claimedBy && tile.assignedCrewIds && tile.assignedCrewIds.length > 0 && !tile.isMined) {
      const player = gameState.players[tile.claimedBy];
      if (!player) return;

      if (tile.job === 'prospect') {
        const scannerMult = hasScannerConeBoost(gameState.tiles, tile) ? 2 : 1;
        const surveySpeed = 25 * scannerMult;
        tile.prospectProgress = Math.min(100, (tile.prospectProgress || 0) + surveySpeed);
        if (tile.prospectProgress >= 100) {
          tile.isProspected = true;
          tile.job = null;
          tile.isClaimed = false;
          tile.claimedBy = undefined;
          tile.assignedCrewIds = [];
          if (player.crew) {
            player.crew.forEach(c => {
              if (c.currentTileId === tile.id) {
                c.state = 'idle';
                c.currentTileId = null;
              }
            });
          }
          stateChanged = true;
        }
      } else if (tile.job === 'mine') {
        const commandMult = hasCommandAuraBoost(gameState.tiles, tile, player.id) ? 1.35 : 1;
        const digSpeed = 25 * commandMult;
        tile.health = Math.max(0, tile.health - digSpeed);
        tile.miningProgress = 100 - (tile.health / tile.maxHealth) * 100;

        if (tile.health <= 0) {
          tile.isMined = true;
          tile.job = null;
          tile.isClaimed = false;
          tile.claimedBy = undefined;
          tile.assignedCrewIds = [];
          if (player.crew) {
            player.crew.forEach(c => {
              if (c.currentTileId === tile.id) {
                c.state = 'idle';
                c.currentTileId = null;
              }
            });
          }

          // Unveil adjacent fog of war
          gameState.tiles = updateVisibility(gameState.tiles, getBaseLocations());

          // Spawn round-trip shuttle along zipline network + off-grid chug
          const routeInfo = buildShuttleRoute(gameState.tiles, player, tile);
          if (routeInfo) {
            const task = {
              id: `trans-${now}-${Math.random()}`,
              ownerId: player.id,
              resource: ['iron', 'copper', 'lithium', 'bananium'].includes(tile.type) ? tile.type : 'mineral',
              amount: tile.yield || 10,
              fromId: tile.id,
              toId: routeInfo.destinationId,
              route: routeInfo.route,
              startTime: now,
              duration: routeInfo.duration,
              arrivalTime: now + routeInfo.duration,
            };
            gameState.transportQueue.push(task);
          }

          stateChanged = true;
        }
      }
    }
  });

  // 2. Process Drone Drilling Stations (1 unit/hour passive extraction)
  Object.values(gameState.tiles).forEach(tile => {
    if (tile.structure === 'drone' && tile.claimedBy && tile.building) {
      const player = gameState.players[tile.claimedBy];
      if (!player) return;

      const lastExtract = tile.building.lastExtractTime || now;
      if (now - lastExtract >= DRONE_INTERVAL_MS) {
        const units = Math.floor((now - lastExtract) / DRONE_INTERVAL_MS);
        const resource = ['iron', 'copper', 'lithium', 'bananium'].includes(tile.type) ? tile.type : 'mineral';
        player.inventory[resource] = (player.inventory[resource] || 0) + units;
        tile.building.lastExtractTime = lastExtract + units * DRONE_INTERVAL_MS;
        stateChanged = true;
      }
    }
  });

  // 3. Process transport arrivals
  const arrived = gameState.transportQueue.filter(t => now >= t.arrivalTime);
  if (arrived.length > 0) {
    gameState.transportQueue = gameState.transportQueue.filter(t => now < t.arrivalTime);
    arrived.forEach(task => {
      const player = gameState.players[task.ownerId];
      if (player) {
        player.inventory[task.resource] = (player.inventory[task.resource] || 0) + task.amount;
      }
    });
    stateChanged = true;
  }

  if (stateChanged) {
    markDirty();
    broadcast({
      type: 'TICK_UPDATE',
      tiles: gameState.tiles,
      players: gameState.players,
      transportQueue: gameState.transportQueue,
    });
  }
}, 500);

// ---------------------------------------------------------
// Start Server
// ---------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Deepmine multiplayer server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint ready at ws://localhost:${PORT}/ws`);
});
