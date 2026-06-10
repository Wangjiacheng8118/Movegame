import * as THREE from 'three';
import { Grid } from '../core/Grid';
import { LevelData, Cell } from '../core/types';

/** 网格地板3D渲染 */
export class GridRenderer {
  group: THREE.Group;

  constructor(grid: Grid, level: LevelData) {
    this.group = new THREE.Group();

    for (let z = 0; z < level.height; z++) {
      for (let x = 0; x < level.width; x++) {
        if (grid.isFloor(x, z)) {
          const geo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
          const mat = new THREE.MeshStandardMaterial({
            color: this.getCellColor(x, z, level),
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x + 0.5, -0.1, z + 0.5);
          this.group.add(mesh);
        }
      }
    }

    // 起点标记
    this.addMarker(level.start, 0x44cc44, 0.05);
    // 终点标记
    this.addMarker(level.goal, 0xcc4444, 0.08);
  }

  private addMarker(cell: Cell, color: number, yOffset: number): void {
    const geo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cell.x + 0.5, yOffset, cell.z + 0.5);
    this.group.add(mesh);
  }

  private getCellColor(x: number, z: number, level: LevelData): number {
    if (x === level.start.x && z === level.start.z) return 0x55aa55;
    if (x === level.goal.x && z === level.goal.z) return 0xaa4444;
    return 0xddd8c4;
  }
}