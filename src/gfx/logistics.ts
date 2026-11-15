import * as THREE from 'three';
import type { Tile, TransportTask } from '../types';
import { modelManager } from './models';

export class LogisticsManager {
  private group: THREE.Group;
  private lineGeometries: THREE.BufferGeometry[] = [];
  private cargoGroups: Map<string, THREE.Group> = new Map();
  private sharedCargoGeo: THREE.SphereGeometry;
  private cargoMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

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
    // 1. Clean previous pipeline lines
    this.lineGeometries.forEach(geo => geo.dispose());
    this.lineGeometries = [];

    const linesToRemove = this.group.children.filter(child => child instanceof THREE.Line);
    linesToRemove.forEach(line => this.group.remove(line));

    // 2. Render 3D Logistics Relay lines to Base (Glowing conduits)
    if (baseLocation && tiles[baseLocation]) {
      const baseTile = tiles[baseLocation];
      const basePos = new THREE.Vector3(baseTile.x * 1.15, -baseTile.y * 1.15, 0.45);

      Object.values(tiles).forEach(tile => {
        if (tile.structure === 'relay' && tile.claimedBy === currentUser) {
          const relayPos = new THREE.Vector3(tile.x * 1.15, -tile.y * 1.15, 0.45);

          // Manhattan line points
          const midPos = new THREE.Vector3(relayPos.x, basePos.y, 0.45);
          const points = [relayPos, midPos, basePos];

          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          this.lineGeometries.push(lineGeo);

          const lineMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            linewidth: 3,
            transparent: true,
            opacity: 0.75,
          });

          const line = new THREE.Line(lineGeo, lineMat);
          this.group.add(line);
        }
      });
    }

    // 3. Render 3D Transport Cargo Craft & Payloads
    const now = Date.now();
    const activeTaskIds = new Set<string>();

    transportQueue.forEach(task => {
      const fromTile = tiles[task.fromId];
      const toTile = tiles[task.toId];

      if (!fromTile || !toTile) return;

      activeTaskIds.add(task.id);

      const elapsed = now - task.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / task.duration));

      const minePos = new THREE.Vector3(fromTile.x * 1.15, -fromTile.y * 1.15, 0.55);
      const hubPos = new THREE.Vector3(toTile.x * 1.15, -toTile.y * 1.15, 0.55);

      // Round trip: first half (0..0.5) hub -> mine (empty), second half (0.5..1) mine -> hub (loaded)
      const isOutbound = progress < 0.5;
      const legProgress = isOutbound ? progress * 2 : (progress - 0.5) * 2;
      const legStart = isOutbound ? hubPos : minePos;
      const legEnd = isOutbound ? minePos : hubPos;

      const { pos: currentPos, headingAngle } = this.computeManhattanStep(legStart, legEnd, legProgress);

      // Add gentle hovering oscillation
      currentPos.z += Math.sin(elapsedSec * 8 + task.duration) * 0.05;

      let cargoGroup = this.cargoGroups.get(task.id);
      const isMyTask = task.ownerId === currentUser;

      if (!cargoGroup) {
        cargoGroup = new THREE.Group();
        // Use Kenney 3D Cargo Craft
        const modelKey = isMyTask ? 'cargo' : 'cargoAlt';
        const craftModel = modelManager.cloneModel(modelKey);

        if (craftModel) {
          craftModel.scale.set(0.28, 0.28, 0.28);
          // Adjust model tilt for 3D diorama cutaway
          craftModel.rotation.x = Math.PI / 4;
          cargoGroup.add(craftModel);

          // Add resource barrel on top (only visible on return leg with cargo)
          const barrelModel = modelManager.cloneModel('barrel');
          if (barrelModel) {
            barrelModel.scale.set(0.7, 0.7, 0.7);
            barrelModel.position.set(0, 0, 0.15);
            barrelModel.userData.isCargoBarrel = true;
            cargoGroup.add(barrelModel);
          }
        } else {
          // Fallback procedural sphere
          const fallbackMesh = new THREE.Mesh(this.sharedCargoGeo, this.cargoMaterial);
          cargoGroup.add(fallbackMesh);
        }

        this.group.add(cargoGroup);
        this.cargoGroups.set(task.id, cargoGroup);
      }

      // Show barrel only once ore is picked up at the mined tile
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
        headingAngle: dx >= 0 ? 0 : Math.PI,
      };
    }

    const segP = threshold < 1 ? (progress - threshold) / (1 - threshold) : 0;
    return {
      pos: new THREE.Vector3(endPos.x, startPos.y + dy * segP, startPos.z),
      headingAngle: dy >= 0 ? Math.PI / 2 : -Math.PI / 2,
    };
  }

  public cleanup() {
    this.lineGeometries.forEach(geo => geo.dispose());
    this.cargoGroups.forEach(grp => this.group.remove(grp));
    this.cargoGroups.clear();
    this.group.clear();
  }
}
