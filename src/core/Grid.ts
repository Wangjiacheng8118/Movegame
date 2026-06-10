import { LevelData, Cell } from './types';

/** 网格地图 — 边界查询 */
export class Grid {
  width: number;
  height: number;
  private floorSet: Set<string>;

  constructor(level: LevelData) {
    this.width = level.width;
    this.height = level.height;
    this.floorSet = new Set();
    for (let z = 0; z < level.height; z++) {
      for (let x = 0; x < level.width; x++) {
        if (level.floorMap[z][x] === 1) {
          this.floorSet.add(`${x},${z}`);
        }
      }
    }
  }

  /** 判断格子是否为路径 */
  isFloor(x: number, z: number): boolean {
    return this.floorSet.has(`${x},${z}`);
  }

  /** 判断一组格子是否全部在路径上 */
  areAllFloor(cells: Cell[]): boolean {
    return cells.every((c) => this.isFloor(c.x, c.z));
  }
}