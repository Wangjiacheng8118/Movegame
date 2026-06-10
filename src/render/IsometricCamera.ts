import * as THREE from 'three';

/** 等距正交摄像机 */
export class IsometricCamera {
  camera: THREE.OrthographicCamera;

  constructor(viewportWidth: number, viewportHeight: number) {
    const aspect = viewportWidth / viewportHeight;
    const frustumSize = 8;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    // 等距视角：从 (1,1,1) 方向看向原点
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  /** 根据网格尺寸调整摄像机 */
  adjustToGrid(width: number, height: number): void {
    const centerX = width / 2;
    const centerZ = height / 2;
    const distance = Math.max(width, height) * 1.2;
    this.camera.position.set(
      centerX + distance,
      distance,
      centerZ + distance
    );
    this.camera.lookAt(centerX, 0, centerZ);
  }
}