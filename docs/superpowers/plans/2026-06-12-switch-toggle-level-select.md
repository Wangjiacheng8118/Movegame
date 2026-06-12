# 机关切换 + 关卡选择 + 重置修复 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复重置时机关/路障未复原的Bug，将机关从一次性触发改为切换模式（踩→开，再踩→关，循环），添加首页关卡选择界面。

**Architecture:** 重置Bug通过在 `onReset` 回调中重建3D场景修复。切换机制在逻辑层用 `switchToggleState` Map追踪每个机关的开/关状态，`checkSwitchToggle` 纯函数翻转状态并对应移除/恢复路障，渲染层用 `addBarrier` 恢复路障方块、`setSwitchState` 切换机关标记视觉。关卡选择界面用独立 `LevelSelect` UI组件覆盖游戏画面，点选后隐藏并加载对应关卡。

**Tech Stack:** TypeScript, vitest, Three.js, DOM UI

---

## 核心问题分析

### Bug 1：重置时机关/路障不复原

当前 `main.ts:33-36` 的 `onReset` 回调只做了：
```ts
onReset() {
  hud.updateMoveCount(0);
  hud.hideWin();
  gameView.snapToState(engine.block.state);  // ← 只重置物块位置，不重建3D场景
}
```

逻辑层 `engine.reset()` 重建了 `Grid`（路障和机关都恢复），但渲染层没有重建 `GridRenderer`，导致视觉上路障仍消失、机关仍变灰。

**修复：** 在 `onReset` 中添加 `gameView.loadLevel(engine.grid, engine.level)` 重建3D场景。

### Feature 2：机关切换（Toggle）

当前机关是一次性触发：踩→路障消失→机关标记变灰→不可再触发。

新需求：踩→路障消失（开），再踩→路障恢复（关），循环往复。

**核心改动：**
- `Grid.ts`：添加 `switchToggleState: Map<string, boolean>`（false=关/路障关闭，true=开/路障打开），添加 `addBarrier()` 恢复路障，添加 `toggleSwitch()` 翻转状态，移除 `removeSwitch()`（机关不再消失）
- `SwitchState.ts`：`checkSwitchTrigger` → `checkSwitchToggle`，返回 `newState: 'open'|'closed'`
- `GridRenderer.ts`：添加 `addBarrier()` 恢复路障方块，`removeSwitchMarker` → `setSwitchState()` 切换视觉
- `GameEvents`：`onSwitchTriggered` → `onSwitchToggled`

### Feature 3：关卡选择界面

当前游戏直接从第1关开始。测试模式需要首页选择指定关卡。

**设计：**
- `LevelSelect` 组件：全屏覆盖层，3列网格显示11个关卡
- 游戏启动时先显示关卡选择
- 选中后隐藏选关界面，加载对应关卡
- HUD 添加"选关"按钮可随时返回

---

## 文件结构

| 文件 | 负责 | 操作 |
|------|------|------|
| `src/core/types.ts` | SwitchToggleResult 类型 + GameEvents 更新 | 修改 |
| `src/core/Grid.ts` | 切换状态追踪 + addBarrier + toggleSwitch | 修改 |
| `src/core/SwitchState.ts` | checkSwitchToggle 纯函数 | 修改 |
| `src/core/SwitchState.test.ts` | 切换行为测试 | 修改 |
| `src/core/GameEngine.ts` | 使用 checkSwitchToggle | 修改 |
| `src/render/GridRenderer.ts` | addBarrier + setSwitchState | 修改 |
| `src/render/GameView.ts` | addBarrier + setSwitchState | 修改 |
| `src/ui/LevelSelect.ts` | 关卡选择界面组件 | 创建 |
| `src/ui/HUD.ts` | 添加"选关"按钮 | 修改 |
| `src/main.ts` | 修复重置 + 切换回调 + 关卡选择 | 修改 |
| `src/style.css` | 关卡选择样式 | 修改 |

---

### Task 1: 修复重置 Bug — rebuild 3D scene on reset

**Files:**
- Modify: `src/main.ts:33-36`

- [ ] **Step 1: 修改 onReset 回调**

将 `src/main.ts` 中 `onReset` 回调从：

```ts
onReset() {
  hud.updateMoveCount(0);
  hud.hideWin();
  gameView.snapToState(engine.block.state);
},
```

改为：

```ts
onReset() {
  hud.updateMoveCount(0);
  hud.hideWin();
  gameView.loadLevel(engine.grid, engine.level);
  gameView.snapToState(engine.block.state);
},
```

`gameView.loadLevel` 会重建整个 GridRenderer（路障方块复原、机关标记复原），并重置摄像机。

- [ ] **Step 2: 运行测试验证**

```bash
cd D:/Movegame && npm run test
```

Expected: 19 passed

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/main.ts && git commit -m "fix: 重置时重建3D场景修复机关路障不复原的Bug"
```

---

### Task 2: 机关切换 — 类型定义 + Grid 逻辑

**Files:**
- Modify: `src/core/types.ts:72-88`
- Modify: `src/core/Grid.ts`

- [ ] **Step 1: 更新 types.ts — 添加 SwitchToggleResult + 更新 GameEvents**

在 `src/core/types.ts` 中，在 `SwitchDef` 接口之后（第78行后）添加：

```ts
/** 机关切换结果 */
export interface SwitchToggleResult {
  /** 触发的机关位置 */
  switchCell: Cell;
  /** 受影响的路障格子列表 */
  barriersAffected: Cell[];
  /** 切换后的新状态：'open'=路障消失, 'closed'=路障恢复 */
  newState: 'open' | 'closed';
}
```

将 `GameEvents` 接口中的 `onSwitchTriggered` 替换为 `onSwitchToggled`：

```ts
/** 游戏引擎事件 */
export interface GameEvents {
  onBlockMove: (prev: BlockState, next: BlockState, result: TransitionResult, dir: Direction) => void;
  onMoveRejected: (dir: Direction) => void;
  onLevelComplete: () => void;
  onReset: () => void;
  onLevelLoad: (level: LevelData) => void;
  onSwitchToggled: (switchCell: Cell, barriersAffected: Cell[], newState: 'open' | 'closed') => void;
}
```

- [ ] **Step 2: 更新 Grid.ts — 添加切换状态追踪 + addBarrier + toggleSwitch**

将 `src/core/Grid.ts` 全部内容替换为：

```ts
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
          // 1=地板, 2=机关格（也是地板）
          this.floorSet.add(key);
        } else if (val === 3) {
          // 3=路障格（初始不可通行）
          this.barrierSet.add(key);
        }
        // val === 0: 空，不加入任何集合
      }
    }

    // 建立机关映射 + 初始化切换状态
    if (level.switches) {
      for (const sw of level.switches) {
        const key = `${sw.cell.x},${sw.cell.z}`;
        this.switchMap.set(key, sw);
        this.switchToggleState.set(key, false); // 初始状态：关闭（路障存在）
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

  /** 判断机关是否已激活（路障消失） */
  isSwitchActivated(x: number, z: number): boolean {
    return this.switchToggleState.get(`${x},${z}`) === true;
  }

  /** 移除路障（机关切换为open时调用） */
  removeBarrier(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.barrierSet.has(key)) {
      this.barrierSet.delete(key);
      this.floorSet.add(key); // 路障消失，变为可通行地板
      return true;
    }
    return false;
  }

  /** 恢复路障（机关切换为closed时调用） */
  addBarrier(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.floorSet.has(key) && !this.barrierSet.has(key)) {
      this.floorSet.delete(key);
      this.barrierSet.add(key); // 路障恢复，变为不可通行
      return true;
    }
    return false;
  }

  /** 翻转机关状态，返回新状态（true=激活/open, false=关闭/closed） */
  toggleSwitch(x: number, z: number): boolean | undefined {
    const key = `${x},${z}`;
    const current = this.switchToggleState.get(key);
    if (current === undefined) return undefined; // 不是机关
    const newState = !current;
    this.switchToggleState.set(key, newState);
    return newState;
  }
}
```

关键变更：
1. 添加 `switchToggleState: Map<string, boolean>`，构造时初始化为 `false`
2. 添加 `isSwitchActivated()` 查询切换状态
3. 添加 `addBarrier()` 恢复路障（从 floorSet 移到 barrierSet）
4. 添加 `toggleSwitch()` 翻转状态，返回新状态
5. 移除 `removeSwitch()` — 机关永久存在于 switchMap 中

- [ ] **Step 3: 运行构建验证类型一致性**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译可能失败（因为 SwitchState.ts 和 main.ts 还引用旧类型），但 types.ts 和 Grid.ts 本身不应有内部错误

- [ ] **Step 4: Commit**

```bash
cd D:/Movegame && git add src/core/types.ts src/core/Grid.ts && git commit -m "feat: 机关切换类型 + Grid切换状态追踪 + 路障恢复"
```

---

### Task 3: 机关切换 — SwitchState 纯函数 + 测试

**Files:**
- Modify: `src/core/SwitchState.ts`
- Modify: `src/core/SwitchState.test.ts`

- [ ] **Step 1: 重写 SwitchState.ts — checkSwitchToggle 纯函数**

将 `src/core/SwitchState.ts` 全部内容替换为：

```ts
import { Cell, SwitchToggleResult } from './types';
import { Grid } from './Grid';

/**
 * 检测物块是否踩到机关并切换路障状态。
 * 仅当物块为 Standing 状态时触发机关。
 * 切换模式：踩一次→打开路障，再踩→关闭路障，循环往复。
 *
 * @param anchor 物块锚点位置（Standing时为唯一占格）
 * @param grid 当前网格
 * @returns 切换结果，或 null 表示无触发
 */
export function checkSwitchToggle(
  anchor: Cell,
  grid: Grid
): SwitchToggleResult | null {
  // 只有Standing状态才触发，anchor就是唯一占格
  if (!grid.isSwitch(anchor.x, anchor.z)) {
    return null;
  }

  const sw = grid.getSwitch(anchor.x, anchor.z);
  if (!sw) return null;

  // 翻转机关状态
  const activated = grid.toggleSwitch(anchor.x, anchor.z);
  if (activated === undefined) return null;

  const newState = activated ? 'open' : 'closed';
  const barriersAffected: Cell[] = [];

  for (const barrier of sw.barriers) {
    if (newState === 'open') {
      // 打开：移除路障
      if (grid.removeBarrier(barrier.x, barrier.z)) {
        barriersAffected.push(barrier);
      }
    } else {
      // 关闭：恢复路障
      if (grid.addBarrier(barrier.x, barrier.z)) {
        barriersAffected.push(barrier);
      }
    }
  }

  if (barriersAffected.length === 0) return null;

  return {
    switchCell: anchor,
    barriersAffected,
    newState,
  };
}
```

- [ ] **Step 2: 重写 SwitchState.test.ts — 切换行为测试**

将 `src/core/SwitchState.test.ts` 全部内容替换为：

```ts
import { describe, it, expect } from 'vitest';
import { Cell, LevelData, Orientation } from './types';
import { Grid } from './Grid';
import { checkSwitchToggle } from './SwitchState';

/** 创建测试用关卡，含一个机关和一个路障 */
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

describe('checkSwitchToggle', () => {
  it('首次踩机关 → 打开路障（open）', () => {
    const grid = new Grid(createTestLevel());

    // 初始：路障存在，机关未激活
    expect(grid.isBarrier(2, 3)).toBe(true);
    expect(grid.isFloor(2, 3)).toBe(false);
    expect(grid.isSwitchActivated(2, 2)).toBe(false);

    // 踩机关 → 打开
    const result = checkSwitchToggle({ x: 2, z: 2 }, grid);

    expect(result).not.toBeNull();
    expect(result!.switchCell).toEqual({ x: 2, z: 2 });
    expect(result!.barriersAffected).toEqual([{ x: 2, z: 3 }]);
    expect(result!.newState).toBe('open');

    // 路障消失，变为地板
    expect(grid.isBarrier(2, 3)).toBe(false);
    expect(grid.isFloor(2, 3)).toBe(true);
    // 机关标记为激活
    expect(grid.isSwitchActivated(2, 2)).toBe(true);
  });

  it('再次踩同一机关 → 关闭路障（closed）', () => {
    const grid = new Grid(createTestLevel());

    // 第一次：打开
    checkSwitchToggle({ x: 2, z: 2 }, grid);
    expect(grid.isSwitchActivated(2, 2)).toBe(true);
    expect(grid.isBarrier(2, 3)).toBe(false);

    // 第二次：关闭
    const result = checkSwitchToggle({ x: 2, z: 2 }, grid);

    expect(result).not.toBeNull();
    expect(result!.newState).toBe('closed');
    expect(result!.barriersAffected).toEqual([{ x: 2, z: 3 }]);

    // 路障恢复，变为不可通行
    expect(grid.isBarrier(2, 3)).toBe(true);
    expect(grid.isFloor(2, 3)).toBe(false);
    // 机关标记为未激活
    expect(grid.isSwitchActivated(2, 2)).toBe(false);
  });

  it('第三次踩 → 再次打开（切换循环）', () => {
    const grid = new Grid(createTestLevel());
    checkSwitchToggle({ x: 2, z: 2 }, grid); // open
    checkSwitchToggle({ x: 2, z: 2 }, grid); // closed
    const result = checkSwitchToggle({ x: 2, z: 2 }, grid); // open again

    expect(result!.newState).toBe('open');
    expect(grid.isBarrier(2, 3)).toBe(false);
    expect(grid.isSwitchActivated(2, 2)).toBe(true);
  });

  it('踩非机关格 → null，无变化', () => {
    const grid = new Grid(createTestLevel());
    const result = checkSwitchToggle({ x: 1, z: 1 }, grid);
    expect(result).toBeNull();
  });

  it('一个机关控制多个路障 — 切换同步', () => {
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

    // 打开：两个路障同时消失
    const openResult = checkSwitchToggle({ x: 2, z: 1 }, grid);
    expect(openResult!.newState).toBe('open');
    expect(openResult!.barriersAffected).toHaveLength(2);
    expect(grid.isFloor(1, 3)).toBe(true);
    expect(grid.isFloor(3, 3)).toBe(true);

    // 关闭：两个路障同时恢复
    const closeResult = checkSwitchToggle({ x: 2, z: 1 }, grid);
    expect(closeResult!.newState).toBe('closed');
    expect(closeResult!.barriersAffected).toHaveLength(2);
    expect(grid.isBarrier(1, 3)).toBe(true);
    expect(grid.isBarrier(3, 3)).toBe(true);
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
    const result = checkSwitchToggle({ x: 1, z: 1 }, grid);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 6个 SwitchState 测试全部 PASS，加上14个 SwipeMapping 测试，共20 passed

- [ ] **Step 4: Commit**

```bash
cd D:/Movegame && git add src/core/SwitchState.ts src/core/SwitchState.test.ts && git commit -m "feat: 机关切换纯函数 + 切换行为测试"
```

---

### Task 4: 机关切换 — GameEngine + 渲染层 + main.ts

**Files:**
- Modify: `src/core/GameEngine.ts`
- Modify: `src/render/GridRenderer.ts`
- Modify: `src/render/GameView.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 更新 GameEngine.ts — 使用 checkSwitchToggle**

将 `src/core/GameEngine.ts` 中第4行的 import 和 tryMove 中的机关检测部分修改。

修改 import（第4行）：
```ts
import { checkSwitchToggle } from './SwitchState';
```

修改 tryMove 中的机关检测（第50-55行）：
```ts
    // 机关触发检测：只有Standing状态能踩机关（切换模式）
    if (this.block.isStanding()) {
      const switchResult = checkSwitchToggle(this.block.state.anchor, this.grid);
      if (switchResult) {
        this.events.onSwitchToggled(
          switchResult.switchCell,
          switchResult.barriersAffected,
          switchResult.newState
        );
      }
    }
```

- [ ] **Step 2: 更新 GridRenderer.ts — addBarrier + setSwitchState**

在 `src/render/GridRenderer.ts` 中：

1. 添加 `addBarrier` 公开方法（在第89行 `removeBarrier` 方法之后）：

```ts
  /** 恢复路障方块（机关切换为closed时调用） */
  addBarrier(x: number, z: number): void {
    const key = `${x},${z}`;
    // 已存在路障则跳过
    if (this.barrierMeshes.has(key)) return;

    const barrierGeo = new THREE.BoxGeometry(0.85, 0.6, 0.85);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: COLOR_BARRIER,
      transparent: true,
      opacity: 0.85,
    });
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.position.set(x + 0.5, 0.3, z + 0.5);
    this.group.add(barrierMesh);
    this.barrierMeshes.set(key, barrierMesh);
  }
```

2. 将 `removeSwitchMarker` 方法（第101-111行）替换为 `setSwitchState`：

```ts
  /** 切换机关标记视觉状态 */
  setSwitchState(x: number, z: number, state: 'activated' | 'deactivated'): void {
    const key = `${x},${z}`;
    const mesh = this.switchMeshes.get(key);
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (state === 'activated') {
      // 激活：绿色 — 路径已打通
      mat.color.setHex(0x44cc44);
      mat.opacity = 1.0;
      mat.transparent = false;
    } else {
      // 未激活：金色 — 按下可开路
      mat.color.setHex(COLOR_SWITCH);
      mat.opacity = 1.0;
      mat.transparent = false;
    }
  }
```

关键变更：`setSwitchState` 不从 `switchMeshes` 中删除 mesh（机关标记永久保留），通过颜色切换表示状态。

- [ ] **Step 3: 更新 GameView.ts — addBarrier + setSwitchState**

在 `src/render/GameView.ts` 中：

1. 在 `removeBarrier` 方法之后添加 `addBarrier` 方法：

```ts
  /** 恢复路障方块 */
  addBarrier(x: number, z: number): void {
    this.gridRenderer.addBarrier(x, z);
  }
```

2. 将 `removeSwitchMarker` 方法替换为 `setSwitchState`：

```ts
  /** 切换机关标记视觉状态 */
  setSwitchState(x: number, z: number, state: 'activated' | 'deactivated'): void {
    this.gridRenderer.setSwitchState(x, z, state);
  }
```

- [ ] **Step 4: 更新 main.ts — 修复重置 + 切换回调**

将 `src/main.ts` 中的 `onReset` 和 `onSwitchTriggered` 回调修改。

修改 `onReset`（确保已在 Task 1 中修复）：
```ts
  onReset() {
    hud.updateMoveCount(0);
    hud.hideWin();
    gameView.loadLevel(engine.grid, engine.level);
    gameView.snapToState(engine.block.state);
  },
```

将 `onSwitchTriggered` 替换为 `onSwitchToggled`：
```ts
  onSwitchToggled(switchCell, barriersAffected, newState) {
    if (newState === 'open') {
      // 路障消失，机关标记变绿
      gameView.setSwitchState(switchCell.x, switchCell.z, 'activated');
      for (const b of barriersAffected) {
        gameView.removeBarrier(b.x, b.z);
      }
    } else {
      // 路障恢复，机关标记变金
      gameView.setSwitchState(switchCell.x, switchCell.z, 'deactivated');
      for (const b of barriersAffected) {
        gameView.addBarrier(b.x, b.z);
      }
    }
  },
```

- [ ] **Step 5: 运行测试 + 构建**

```bash
cd D:/Movegame && npm run test && npm run build
```

Expected: 20 tests passed, 构建成功

- [ ] **Step 6: Commit**

```bash
cd D:/Movegame && git add src/core/GameEngine.ts src/render/GridRenderer.ts src/render/GameView.ts src/main.ts && git commit -m "feat: 机关切换引擎+渲染层+回调串联"
```

---

### Task 5: 关卡选择界面

**Files:**
- Create: `src/ui/LevelSelect.ts`
- Modify: `src/ui/HUD.ts`
- Modify: `src/style.css`
- Modify: `src/main.ts`

- [ ] **Step 1: 创建 LevelSelect.ts**

创建 `src/ui/LevelSelect.ts`：

```ts
import { LevelData } from '../core/types';

/** 关卡选择界面 — 全屏覆盖层，网格显示所有关卡 */
export class LevelSelect {
  private container: HTMLElement;
  private onSelect: (levelIndex: number) => void;

  constructor(levels: LevelData[], onSelect: (levelIndex: number) => void) {
    this.onSelect = onSelect;

    this.container = document.createElement('div');
    this.container.className = 'level-select';

    const title = document.createElement('h2');
    title.className = 'level-select-title';
    title.textContent = '选择关卡';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'level-grid';

    for (let i = 0; i < levels.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-card';
      btn.dataset.index = String(i);

      const num = document.createElement('span');
      num.className = 'level-num';
      num.textContent = `${i + 1}`;

      const name = document.createElement('span');
      name.className = 'level-name';
      name.textContent = levels[i].name;

      btn.appendChild(num);
      btn.appendChild(name);

      btn.addEventListener('click', () => {
        this.hide();
        this.onSelect(i);
      });

      grid.appendChild(btn);
    }

    this.container.appendChild(grid);
    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
```

- [ ] **Step 2: 在 style.css 中添加关卡选择样式**

在 `src/style.css` 末尾（`@keyframes swipe-fade` 之后）添加：

```css
/* === 关卡选择界面 === */
.level-select {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 46, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.level-select-title {
  color: #eee;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 360px;
  width: 100%;
  padding: 0 16px;
}

.level-card {
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #eee;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  transition: background 0.2s, border-color 0.2s;
}

.level-card:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(136, 187, 255, 0.5);
}

.level-card:active {
  background: rgba(255, 255, 255, 0.35);
}

.level-num {
  font-size: 22px;
  font-weight: bold;
  color: #88bbff;
}

.level-name {
  font-size: 13px;
  color: #aaa;
}
```

- [ ] **Step 3: 在 HUD.ts 中添加"选关"按钮**

在 `src/ui/HUD.ts` 中：

1. 添加私有属性（在第8行 `private onNextLevel` 之后）：

```ts
  private onSelectLevel: (() => void) | null = null;
```

2. 在构造函数中创建选关按钮，在 `resetBtn` 之后、`nextBtn` 之前添加（约第26-33行区域）：

```ts
    const selectBtn = document.createElement('button');
    selectBtn.className = 'hud-btn hud-btn-select';
    selectBtn.textContent = '☰ 选关';
    selectBtn.addEventListener('click', () => {
      if (this.onSelectLevel) this.onSelectLevel();
    });
```

3. 将 `selectBtn` 加入 btnRow（在 `resetBtn` 和 `nextBtn` 之间）：

修改 `btnRow.appendChild(this.resetBtn);` 和 `btnRow.appendChild(this.nextBtn);` 之间的代码为：
```ts
    btnRow.appendChild(this.resetBtn);
    btnRow.appendChild(selectBtn);
    btnRow.appendChild(this.nextBtn);
```

4. 在 `setNextLevelCallback` 方法之后添加新方法：

```ts
  /** 设置选关回调 */
  setSelectLevelCallback(cb: () => void): void {
    this.onSelectLevel = cb;
  }
```

- [ ] **Step 4: 更新 style.css 添加选关按钮样式**

在 `src/style.css` 的 `.hud-btn-next:active` 规则之后添加：

```css
.hud-btn-select {
  background: rgba(136, 187, 255, 0.25);
}

.hud-btn-select:active {
  background: rgba(136, 187, 255, 0.45);
}
```

- [ ] **Step 5: 更新 main.ts — 关卡选择集成**

将 `src/main.ts` 全部内容替换为：

```ts
import './style.css';
import { GameEngine } from './core/GameEngine';
import { GameView } from './render/GameView';
import { InputManager } from './input/InputManager';
import { HUD } from './ui/HUD';
import { LevelSelect } from './ui/LevelSelect';
import { LEVELS } from './data/levels';
import { Direction, BlockState, TransitionResult, LevelData } from './core/types';

const appEl = document.getElementById('app')!;
const hudEl = document.getElementById('hud')!;

// 当前关卡索引
let currentLevelIndex = 0;

// HUD
const hud = new HUD(hudEl);

// 游戏引擎（初始加载第1关，但被选关界面覆盖）
const engine = new GameEngine(LEVELS[currentLevelIndex], {
  onBlockMove(prev: BlockState, next: BlockState, result: TransitionResult, dir: Direction) {
    hud.updateMoveCount(engine.moveCount);
    gameView.playRollAnimation(dir, result.animation.duration, prev, next, () => {
      engine.setAnimating(false);
    });
  },
  onMoveRejected(_dir: Direction) {
    // 碰撞反馈
  },
  onLevelComplete() {
    hud.showWin(currentLevelIndex < LEVELS.length - 1);
  },
  onReset() {
    hud.updateMoveCount(0);
    hud.hideWin();
    gameView.loadLevel(engine.grid, engine.level);
    gameView.snapToState(engine.block.state);
  },
  onLevelLoad(level: LevelData) {
    currentLevelIndex = LEVELS.findIndex((l) => l.id === level.id);
    hud.setLevelName(`第${currentLevelIndex + 1}关 — ${level.name}`);
    hud.updateMoveCount(0);
    hud.hideWin();
    gameView.loadLevel(engine.grid, level);
    gameView.snapToState(engine.block.state);
  },
  onSwitchToggled(switchCell, barriersAffected, newState) {
    if (newState === 'open') {
      gameView.setSwitchState(switchCell.x, switchCell.z, 'activated');
      for (const b of barriersAffected) {
        gameView.removeBarrier(b.x, b.z);
      }
    } else {
      gameView.setSwitchState(switchCell.x, switchCell.z, 'deactivated');
      for (const b of barriersAffected) {
        gameView.addBarrier(b.x, b.z);
      }
    }
  },
});

// 渲染
const gameView = new GameView(appEl, engine.grid, engine.level);
gameView.snapToState(engine.block.state);
gameView.startLoop();

// 输入
new InputManager(appEl, (dir: Direction) => {
  engine.tryMove(dir);
});

// 关卡选择界面
const levelSelect = new LevelSelect(LEVELS, (index: number) => {
  currentLevelIndex = index;
  engine.loadLevel(LEVELS[index]);
  hud.setLevelName(`第${index + 1}关 — ${LEVELS[index].name}`);
  gameView.snapToState(engine.block.state);
});

// 游戏启动时显示关卡选择
levelSelect.show();

// 重置
hud.setResetCallback(() => engine.reset());

// 下一关
hud.setNextLevelCallback(() => {
  if (currentLevelIndex < LEVELS.length - 1) {
    currentLevelIndex++;
    engine.loadLevel(LEVELS[currentLevelIndex]);
  }
});

// 返回选关
hud.setSelectLevelCallback(() => {
  levelSelect.show();
});
```

关键变更：
1. 导入 `LevelSelect` 组件
2. 创建 `levelSelect` 实例，初始时 `show()` 显示选关界面
3. 选关回调中加载指定关卡
4. HUD 添加 `setSelectLevelCallback` — 点击"☰ 选关"返回选关界面
5. `onReset` 中添加 `gameView.loadLevel`（重置Bug修复）
6. `onSwitchTriggered` → `onSwitchToggled`（机关切换）

- [ ] **Step 6: 运行测试 + 构建**

```bash
cd D:/Movegame && npm run test && npm run build
```

Expected: 20 tests passed, 构建成功

- [ ] **Step 7: Commit**

```bash
cd D:/Movegame && git add src/ui/LevelSelect.ts src/ui/HUD.ts src/style.css src/main.ts && git commit -m "feat: 关卡选择界面 + HUD选关按钮"
```

---

### Task 6: 端到端验证

**Files:** 无修改，仅验证

- [ ] **Step 1: 运行全部测试**

```bash
cd D:/Movegame && npm run test
```

Expected: 20 passed

- [ ] **Step 2: 运行构建**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译成功

- [ ] **Step 3: 启动开发服务器**

```bash
cd D:/Movegame && npm run dev
```

- [ ] **Step 4: 手动验证关卡选择界面**

1. 打开游戏 → 应显示关卡选择覆盖层
2. 点击第9关"闸门" → 选关界面隐藏，加载第9关
3. 确认关卡名显示正确，物块和场景正常

- [ ] **Step 5: 手动验证机关切换**

进入第9关"闸门"：
1. 确认金色机关圆盘在(2,1)，红色路障方块在(4,2)(4,3)
2. 走到(2,1)站上去 → 机关标记变绿，路障消失 → `newState='open'`
3. 再次走回(2,1)站上去 → 机关标记变回金色，路障恢复 → `newState='closed'`
4. 第三次踩 → 又变绿，路障又消失 → 循环正确

- [ ] **Step 6: 手动验证重置修复**

踩机关打开路障后，点击"↺ 重置"按钮 → 路障方块应复原为红色，机关标记应复原为金色。

- [ ] **Step 7: 手动验证"选关"按钮**

游戏中点击"☰ 选关" → 显示关卡选择界面 → 可切换到其他关卡。

- [ ] **Step 8: 最终提交（如有调整）**

```bash
cd D:/Movegame && git add -A && git commit -m "验证完成：机关切换 + 关卡选择 + 重置修复"
```