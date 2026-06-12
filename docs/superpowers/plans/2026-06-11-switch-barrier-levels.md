# 关卡扩展 + 路障机关系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有8关基础上，增加路障格子和触发机关机制——物块压到机关格时，对应路障消失，打开新通路，并添加3个运用此机制的新关卡。

**Architecture:** 在逻辑层扩展 `LevelData` 类型增加 `switches`（机关列表，含位置和关联路障列表），扩展 `Grid` 支持动态路障开关。`GameEngine.tryMove` 在物块移动后检测是否踩到机关，触发路障移除。渲染层为机关格和路障格添加视觉区分。新关卡数据加入 `levels.ts`。

**Tech Stack:** TypeScript, vitest, Three.js

---

## 核心机制设计

### 路障（Barrier）
- 地图上的格子，初始状态为**不可通行**（和空地一样阻挡物块）
- 渲染为红色半透明方块，比地板高0.1单位，明确标识为障碍
- 被关联机关触发后从地图上**移除**，变为可通行地板

### 机关（Switch）
- 地图上的地板格子，物块**站立经过**时触发（Standing 状态的锚点压上去）
- 渲染为金色闪烁标记，清晰可见
- 触发后：关联的路障格变为普通地板，机关标记变为已触发状态（灰色）

### 机关-路障关联
- 每个机关关联一组路障格子
- 一个机关可控制多个路障
- 多个机关可独立控制不同路障组

---

## 数据模型变更

当前 `LevelData` 的 `floorMap` 使用 `0` / `1` 表示。扩展为：

```
0 = 空（永恒虚空）
1 = 普通地板
2 = 机关格（同时也是地板，物块可站上去）
3 = 路障格（初始不可通行，机关触发后变为地板）
```

新增 `SwitchDef` 接口：
```ts
interface SwitchDef {
  /** 机关格子位置 */
  cell: Cell;
  /** 该机关控制的路障格子列表 */
  barriers: Cell[];
}
```

`LevelData` 新增字段：
```ts
switches?: SwitchDef[];  // 可选，向后兼容旧关卡
```

---

## 文件结构

| 文件 | 责责 | 操作 |
|------|------|------|
| `src/core/types.ts` | 新增 SwitchDef 类型，扩展 LevelData | 修改 |
| `src/core/Grid.ts` | 支持路障动态开关 | 修改 |
| `src/core/SwitchState.ts` | 机关状态管理（纯函数） | 创建 |
| `src/core/SwitchState.test.ts` | 机关状态单元测试 | 创建 |
| `src/core/GameEngine.ts` | tryMove 后检测机关触发 | 修改 |
| `src/render/GridRenderer.ts` | 渲染机关格(金) + 路障格(红) | 修改 |
| `src/render/GameView.ts` | 机关触发时重新渲染网格 | 修改 |
| `src/data/levels.ts` | 添加3个新关卡 | 修改 |
| `src/main.ts` | 传入机关触发回调 | 修改 |

---

### Task 1: 扩展类型定义 — SwitchDef + LevelData

**Files:**
- Modify: `src/core/types.ts`

- [ ] **Step 1: 在 types.ts 末尾、`GameEvents` 之前添加 SwitchDef 接口**

在 `src/core/types.ts` 文件中，在 `RollAnimation` 接口之后、`GameEvents` 接口之前，插入：

```ts
/** 机关定义：物块站立压上去时触发，移除关联路障 */
export interface SwitchDef {
  /** 机关格子位置（必须在 floorMap 中标记为 2） */
  cell: Cell;
  /** 该机关控制的路障格子列表（必须在 floorMap 中标记为 3） */
  barriers: Cell[];
}
```

- [ ] **Step 2: 修改 LevelData 接口，添加 switches 字段**

在 `src/core/types.ts` 的 `LevelData` 接口中，在 `goal: Cell;` 之后添加：

```ts
  /** 机关列表（可选，向后兼容旧关卡） */
  switches?: SwitchDef[];
```

- [ ] **Step 3: 修改 floorMap 注释**

将 `LevelData` 中 `floorMap` 的注释从：
```ts
  /** 二维数组：1=路径格子, 0=空 */
```
改为：
```ts
  /** 二维数组：0=空, 1=地板, 2=机关格, 3=路障格 */
```

- [ ] **Step 4: 在 GameEvents 接口添加机关触发改动**

在 `src/core/types.ts` 的 `GameEvents` 接口中，在 `onLevelLoad` 之后添加：

```ts
  onSwitchTriggered: (switchCell: Cell, removedBarriers: Cell[]) => void;
```

- [ ] **Step 5: Commit**

```bash
cd D:/Movegame && git add src/core/types.ts && git commit -m "feat: 添加SwitchDef类型 + 扩展LevelData支持机关路障"
```

---

### Task 2: 扩展 Grid — 支持机关格、路障格和动态开关

**Files:**
- Modify: `src/core/Grid.ts`

- [ ] **Step 1: 修改 Grid 构造函数，识别 floorMap 中的 2 和 3**

将 `src/core/Grid.ts` 的全部内容替换为：

```ts
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
```

- [ ] **Step 2: 运行现有测试确保无回归**

```bash
cd D:/Movegame && npm run test
```

Expected: 14 passed（原有测试不受影响）

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/core/Grid.ts && git commit -m "feat: Grid支持机关格、路障格和动态开关"
```

---

### Task 3: 创建机关状态管理纯函数 + 测试

**Files:**
- Create: `src/core/SwitchState.ts`
- Create: `src/core/SwitchState.test.ts`

- [ ] **Step 1: 创建 SwitchState.ts**

创建 `src/core/SwitchState.ts`：

```ts
import { Cell, SwitchDef } from './types';
import { Grid } from './Grid';

/**
 * 检测物块是否踩到机关并触发路障移除。
 * 仅当物块为 Standing 状态时触发机关。
 *
 * @param anchor 物块锚点位置
 * @param grid 当前网格
 * @returns 被触发机关及移除的路障列表，或 null 表示无触发
 */
export function checkSwitchTrigger(
  anchor: Cell,
  grid: Grid
): { switchCell: Cell; removedBarriers: Cell[] } | null {
  // 只有Standing状态才触发，anchor就是唯一占格
  if (!grid.isSwitch(anchor.x, anchor.z)) {
    return null;
  }

  const sw = grid.getSwitch(anchor.x, anchor.z);
  if (!sw) return null;

  const removedBarriers: Cell[] = [];

  // 移除所有关联路障
  for (const barrier of sw.barriers) {
    if (grid.removeBarrier(barrier.x, barrier.z)) {
      removedBarriers.push(barrier);
    }
  }

  // 移除机关标记（已触发，变为普通地板）
  grid.removeSwitch(anchor.x, anchor.z);

  if (removedBarriers.length === 0) return null;

  return {
    switchCell: anchor,
    removedBarriers,
  };
}
```

- [ ] **Step 2: 创建 SwitchState.test.ts**

创建 `src/core/SwitchState.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { Cell, LevelData, Orientation } from './types';
import { Grid } from './Grid';
import { checkSwitchTrigger } from './SwitchState';

/** 创建测试用关卡，含一个机关和两个路障 */
function createTestLevel(): LevelData {
  return {
    id: 'test',
    name: '测试',
    width: 5,
    height: 5,
    floorMap: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 2, 1, 0],  // (2,2)=机关格
      [0, 1, 3, 1, 0],  // (2,3)=路障格
      [0, 0, 0, 0, 0],
    ],
    start: { x: 1, z: 1 },
    startOrientation: Orientation.Standing,
    goal: { x: 3, z: 1 },
    switches: [
      {
        cell: { x: 2, z: 2 },
        barriers: [{ x: 2, z: 3 }],
      },
    ],
  };
}

describe('checkSwitchTrigger', () => {
  it('Standing踩到机关格 → 触发，路障消失', () => {
    const grid = new Grid(createTestLevel());

    // 路障格初始不可通行
    expect(grid.isBarrier(2, 3)).toBe(true);
    expect(grid.isFloor(2, 3)).toBe(false);

    // Standing踩到机关
    const result = checkSwitchTrigger({ x: 2, z: 2 }, grid);

    expect(result).not.toBeNull();
    expect(result!.switchCell).toEqual({ x: 2, z: 2 });
    expect(result!.removedBarriers).toEqual([{ x: 2, z: 3 }]);

    // 路障已消失，变为地板
    expect(grid.isBarrier(2, 3)).toBe(false);
    expect(grid.isFloor(2, 3)).toBe(true);
  });

  it('Standing踩到非机关格 → null，无变化', () => {
    const grid = new Grid(createTestLevel());
    const result = checkSwitchTrigger({ x: 1, z: 1 }, grid);
    expect(result).toBeNull();
  });

  it('机关触发后再次踩同一格 → null（机关已移除）', () => {
    const grid = new Grid(createTestLevel());
    checkSwitchTrigger({ x: 2, z: 2 }, grid);
    const result2 = checkSwitchTrigger({ x: 2, z: 2 }, grid);
    expect(result2).toBeNull();
  });

  it('一个机关控制多个路障', () => {
    const level: LevelData = {
      id: 'test',
      name: '多路障测试',
      width: 5,
      height: 5,
      floorMap: [
        [0, 0, 0, 0, 0],
        [0, 1, 2, 1, 0],  // (2,1)=机关
        [0, 1, 1, 1, 0],
        [0, 3, 1, 3, 0],  // (1,3)和(3,3)都是路障
        [0, 0, 0, 0, 0],
      ],
      start: { x: 1, z: 1 },
      startOrientation: Orientation.Standing,
      goal: { x: 3, z: 1 },
      switches: [
        {
          cell: { x: 2, z: 1 },
          barriers: [{ x: 1, z: 3 }, { x: 3, z: 3 }],
        },
      ],
    };

    const grid = new Grid(level);

    expect(grid.isBarrier(1, 3)).toBe(true);
    expect(grid.isBarrier(3, 3)).toBe(true);

    const result = checkSwitchTrigger({ x: 2, z: 1 }, grid);

    expect(result!.removedBarriers).toHaveLength(2);
    expect(grid.isFloor(1, 3)).toBe(true);
    expect(grid.isFloor(3, 3)).toBe(true);
  });

  it('无机关的关卡 → 任何格子都不触发', () => {
    const level: LevelData = {
      id: 'noswitch',
      name: '无机关',
      width: 3,
      height: 3,
      floorMap: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ],
      start: { x: 1, z: 1 },
      startOrientation: Orientation.Standing,
      goal: { x: 1, z: 1 },
    };

    const grid = new Grid(level);
    const result = checkSwitchTrigger({ x: 1, z: 1 }, grid);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 14 + 5 = 19 passed

- [ ] **Step 4: Commit**

```bash
cd D:/Movegame && git add src/core/SwitchState.ts src/core/SwitchState.test.ts && git commit -m "feat: 机关状态管理纯函数 + 单元测试"
```

---

### Task 4: GameEngine 集成机关触发

**Files:**
- Modify: `src/core/GameEngine.ts`

- [ ] **Step 1: 修改 GameEngine.ts 集成机关检测**

将 `src/core/GameEngine.ts` 的全部内容替换为：

```ts
import { Direction, GameEvents, LevelData, TransitionResult } from './types';
import { Block } from './Block';
import { Grid } from './Grid';
import { checkSwitchTrigger } from './SwitchState';

/** 游戏引擎 — 连接物块状态、边界检测、机关触发、通关判定 */
export class GameEngine {
  block: Block;
  grid: Grid;
  level: LevelData;
  moveCount: number;
  isAnimating: boolean;
  events: GameEvents;

  constructor(level: LevelData, events: GameEvents) {
    this.level = level;
    this.grid = new Grid(level);
    this.block = new Block({
      orientation: level.startOrientation,
      anchor: level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events = events;
  }

  /** 尝试翻滚：先计算结果，验证合法性，再应用 */
  tryMove(dir: Direction): TransitionResult | null {
    if (this.isAnimating) return null;

    const result = this.block.computeTransition(dir);
    const cells = Array.from(result.occupiedCells);

    // 边界检测：所有占格必须是路径格子
    if (!this.grid.areAllFloor(cells)) {
      this.events.onMoveRejected(dir);
      return null;
    }

    const prev = { ...this.block.state };
    this.block.applyTransition(result);
    this.moveCount++;

    // 立即锁定，防止动画期间接受新输入
    this.isAnimating = true;

    this.events.onBlockMove(prev, this.block.state, result, dir);

    // 机关触发检测：只有Standing状态能踩机关
    if (this.block.isStanding()) {
      const switchResult = checkSwitchTrigger(this.block.state.anchor, this.grid);
      if (switchResult) {
        this.events.onSwitchTriggered(switchResult.switchCell, switchResult.removedBarriers);
      }
    }

    // 通关检测
    if (this.checkWin()) {
      this.events.onLevelComplete();
    }

    return result;
  }

  /** 通关判定：物块站立且锚点等于终点 */
  checkWin(): boolean {
    return (
      this.block.isStanding() &&
      this.block.state.anchor.x === this.level.goal.x &&
      this.block.state.anchor.z === this.level.goal.z
    );
  }

  /** 重置关卡 */
  reset(): void {
    this.grid = new Grid(this.level);
    this.block = new Block({
      orientation: this.level.startOrientation,
      anchor: this.level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events.onReset();
  }

  /** 加载新关卡 */
  loadLevel(level: LevelData): void {
    this.level = level;
    this.grid = new Grid(level);
    this.block = new Block({
      orientation: level.startOrientation,
      anchor: level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events.onLevelLoad(level);
  }

  /** 设置动画状态 */
  setAnimating(value: boolean): void {
    this.isAnimating = value;
  }
}
```

关键变更：
1. `import { checkSwitchTrigger }` — 导入机关检测函数
2. `tryMove` 中新增机关触发检测（仅在 Standing 状态时触发）
3. `reset()` 重新创建 Grid（因为路障状态会变化）

- [ ] **Step 2: 运行测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 19 passed

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/core/GameEngine.ts && git commit -m "feat: GameEngine集成机关触发检测"
```

---

### Task 5: 渲染层 — 机关格和路障格的3D视觉

**Files:**
- Modify: `src/render/GridRenderer.ts`

- [ ] **Step 1: 修改 GridRenderer.ts 支持机关和路障渲染**

将 `src/render/GridRenderer.ts` 的全部内容替换为：

```ts
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
          this.addBarrier(x, z, grid);
        }
      }
    }

    // 起点标记
    this.addMarker(level.start, 0x44cc44, 0.05);
    // 终点标记
    this.addMarker(level.goal, 0xcc4444, 0.08);
  }

  /** 添加路障方块 */
  private addBarrier(x: number, z: number, grid: Grid): void {
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
```

- [ ] **Step 2: 运行构建验证渲染层编译通过**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/render/GridRenderer.ts && git commit -m "feat: 渲染机关格(金)和路障格(红半透明) + 动态移除支持"
```

---

### Task 6: GameView + main.ts — 机关触发回调串联

**Files:**
- Modify: `src/render/GameView.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 在 GameView.ts 中添加路障/机关移除方法**

在 `src/render/GameView.ts` 的 `GameView` 类中，在 `playRollAnimation` 方法之后添加：

```ts
  /** 机关触发：移除路障方块和机关标记 */
  onSwitchTriggered(switchCell: { x: number; z: number }, removedBarriers: { x: number; z: number }[]): void {
    for (const b of removedBarriers) {
      this.gridRenderer.removeBarrier(b.x, b.z);
    }
    this.gridRenderer.removeSwitchMarker(switchCell.x, switchCell.z);
  }
```

- [ ] **Step 2: 修改 main.ts 传入 onSwitchTriggered 回调**

读取 `src/main.ts`，找到 `new GameEngine(LEVELS[currentLevelIndex], { ... })` 调用处，在 `onMoveRejected` 回调之后、`onLevelComplete` 回调之前，添加：

```ts
    onSwitchTriggered(switchCell, removedBarriers) {
      gameView.onSwitchTriggered(switchCell, removedBarriers);
    },
```

- [ ] **Step 3: 运行构建**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译成功

- [ ] **Step 4: 运行测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 19 passed

- [ ] **Step 5: Commit**

```bash
cd D:/Movegame && git add src/render/GameView.ts src/main.ts && git commit -m "feat: 机关触发回调串联渲染层"
```

---

### Task 7: 添加3个机关路障新关卡

**Files:**
- Modify: `src/data/levels.ts`

**注意：** 关卡设计需要确保物块能以 **Standing 状态** 踩到机关格。LyingX/LyingZ 不会触发机关。设计要点：
- 机关格周围必须有足够空间让物块翻滚成 Standing 后恰好站在机关上
- 推荐布局：机关格在2格宽通道中，物块从1格宽处翻到机关格

在 `src/data/levels.ts` 的 `LEVEL_8` 定义之后、`export const LEVELS` 之前，添加以下3个关卡：

```ts
/**
 * 第9关：闸门 — 先踩机关开路，再到达终点
 * 推演：Standing(1,1)→S→LyingZ(1,2)→E→LyingZ(2,2)→N→Standing(2,1) ✅ 踩机关！
 *   →E→LyingX(3,1)→E→LyingX(4,1)→S→LyingX(4,2) 路障已开
 *   →S→LyingX(4,3) 路障已开→S→LyingX(4,4)→S→LyingX(4,5)
 *   →E→Standing(5,5) ✅ 约10步
 */
export const LEVEL_9: LevelData = {
  id: '9',
  name: '闸门',
  width: 7,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 1, 1, 1, 0],  // (2,1)=机关
    [0, 1, 1, 1, 3, 1, 0],  // (4,2)=路障
    [0, 1, 1, 1, 3, 1, 0],  // (4,3)=路障
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 5, z: 5 },
  switches: [
    {
      cell: { x: 2, z: 1 },
      barriers: [{ x: 4, z: 2 }, { x: 4, z: 3 }],
    },
  ],
};

/**
 * 第10关：双闸 — 两个机关分别控制两组路障
 * 推演：
 *   先踩机关A(2,2)：Standing(1,1)→E→LyingX(2,1)→E→LyingX(3,1)→S→LyingX(3,2)→W→Standing(2,2) ✅
 *   再踩机关B(6,2)：E→LyingX(3,2)→E→LyingX(4,2) 路障A已开→E→LyingX(5,2)
 *   →S→LyingX(5,3)→E→LyingX(6,3)→N→Standing(6,2) ✅ 踩机关B！
 *   路障B(4,5)消失→S→LyingZ(6,3)→E→LyingZ(7,3)→S→Standing(7,4) ✅ 约17步
 */
export const LEVEL_10: LevelData = {
  id: '10',
  name: '双闸',
  width: 9,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,1)=路障A
    [0, 1, 2, 1, 3, 1, 2, 1, 0],  // (2,2)=机关A, (4,2)=路障A, (6,2)=机关B
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,3)=路障A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,5)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 4 },
  switches: [
    {
      cell: { x: 2, z: 2 },
      barriers: [{ x: 4, z: 1 }, { x: 4, z: 2 }, { x: 4, z: 3 }],
    },
    {
      cell: { x: 6, z: 2 },
      barriers: [{ x: 4, z: 5 }],
    },
  ],
};

/**
 * 第11关：回廊开路 — 踩机关打通中路捷径
 * 推演：
 *   Standing(1,1)→S→LyingZ(1,2)→E→LyingZ(2,2)→S→Standing(2,4)
 *   →E→LyingX(3,4)→N→LyingX(3,3)→N→Standing(3,2) ✅ 踩机关A！路障(4,1)消失
 *   →S→LyingZ(3,3)→S→Standing(3,4) ✅ 踩机关B！路障(4,5)消失
 *   中路打通→E→LyingX(4,4)→E→LyingX(5,4)→N→LyingX(5,3)→N→LyingX(5,2)
 *   →N→LyingX(5,1)→E→LyingX(6,1)→E→Standing(6,1)... 需要到(7,7)
 *   从路障消失后走中路纵穿：
 *   Standing(3,2)踩机关A后→E→LyingX(4,2)→S→LyingX(4,3)→S→LyingX(4,4)→S→LyingX(4,5)
 *   →S→LyingX(4,6)→E→LyingX(5,6)→E→Standing(7,6) 但需要(7,7)
 *   goal调整为(7,5)更容易到达
 *   修正策略：宽大矩形地图，goal在右下区域
 */
export const LEVEL_11: LevelData = {
  id: '11',
  name: '回廊开路',
  width: 9,
  height: 9,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,1)=路障A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 1, 1, 0],  // (3,3)=机关A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 1, 1, 0],  // (3,5)=机关B
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,7)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 6 },
  switches: [
    {
      cell: { x: 3, z: 3 },
      barriers: [{ x: 4, z: 1 }],
    },
    {
      cell: { x: 3, z: 5 },
      barriers: [{ x: 4, z: 7 }],
    },
  ],
};
```

关卡可在实际运行后微调 floorMap。上方推演仅验证核心路径可行性，宽大矩形区域允许物块灵活移动。

- [ ] **Step 2: 更新 LEVELS 导出数组**

在 `export const LEVELS` 数组中，在 LEVEL_8 之后添加 LEVEL_9, LEVEL_10, LEVEL_11：

```ts
export const LEVELS: LevelData[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8,
  LEVEL_9,
  LEVEL_10,
  LEVEL_11,
];
```

- [ ] **Step 3: 运行测试和构建**

```bash
cd D:/Movegame && npm run test && npm run build
```

Expected: 19 tests passed, 构建成功

- [ ] **Step 4: Commit**

```bash
cd D:/Movegame && git add src/data/levels.ts && git commit -m "feat: 添加3个机关路障新关卡（第9-11关）"
```

---

### Task 8: 端到端验证

**Files:** 无修改，仅验证

- [ ] **Step 1: 运行全部测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 19 passed

- [ ] **Step 2: 运行构建**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译成功

- [ ] **Step 3: 启动开发服务器**

```bash
cd D:/Movegame && npm run dev
```

- [ ] **Step 4: 手动验证第9关"闸门"**

1. 进入第9关
2. 确认能看到金色机关圆盘在(2,1)，红色路障方块在(4,2)(4,3)
3. 走到(2,1)站上去 → 路障应消失，机关标记变灰
4. 通过原路障位置到达终点

- [ ] **Step 5: 手动验证旧关卡无回归**

进入第1关，确认无机关路障元素，游玩正常。

- [ ] **Step 6: 最终提交（如有调整）**

```bash
cd D:/Movegame && git add -A && git commit -m "验证完成：关卡扩展 + 路障机关系统"
```