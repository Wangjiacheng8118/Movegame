import * as THREE from 'three';
import { Grid } from '../core/Grid';
import { LevelData, Cell } from '../core/types';

/** 机关/路障格子颜色 */
const COLOR_SWITCH = 0xddaa22;     // 金色 — 机关格
const COLOR_BARRIER = 0xcc3333;    // 红色 — 路障格
const COLOR_FLOOR = 0xddd8c4;      // 米色 — 普通地板
const COLOR_START = 0x55aa55;      // 绿色 — 起点
const COLOR_GOAL = 0xaa4444;       // 红色 — 终点

/** 网格地板3D渲染 */
export class GridRenderer {
  group: THREE.Group;
  private barrierMeshes: Map<string, THREE.Mesh>;
  private switchMeshes: Map<string, THREE.Mesh>;

  constructor(grid: Grid, level: LevelData) {
    this.group = new THREE.Group();
    this.barrierMeshes = new Map();
    this.switchMeshes = new Map();

    for (let z = 0; z < level.height; z++) {
      for (let x = 0; x < level.width; x++) {
        const val = level.floorMap[z][x];

        if (val === 0) continue; // 空

        if (val === 1 || val === 2) {
          // 地板 / 机关格（机关格也是地板，可通行）
          const color = this.getCellColor(x, z, level, val);
          const geo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
          const mat = new THREE.MeshStandardMaterial({ color });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x + 0.5, -0.1, z + 0.5);
          this.group.add(mesh);

          // 机关格额外标记
          if (val === 2) {
            this.addSwitchMarker(x, z);
          }
        } else if (val === 3) {
          // 路障格：不可通行的障碍
          this.addBarrier(x, z);
        }
      }
    }

    // 起点标记
    this.addMarker(level.start, 0x44cc44, 0.05);
    // 终点标记
    this.addMarker(level.goal, 0xcc4444, 0.08);
  }

  /** 添加路障方块 */
  private addBarrier(x: number, z: number): void {
    // 底层地板（路障移除后可见）
    const floorGeo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
    const floorMat = new THREE.MeshStandardMaterial({ color: COLOR_FLOOR });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(x + 0.5, -0.1, z + 0.5);
    this.group.add(floorMesh);

    // 路障方块（高0.6，显眼障碍）
    const barrierGeo = new THREE.BoxGeometry(0.85, 0.6, 0.85);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: COLOR_BARRIER,
      transparent: true,
      opacity: 0.85,
    });
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.position.set(x + 0.5, 0.3, z + 0.5);
    this.group.add(barrierMesh);

    this.barrierMeshes.set(`${x},${z}`, barrierMesh);
  }

  /** 添加机关格标记（金色圆盘） */
  private addSwitchMarker(x: number, z: number): void {
    const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const mat = new THREE.MeshStandardMaterial({ color: COLOR_SWITCH });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + 0.5, 0.04, z + 0.5);
    this.group.add(mesh);

    this.switchMeshes.set(`${x},${z}`, mesh);
  }

  /** 移除路障方块（机关触发后调用） */
  removeBarrier(x: number, z: number): void {
    const key = `${x},${z}`;
    const mesh = this.barrierMeshes.get(key);
    if (mesh) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.barrierMeshes.delete(key);
    }
  }

  /** 移除机关标记（触发后变灰） */
  removeSwitchMarker(x: number, z: number): void {
    const key = `${x},${z}`;
    const mesh = this.switchMeshes.get(key);
    if (mesh) {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x888866);
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0.5;
      (mesh.material as THREE.MeshStandardMaterial).transparent = true;
      this.switchMeshes.delete(key);
    }
  }

  private addMarker(cell: Cell, color: number, yOffset: number): void {
    const geo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cell.x + 0.5, yOffset, cell.z + 0.5);
    this.group.add(mesh);
  }

  private getCellColor(x: number, z: number, level: LevelData, val: number): number {
    if (x === level.start.x && z === level.start.z) return COLOR_START;
    if (x === level.goal.x && z === level.goal.z) return COLOR_GOAL;
    if (val === 2) return 0xccbb55; // 机关格底色：暗金色
    return COLOR_FLOOR;
  }
}
