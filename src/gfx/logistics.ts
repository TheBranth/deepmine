import * as THREE from 'three';
import type { Tile, TransportTask } from '../types';
import { modelManager } from './models';

const ZIPLINE_RANGE = 5;
const ZIPLINE_SPEED_MULT = 3.0;

export class LogisticsManager {
  private group: THREE.Group;
  private tubeMeshes: THREE.Mesh[] = [];
  private sharedTubeGeo: THREE.CylinderGeometry;
  private tubeMaterial: THREE.MeshStandardMaterial;
  private wormholeMaterial: THREE.MeshStandardMaterial;
  private cargoGroups: Map<string, THREE.Group> = new Map();
  private sharedCargoGeo: THREE.SphereGeometry;
  private cargoMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.sharedTubeGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 8);
    this.tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2,
    });

    this.wormholeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
    });

    this.sharedCargoGeo = new THREE.SphereGeometry(0.18, 12, 12);
    this.cargoMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
    });
  }

  public update(
    tiles: Record<string, Tile>,
    transportQueue: TransportTask[],
    currentUser: string | null,
    baseLocation: string | null,
    elapsedSec: number
  ) {
    // 1. Clean previous zipline tubes
    this.tubeMeshes.forEach(m => this.group.remove(m));
    this.tubeMeshes = [];

    // 2. Render Zipline Tubes between Base and Relays within 5 cells
    const hubs: Tile[] = [];
    if (baseLocation && tiles[baseLocation]) {
      hubs.push(tiles[baseLocation]);
    }
    Object.values(tiles).forEach(tile => {
      if (tile.structure === 'relay' && tile.claimedBy === currentUser) {
        hubs.push(tile);
      }
    });

    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const a = hubs[i];
        const b = hubs[j];
        const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (dist <= ZIPLINE_RANGE) {
          this.addZiplineTube(
            new THREE.Vector3(a.x * 1.15, -a.y * 1.15, 0.45),
            new THREE.Vector3(b.x * 1.15, -b.y * 1.15, 0.45),
            this.tubeMaterial
          );
        }
      }
    }

    // 2b. Render Wormhole Warp Tethers between paired wormholes
    const drawnWormholes = new Set<string>();
    Object.values(tiles).forEach(tile => {
      if (tile.structure === 'wormhole' && tile.building?.linkedTileId) {
        const pairKey = [tile.id, tile.building.linkedTileId].sort().join('|');
        if (drawnWormholes.has(pairKey)) return;
        drawnWormholes.add(pairKey);
        const linked = tiles[tile.building.linkedTileId];
        if (linked) {
          this.addZiplineTube(
            new THREE.Vector3(tile.x * 1.15, -tile.y * 1.15, 0.45),
            new THREE.Vector3(linked.x * 1.15, -linked.y * 1.15, 0.45),
            this.wormholeMaterial
          );
        }
      }
    });

    // 3. Render 3D Transport Cargo Craft & Payloads (Round-trip along ziplines + chug)
    const now = Date.now();
    const activeTaskIds = new Set<string>();

    transportQueue.forEach(task => {
      const fromTile = tiles[task.fromId];
      const toTile = tiles[task.toId];
      if (!fromTile || !toTile) return;

      activeTaskIds.add(task.id);

      const elapsed = now - task.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / task.duration));

      // Outbound: 0..0.5 (hub -> mine, empty), Return: 0.5..1.0 (mine -> hub, loaded)
      const isOutbound = progress < 0.5;
      const legProgress = isOutbound ? progress * 2 : (progress - 0.5) * 2;

      const routePoints =
        task.route && task.route.length >= 2
          ? task.route
          : [
              { x: toTile.x, y: toTile.y, fast: false },
              { x: fromTile.x, y: fromTile.y, fast: false },
            ];

      const orderedPoints = isOutbound ? routePoints : [...routePoints].reverse();
      const { pos: currentPos, headingAngle } = this.sampleWeightedRoute(orderedPoints, legProgress);

      // Gentle hovering oscillation
      currentPos.z += Math.sin(elapsedSec * 8 + task.duration) * 0.05;

      let cargoGroup = this.cargoGroups.get(task.id);
      const isMyTask = task.ownerId === currentUser;

      if (!cargoGroup) {
        cargoGroup = new THREE.Group();
        const modelKey = isMyTask ? 'cargo' : 'cargoAlt';
        const craftModel = modelManager.cloneModel(modelKey);

        if (craftModel) {
          craftModel.scale.set(0.28, 0.28, 0.28);
          craftModel.rotation.x = Math.PI / 2.2;
          cargoGroup.add(craftModel);

          const barrelModel = modelManager.cloneModel('barrel');
          if (barrelModel) {
            barrelModel.scale.set(0.7, 0.7, 0.7);
            barrelModel.position.set(0, 0, 0.15);
            barrelModel.userData.isCargoBarrel = true;
            cargoGroup.add(barrelModel);
          }
        } else {
          const fallbackMesh = new THREE.Mesh(this.sharedCargoGeo, this.cargoMaterial);
          cargoGroup.add(fallbackMesh);
        }

        this.group.add(cargoGroup);
        this.cargoGroups.set(task.id, cargoGroup);
      }

      cargoGroup.children.forEach(child => {
        if (child.userData.isCargoBarrel) {
          child.visible = !isOutbound;
        }
      });

      cargoGroup.position.copy(currentPos);
      cargoGroup.rotation.z = headingAngle;
    });

    // Clean up finished cargo groups
    this.cargoGroups.forEach((grp, id) => {
      if (!activeTaskIds.has(id)) {
        this.group.remove(grp);
        this.cargoGroups.delete(id);
      }
    });
  }

  private addZiplineTube(start: THREE.Vector3, end: THREE.Vector3, mat: THREE.Material) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    if (len < 0.01) return;

    const tube = new THREE.Mesh(this.sharedTubeGeo, mat);
    tube.position.copy(start).addScaledVector(dir, 0.5);
    tube.scale.set(1, len, 1);
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    this.group.add(tube);
    this.tubeMeshes.push(tube);
  }

  private sampleWeightedRoute(
    points: Array<{ x: number; y: number; fast: boolean }>,
    legProgress: number
  ): { pos: THREE.Vector3; headingAngle: number } {
    if (points.length === 0) {
      return { pos: new THREE.Vector3(0, 0, 0.55), headingAngle: 0 };
    }
    if (points.length === 1) {
      return { pos: new THREE.Vector3(points[0].x * 1.15, -points[0].y * 1.15, 0.55), headingAngle: 0 };
    }

    // Build segments with travel time weights (fast zipline segments take 1/3 the time per unit)
    const segments: Array<{
      a: THREE.Vector3;
      b: THREE.Vector3;
      weight: number;
      fast: boolean;
    }> = [];

    let totalWeight = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const pA = points[i];
      const pB = points[i + 1];
      const a = new THREE.Vector3(pA.x * 1.15, -pA.y * 1.15, 0.55);
      const b = new THREE.Vector3(pB.x * 1.15, -pB.y * 1.15, 0.55);
      const dist = Math.abs(pB.x - pA.x) + Math.abs(pB.y - pA.y);
      const isFast = pA.fast && pB.fast;
      const weight = dist === 0 ? 0.001 : isFast ? dist / ZIPLINE_SPEED_MULT : dist;
      segments.push({ a, b, weight, fast: isFast });
      totalWeight += weight;
    }

    const targetWeight = legProgress * totalWeight;
    let accum = 0;
    for (const seg of segments) {
      if (accum + seg.weight >= targetWeight || seg === segments[segments.length - 1]) {
        const segP = seg.weight > 0 ? Math.min(1, Math.max(0, (targetWeight - accum) / seg.weight)) : 1;
        if (seg.fast) {
          // Direct zipline flight between connected hubs
          const pos = new THREE.Vector3().lerpVectors(seg.a, seg.b, segP);
          const dx = seg.b.x - seg.a.x;
          const dy = seg.b.y - seg.a.y;
          const headingAngle = Math.atan2(dy, dx) - Math.PI / 2;
          return { pos, headingAngle };
        }
        return this.computeManhattanStep(seg.a, seg.b, segP);
      }
      accum += seg.weight;
    }

    const last = points[points.length - 1];
    return { pos: new THREE.Vector3(last.x * 1.15, -last.y * 1.15, 0.55), headingAngle: 0 };
  }

  private computeManhattanStep(startPos: THREE.Vector3, endPos: THREE.Vector3, progress: number) {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const totalDist = Math.abs(dx) + Math.abs(dy);

    if (totalDist === 0) {
      return { pos: startPos.clone(), headingAngle: 0 };
    }

    const threshold = Math.abs(dx) / totalDist;
    if (progress <= threshold) {
      const segP = threshold > 0 ? progress / threshold : 0;
      return {
        pos: new THREE.Vector3(startPos.x + dx * segP, startPos.y, startPos.z),
        // Nose at rot.z=0 points +Y; -PI/2 aligns nose with direction of travel
        headingAngle: Math.atan2(0, dx >= 0 ? 1 : -1) - Math.PI / 2,
      };
    }

    const segP = threshold < 1 ? (progress - threshold) / (1 - threshold) : 0;
    return {
      pos: new THREE.Vector3(endPos.x, startPos.y + dy * segP, startPos.z),
      headingAngle: Math.atan2(dy >= 0 ? 1 : -1, 0) - Math.PI / 2,
    };
  }

  public cleanup() {
    this.sharedTubeGeo.dispose();
    this.tubeMaterial.dispose();
    this.wormholeMaterial.dispose();
    this.sharedCargoGeo.dispose();
    this.cargoMaterial.dispose();
    this.tubeMeshes.forEach(m => this.group.remove(m));
    this.tubeMeshes = [];
    this.cargoGroups.forEach(grp => this.group.remove(grp));
    this.cargoGroups.clear();
    this.group.clear();
  }
}
