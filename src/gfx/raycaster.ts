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
    // Recursive true to hit meshes inside cloned GLTF groups (base, relays, props)
    const intersects = this.raycaster.intersectObjects(targetGroup.children, true);

    for (const hit of intersects) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj && obj !== targetGroup) {
        if (obj.userData && obj.userData.tileId) {
          return obj.userData.tileId as string;
        }
        obj = obj.parent;
      }
    }

    return null;
  }
}
