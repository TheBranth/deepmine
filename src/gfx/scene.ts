import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cleanup: () => void;
}

export function createSubterraneanScene(container: HTMLDivElement): SceneContext {
  // 1. Scene Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0d12);
  scene.fog = new THREE.FogExp2(0x0c0d12, 0.012);

  // 2. Camera Setup (Cutaway perspective)
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
  camera.position.set(0, -6, 26);
  camera.lookAt(0, -6, 0);

  // 3. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.position.set(12, 22, 22);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  scene.add(sunLight);

  const subtleFillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
  subtleFillLight.position.set(-12, -12, 12);
  scene.add(subtleFillLight);

  // 4. Renderer Setup
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // 5. Interactive Pan & Zoom Controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  const onPointerDown = (e: PointerEvent) => {
    // Middle click or Right click or Left click drag
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const factor = (camera.position.z / 1000) * 1.2;
      camera.position.x -= deltaX * factor;
      camera.position.y += deltaY * factor;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.02;
    camera.position.z = Math.min(55, Math.max(10, camera.position.z + zoomDelta));
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onContextMenu);

  // 6. Resize Handler
  const handleResize = () => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    dom.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    dom.removeEventListener('wheel', onWheel);
    dom.removeEventListener('contextmenu', onContextMenu);
    renderer.dispose();
    if (container.contains(dom)) {
      container.removeChild(dom);
    }
  };

  return { scene, camera, renderer, cleanup };
}
