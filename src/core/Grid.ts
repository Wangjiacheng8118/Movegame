import { LevelData, Cell, SwitchDef } from './types';

/** 网格地图 — 边界查询、路障动态开关、机关切换 */
export class Grid {
  width: number;
  height: number;
  private floorSet: Set<string>;
  private barrierSet: Set<string>;
  private switchMap: Map<string, SwitchDef>;
  /** 机关切换状态：false=关闭（路障存在），true=激活（路障消失） */
  private switchToggleState: Map<string, boolean>;

  constructor(level: LevelData) {
    this.width = level.width;
    this.height = level.height;
    this.floorSet = new Set();
    this.barrierSet = new Set();
    this.switchMap = new Map();
    this.switchToggleState = new Map();

    for (let z = 0; z < level.height; z++) {
      for (let x = 0; x < level.width; x++) {
        const val = level.floorMap[z][x];
        const key = `${x},${z}`;
        if (val === 1 || val === 2) {
          this.floorSet.add(key);
        } else if (val === 3) {
          this.barrierSet.add(key);
        }
      }
    }

    if (level.switches) {
      for (const sw of level.switches) {
        const key = `${sw.cell.x},${sw.cell.z}`;
        this.switchMap.set(key, sw);
        this.switchToggleState.set(key, false);
      }
    }
  }

  isFloor(x: number, z: number): boolean {
    return this.floorSet.has(`${x},${z}`);
  }

  areAllFloor(cells: Cell[]): boolean {
    return cells.every((c) => this.isFloor(c.x, c.z));
  }

  isBarrier(x: number, z: number): boolean {
    return this.barrierSet.has(`${x},${z}`);
  }

  isSwitch(x: number, z: number): boolean {
    return this.switchMap.has(`${x},${z}`);
  }

  getSwitch(x: number, z: number): SwitchDef | undefined {
    return this.switchMap.get(`${x},${z}`);
  }

  isSwitchActivated(x: number, z: number): boolean {
    return this.switchToggleState.get(`${x},${z}`) === true;
  }

  removeBarrier(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.barrierSet.has(key)) {
      this.barrierSet.delete(key);
      this.floorSet.add(key);
      return true;
    }
    return false;
  }

  addBarrier(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.floorSet.has(key) && !this.barrierSet.has(key)) {
      this.floorSet.delete(key);
      this.barrierSet.add(key);
      return true;
    }
    return false;
  }

  toggleSwitch(x: number, z: number): boolean | undefined {
    const key = `${x},${z}`;
    const current = this.switchToggleState.get(key);
    if (current === undefined) return undefined;
    const newState = !current;
    this.switchToggleState.set(key, newState);
    return newState;
  }
}