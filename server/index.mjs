import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = process.env.PORT || 3000;

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
      let health = 100;

      if (y === 0) {
        type = 'soil';
        health = 50;
      } else {
        const rand = Math.random();
        if (y < 2) {
          type = 'soil';
        } else if (y < 5) {
          if (rand > 0.8) type = 'rock';
        } else if (y < 10) {
          if (rand > 0.85) type = 'mineral';
          else if (rand > 0.6) type = 'rock';
        } else {
          if (rand > 0.95) type = 'bananium';
          else if (rand > 0.85) type = 'mineral';
          else if (rand > 0.5) type = 'rock';
        }
      }

      const baseHealth = y === 0 ? 10 : 180 * (y * y);
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
        isVisible: y === 0,
        prospectProgress: 0,
        miningProgress: 0,
        isMined: false,
        structure: null,
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

  // 1. Surface is always visible
  Object.values(newTiles).forEach(t => {
    if (t.y === 0) t.isVisible = true;
  });

  // 2. Bases reveal neighbors
  baseLocations.forEach(bId => {
    if (bId && newTiles[bId]) revealNeighbors(bId);
  });

  // 3. Mined tiles reveal neighbors
  Object.values(newTiles).forEach(t => {
    if (t.isMined) revealNeighbors(t.id);
  });

  return newTiles;
}

// ---------------------------------------------------------
// Global Shared Game State
// ---------------------------------------------------------
const gameState = {
  tiles: generateMap(10, 20),
  players: {},
  marketListings: [],
  transportQueue: [],
};

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

  // If path doesn't exist, fallback to index.html (SPA routing)
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
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
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

  // Send full initial state upon connection
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
          if (player && gameState.tiles[tileId] && !player.baseLocation) {
            player.baseLocation = tileId;
            player.baseLevel = 1;
            gameState.tiles[tileId].isClaimed = true;
            gameState.tiles[tileId].claimedBy = username;
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
          }
          break;
        }

        case 'BUILD_STRUCTURE': {
          const { tileId, structure, username } = msg;
          const tile = gameState.tiles[tileId];
          const player = gameState.players[username];
          if (tile && player && tile.isMined && !tile.structure) {
            tile.structure = structure;
            tile.isClaimed = true;
            tile.claimedBy = username;

            broadcast({
              type: 'TILE_UPDATED',
              tile,
              players: gameState.players,
            });
          }
          break;
        }

        case 'DISMANTLE_STRUCTURE': {
          const { tileId, username } = msg;
          const tile = gameState.tiles[tileId];
          if (tile && tile.claimedBy === username) {
            tile.structure = null;
            tile.isClaimed = false;
            tile.claimedBy = undefined;

            broadcast({ type: 'TILE_UPDATED', tile });
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
              tile.job = job;
              tile.isClaimed = true;
              tile.claimedBy = username;
              tile.assignedCrewIds = player.crew.map(c => c.id);
            }

            broadcast({ type: 'TILE_UPDATED', tile });
          }
          break;
        }

        case 'CREATE_LISTING': {
          const { listing } = msg;
          gameState.marketListings.push(listing);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
          break;
        }

        case 'BUY_LISTING': {
          const { listingId } = msg;
          gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
          break;
        }

        case 'CANCEL_LISTING': {
          const { listingId } = msg;
          gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
          broadcast({ type: 'MARKET_UPDATED', listings: gameState.marketListings });
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

  // 1. Process active jobs (prospecting & mining)
  Object.values(gameState.tiles).forEach(tile => {
    if (tile.job && tile.claimedBy && tile.assignedCrewIds && tile.assignedCrewIds.length > 0 && !tile.isMined) {
      const player = gameState.players[tile.claimedBy];
      if (!player) return;

      if (tile.job === 'prospect') {
        const surveySpeed = 25; // 25% progress per tick
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
        const digSpeed = 25; // 25 HP per tick
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

          // Spawn transport to closest base or logistics relay
          if (player.baseLocation && gameState.tiles[player.baseLocation]) {
            const baseTile = gameState.tiles[player.baseLocation];
            let destinationId = player.baseLocation;
            let minDistance = Math.abs(tile.x - baseTile.x) + Math.abs(tile.y - baseTile.y);

            // Check if player has a closer logistics relay
            Object.values(gameState.tiles).forEach(t => {
              if (t.structure === 'relay' && t.claimedBy === player.id) {
                const dist = Math.abs(tile.x - t.x) + Math.abs(tile.y - t.y);
                if (dist < minDistance) {
                  minDistance = dist;
                  destinationId = t.id;
                }
              }
            });

            const duration = Math.max(2000, minDistance * 4000);
            const task = {
              id: `trans-${Date.now()}-${Math.random()}`,
              ownerId: player.id,
              resource: ['iron', 'copper', 'lithium', 'bananium'].includes(tile.type) ? tile.type : 'mineral',
              amount: 10,
              fromId: tile.id,
              toId: destinationId,
              startTime: Date.now(),
              duration,
              arrivalTime: Date.now() + duration,
            };
            gameState.transportQueue.push(task);
          }

          stateChanged = true;
        }
      }
    }
  });

  // 2. Process transport arrivals
  const now = Date.now();
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
