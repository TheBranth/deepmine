import * as THREE from 'three';

export class SubterraneanRaycaster {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public getIntersectedTileId(
    event: MouseEvent | PointerEvent,
    container: HTMLDivElement,
    camera: THREE.Camera,
    targetGroup: THREE.Group
  ): string | null {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(targetGroup.children, false);

    if (intersects.length > 0) {
      const topMesh = intersects[0].object;
      if (topMesh && topMesh.userData && topMesh.userData.tileId) {
        return topMesh.userData.tileId as string;
      }
    }

    return null;
  }
}
