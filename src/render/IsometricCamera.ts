import * as THREE from 'three';

/** 等距正交摄像机（支持缩放） */
export class IsometricCamera {
  camera: THREE.OrthographicCamera;
  private baseFrustumSize = 8;
  private zoomLevel = 1;
  private minZoom = 0.5;  // 最大放大50%
  private maxZoom = 1.5;  // 最小缩小50%

  constructor(viewportWidth: number, viewportHeight: number) {
    const aspect = viewportWidth / viewportHeight;
    const fs = this.baseFrustumSize * this.zoomLevel;
    this.camera = new THREE.OrthographicCamera(
      -fs * aspect / 2,
      fs * aspect / 2,
      fs / 2,
      -fs / 2,
      0.1,
      1000
    );
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

  /** 缩放 (delta > 0 放大, delta < 0 缩小) */
  zoom(delta: number): void {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    this.updateFrustum();
  }

  /** 重置缩放 */
  resetZoom(): void {
    this.zoomLevel = 1;
    this.updateFrustum();
  }

  /** 更新视锥体 */
  private updateFrustum(): void {
    const fs = this.baseFrustumSize * this.zoomLevel;
    const aspect = this.camera.right / this.camera.top;
    this.camera.left = -fs * aspect / 2;
    this.camera.right = fs * aspect / 2;
    this.camera.top = fs / 2;
    this.camera.bottom = -fs / 2;
    this.camera.updateProjectionMatrix();
  }
}