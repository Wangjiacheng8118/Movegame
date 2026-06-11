import { LevelData, Cell, SwitchDef } from './types';

/** 网格地图 — 边界查询、路障动态开关 */
export class Grid {
  width: number;
  height: number;
  private floorSet: Set<string>;
  private barrierSet: Set<string>;
  private switchMap: Map<string, SwitchDef>;

  constructor(level: LevelData) {
    this.width = level.width;
    this.height = level.height;
    this.floorSet = new Set();
    this.barrierSet = new Set();
    this.switchMap = new Map();

    for (let z = 0; z < level.height; z++) {
      for (let x = 0; x < level.width; x++) {
        const val = level.floorMap[z][x];
        const key = `${x},${z}`;
        if (val === 1 || val === 2) {
          // 1=地板, 2=机关格（也是地板）
          this.floorSet.add(key);
        } else if (val === 3) {
          // 3=路障格（初始不可通行）
          this.barrierSet.add(key);
        }
        // val === 0: 空，不加入任何集合
      }
    }

    // 建立机关映射
    if (level.switches) {
      for (const sw of level.switches) {
        this.switchMap.set(`${sw.cell.x},${sw.cell.z}`, sw);
      }
    }
  }

  /** 判断格子是否为路径（地板 + 机关格，不含路障） */
  isFloor(x: number, z: number): boolean {
    return this.floorSet.has(`${x},${z}`);
  }

  /** 判断一组格子是否全部在路径上 */
  areAllFloor(cells: Cell[]): boolean {
    return cells.every((c) => this.isFloor(c.x, c.z));
  }

  /** 判断格子是否为路障 */
  isBarrier(x: number, z: number): boolean {
    return this.barrierSet.has(`${x},${z}`);
  }

  /** 判断格子是否为机关 */
  isSwitch(x: number, z: number): boolean {
    return this.switchMap.has(`${x},${z}`);
  }

  /** 获取机关定义（如果该格子是机关） */
  getSwitch(x: number, z: number): SwitchDef | undefined {
    return this.switchMap.get(`${x},${z}`);
  }

  /** 移除路障（机关触发后调用） */
  removeBarrier(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.barrierSet.has(key)) {
      this.barrierSet.delete(key);
      this.floorSet.add(key); // 路障消失，变为可通行地板
      return true;
    }
    return false;
  }

  /** 移除机关标记（触发后变为普通地板） */
  removeSwitch(x: number, z: number): void {
    this.switchMap.delete(`${x},${z}`);
  }
}