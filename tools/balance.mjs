// Headless Simulation & Balance Tester for Deepmine
import fs from 'fs';

console.log('=== DEEPMINE HEADLESS SIMULATION & BALANCE TEST ===\n');

// Mock Game Parameters
const TILE_TYPES = {
  soil: { health: 100, yieldAmount: 10, value: 5 },
  rock: { health: 250, yieldAmount: 10, value: 10 },
  granite: { health: 500, yieldAmount: 10, value: 20 },
  iron: { health: 300, yieldAmount: 15, value: 35 },
  copper: { health: 400, yieldAmount: 15, value: 50 },
  lithium: { health: 600, yieldAmount: 12, value: 120 },
  bananium: { health: 1000, yieldAmount: 8, value: 300 }
};

const BASE_DIG_SPEED = 25; // HP per tick
const TICK_INTERVAL_MS = 500;

function runSimulation(ticksToSimulate = 100) {
  let playerCredits = 500;
  let playerMinerals = 0;
  let tilesMined = 0;

  console.log(`Simulating ${ticksToSimulate} ticks (${(ticksToSimulate * TICK_INTERVAL_MS) / 1000}s of gameplay)...`);

  const queue = ['soil', 'soil', 'rock', 'iron', 'copper', 'lithium', 'bananium'];

  queue.forEach(type => {
    const tile = TILE_TYPES[type];
    const ticksNeeded = Math.ceil(tile.health / BASE_DIG_SPEED);
    const timeSec = (ticksNeeded * TICK_INTERVAL_MS) / 1000;
    const grossValue = tile.yieldAmount * tile.value;

    tilesMined++;
    playerMinerals += tile.yieldAmount;
    playerCredits += grossValue;

    console.log(`- Mined [${type.toUpperCase()}] in ${ticksNeeded} ticks (${timeSec}s) -> Yield: ${tile.yieldAmount} units ($${grossValue})`);
  });

  console.log('\n=== RESULTS SUMMARY ===');
  console.log(`Total Tiles Mined: ${tilesMined}`);
  console.log(`Accumulated Minerals: ${playerMinerals}`);
  console.log(`Final Credits Balance: $${playerCredits}`);
}

runSimulation(100);
