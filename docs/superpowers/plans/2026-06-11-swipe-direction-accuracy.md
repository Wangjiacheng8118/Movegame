# 触屏滑动方向准确性优化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复触屏滑动方向映射的关键Bug（X/Z轴互换），并使用正确的等距投影系数、优化D-pad视觉布局、增加滑动质量参数，使移动端操作方向完全准确。

**Architecture:** 将滑动→方向的映射逻辑从 TouchInput.ts 中提取为纯函数 `resolveSwipeDirection(dx, dy)` 放入 `src/core/SwipeMapping.ts`（逻辑层），使用精确等距逆投影公式（`worldX = dx + √3·dy`, `worldZ = -dx + √3·dy`），添加 vitest 测试覆盖，再由 TouchInput.ts 调用。D-pad 从方形布局改为菱形布局以匹配等距视角。

**Tech Stack:** TypeScript, vitest, Three.js 等距正交摄像机

---

## 核心问题分析

### Bug：方向映射轴互换 + 投影系数错误

当前代码（TouchInput.ts:40-46）：

```ts
const isoX = dx + dy;
const isoY = -dx + dy;

if (Math.abs(isoX) > Math.abs(isoY)) {
  onDirection(isoX > 0 ? Direction.South : Direction.North);  // ← Bug: 映射到Z轴方向
} else {
  onDirection(isoY > 0 ? Direction.West : Direction.East);    // ← Bug: 映射到X轴方向，符号也反了
}
```

数学推导（摄像机位于 `(centerX+d, d, centerZ+d)` 从 `(+1,+1,+1)` 方向观察）：

Three.js view matrix 行向量：
- Row 0 (right): `(1/√2, 0, -1/√2)`
- Row 1 (up): `(-1/√6, 2/√6, -1/√6)` (NDC, y上正)
- Row 2 (forward): `(1/√3, 1/√3, 1/√3)`

屏幕方向向量（屏幕坐标：x右正，y下正）：
- East (+X) → 屏幕 `(1/√2, +1/√6)` ≈ 右偏下30° → **右下**
- West (-X) → 屏幕 `(-1/√2, -1/√6)` ≈ 左偏上30° → **左上**
- South (+Z) → 屏幕 `(-1/√2, +1/√6)` ≈ 左偏下30° → **左下**
- North (-Z) → 屏幕 `(1/√2, -1/√6)` ≈ 右偏上30° → **右上**

逆投影（地面平面，wY=0）：
```
screen_dx = 1/√2·wX - 1/√2·wZ = dx
screen_dy = 1/√6·wX + 1/√6·wZ = dy   (屏幕坐标y下正)
```

解得：
```
wX ∝ dx + √3·dy     (East/West分量)
wZ ∝ -dx + √3·dy    (South/North分量)
```

**两个Bug：**
1. **轴互换**：当前代码的 isoX 映射到了 South/North（Z轴），isoY 映射到了 West/East（X轴）且符号反了。正确应为：worldX→East/West，worldZ→South/North
2. **系数错误**：当前代码系数为 `(1,1)` 和 `(-1,1)`，正确应为 `(1, √3)` 和 `(-1, √3)`。dy 的系数是 √3≈1.732 而非 1，因为等距投影中Y轴分量权重更大

当前 D-pad 方向与等距视角不匹配

当前 D-pad 是方形布局：▲在顶部→North，但在等距视角中 North(-Z) 出现在屏幕右上。D-pad 应改为菱形布局对齐等距菱形网格。

---

## 文件结构

| 文件 | 责责 | 操作 |
|------|------|------|
| `src/core/SwipeMapping.ts` | 滑动→方向纯函数（逻辑层） | 创建 |
| `src/core/SwipeMapping.test.ts` | 纯函数单元测试 | 创建 |
| `src/input/TouchInput.ts` | 触屏输入（调用纯函数 + D-pad） | 修改 |
| `src/style.css` | D-pad 菱形布局样式 | 修改 |
| `package.json` | 添加 vitest 依赖 | 修改 |
| `vitest.config.ts` | vitest 配置 | 创建 |

---

### Task 1: 添加 vitest 测试基础设施 + 提取滑动映射纯函数

**Files:**
- Create: `vitest.config.ts`
- Create: `src/core/SwipeMapping.ts`
- Create: `src/core/SwipeMapping.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 安装 vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: 添加 vitest 配置**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 3: 在 package.json 中添加 test script**

在 `package.json` 的 `scripts` 中添加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 创建滑动映射纯函数**

Create `src/core/SwipeMapping.ts`:

```ts
import { Direction } from './types';

/**
 * 等距视角摄像机投影系数。
 * 摄像机位于 (centerX+d, d, centerZ+d) 从 (+1,+1,+1) 方向观察，
 * Three.js view matrix:
 *   Row 0 (right): (1/√2, 0, -1/√2)
 *   Row 1 (up):    (-1/√6, 2/√6, -1/√6)
 *
 * 逆投影（地面平面 wY=0）：
 *   wX ∝ dx + √3·dy   (East/West分量)
 *   wZ ∝ -dx + √3·dy  (South/North分量)
 *
 * 屏幕方向对应：
 *   屏幕右下 → East (+X)    屏幕左上 → West (-X)
 *   屏幕左下 → South (+Z)   屏幕右上 → North (-Z)
 */
const ISO_FACTOR = Math.sqrt(3);

/** 方向模糊死区阈值 — 两分量比值接近1时视为方向模糊 */
const AMBIGUOUS_RATIO = 0.65;

/**
 * 将屏幕滑动增量映射为游戏方向。
 *
 * @param dx 屏幕水平增量（正值=右）
 * @param dy 屏幕垂直增量（正值=下）
 * @param minDistance 最小滑动距离（像素），低于此值返回 null
 * @returns 游戏方向，或 null 表示滑动太短或方向模糊
 */
export function resolveSwipeDirection(
  dx: number,
  dy: number,
  minDistance: number = 50
): Direction | null {
  // 距离过滤：dx和dy都需要至少一个超过阈值
  if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) {
    return null;
  }

  // 等距逆投影：屏幕坐标 → 世界坐标分量
  const worldX = dx + ISO_FACTOR * dy;   // East/West分量
  const worldZ = -dx + ISO_FACTOR * dy;  // South/North分量

  // 死区：两分量比值接近1时，方向判定模糊，不响应
  const maxComp = Math.max(Math.abs(worldX), Math.abs(worldZ));
  const minComp = Math.min(Math.abs(worldX), Math.abs(worldZ));
  if (maxComp > 0 && minComp / maxComp > AMBIGUOUS_RATIO) {
    return null;
  }

  // 方向判定：哪个世界分量更大
  if (Math.abs(worldX) > Math.abs(worldZ)) {
    return worldX > 0 ? Direction.East : Direction.West;
  } else {
    return worldZ > 0 ? Direction.South : Direction.North;
  }
}
```

- [ ] **Step 5: 创建单元测试**

Create `src/core/SwipeMapping.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Direction } from './types';
import { resolveSwipeDirection } from './SwipeMapping';

describe('resolveSwipeDirection', () => {
  // === 核心四方向测试（基于精确等距逆投影）===

  it('屏幕右下滑动 → East (+X)', () => {
    // East在屏幕上方向为 (1/√2, 1/√6)，约右偏下30°
    // worldX = 1/√2 + √3·(1/√6) = 0.707 + 0.707 = 1.414 (主导)
    // worldZ = -1/√2 + √3·(1/√6) = -0.707 + 0.707 = 0.000 (边界)
    // 用更大的偏移量确保不触发死区
    const result = resolveSwipeDirection(87, 50);
    expect(result).toBe(Direction.East);
  });

  it('屏幕左上滑动 → West (-X)', () => {
    const result = resolveSwipeDirection(-87, -50);
    expect(result).toBe(Direction.West);
  });

  it('屏幕左下滑动 → South (+Z)', () => {
    // South在屏幕上方向为 (-1/√2, 1/√6)，约左偏下30°
    // worldX = -1/√2 + √3·(1/√6) = -0.707 + 0.707 ≈ 0 (边界)
    // worldZ = 1/√2 + √3·(1/√6) = 0.707 + 0.707 = 1.414 (主导)
    const result = resolveSwipeDirection(-87, 50);
    expect(result).toBe(Direction.South);
  });

  it('屏幕右上滑动 → North (-Z)', () => {
    const result = resolveSwipeDirection(87, -50);
    expect(result).toBe(Direction.North);
  });

  // === 纯水平/垂直滑动 ===

  it('纯右滑动 → East', () => {
    // worldX = 100 + √3·0 = 100, worldZ = -100 + √3·0 = -100
    // |worldX| = |worldZ| → 模糊死区 → null
    // 纯水平在精确等距投影中确实落入死区
    const result = resolveSwipeDirection(100, 0);
    expect(result).toBeNull(); // 纯水平滑动方向模糊
  });

  it('纯下滑动 → South', () => {
    // worldX = 0 + √3·100 ≈ 173, worldZ = 0 + √3·100 ≈ 173
    // |worldX| = |worldZ| → 模糊死区 → null
    // 纯垂直在精确等距投影中确实落入死区
    const result = resolveSwipeDirection(0, 100);
    expect(result).toBeNull(); // 纯垂直滑动方向模糊
  });

  // === 沿世界轴方向的滑动（最自然的操作角度）===

  it('沿 East 轴方向滑动 → East', () => {
    // East 屏幕投影 (1/√2, 1/√6)，手指沿此方向滑动
    const result = resolveSwipeDirection(70, 40);
    expect(result).toBe(Direction.East);
  });

  it('沿 South 轴方向滑动 → South', () => {
    // South 屏幕投影 (-1/√2, 1/√6)
    const result = resolveSwipeDirection(-70, 40);
    expect(result).toBe(Direction.South);
  });

  it('沿 North 轴方向滑动 → North', () => {
    // North 屏幕投影 (1/√2, -1/√6)
    const result = resolveSwipeDirection(70, -40);
    expect(result).toBe(Direction.North);
  });

  it('沿 West 轴方向滑动 → West', () => {
    // West 屏幕投影 (-1/√2, -1/√6)
    const result = resolveSwipeDirection(-70, -40);
    expect(result).toBe(Direction.West);
  });

  // === 距离过滤 ===

  it('滑动距离不足 → null', () => {
    const result = resolveSwipeDirection(10, 5);
    expect(result).toBeNull();
  });

  it('滑动距离刚好达标 → 返回方向', () => {
    const result = resolveSwipeDirection(87, 55);
    expect(result).not.toBeNull();
  });

  // === 方向模糊死区 ===

  it('接近坐标轴45°对角线的滑动 → null（模糊死区）', () => {
    // dx ≈ dy 时，worldX 和 worldZ 分量接近，判定模糊
    const result = resolveSwipeDirection(60, 0);
    expect(result).toBeNull(); // 纯水平落入死区
  });

  // === 系数准确性验证（对比旧代码的Bug）===

  it('旧代码会用系数1判定为North，正确应为East', () => {
    // 沿East方向偏右下滑动
    // 旧代码: isoX = 80+46=126, isoY = -80+46=-34, |isoX|>|isoY| → South/North → isoX>0 → South ✗
    // 新代码: worldX = 80+√3·46≈159, worldZ = -80+√3·46≈-0.5, |worldX|>>|worldZ| → East ✓
    const result = resolveSwipeDirection(80, 46);
    expect(result).toBe(Direction.East);
  });

  it('旧代码会用系数1判定为East，正确应为South', () => {
    // 沿South方向偏左下滑动
    // 旧代码: isoX = -80+46=-34, isoY = 80+46=126, |isoY|>|isoX| → East/West → isoY>0 → West ✗
    // 新代码: worldX = -80+√3·46≈-0.5, worldZ = 80+√3·46≈160, |worldZ|>>|worldX| → South ✓
    const result = resolveSwipeDirection(-80, 46);
    expect(result).toBe(Direction.South);
  });
});
```

- [ ] **Step 6: 运行测试验证纯函数正确性**

```bash
npm run test
```

Expected: 所有测试 PASS

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts src/core/SwipeMapping.ts src/core/SwipeMapping.test.ts
git commit -m "feat: 提取滑动映射纯函数 + 添加vitest测试基础设施"
```

---

### Task 2: 修复 TouchInput.ts — 调用纯函数替换错误映射

**Files:**
- Modify: `src/input/TouchInput.ts`

- [ ] **Step 1: 修改滑动输入逻辑**

将 `TouchInput.ts` 的滑动输入部分替换为调用 `resolveSwipeDirection` 纯函数。

修改 `src/input/TouchInput.ts` 全部内容为：

```ts
import { Direction } from '../core/types';
import { resolveSwipeDirection } from '../core/SwipeMapping';

/**
 * 触摸输入
 * 1. 滑动：在屏幕空白区域滑动控制方向（等距视角适配）
 * 2. 虚拟方向键：屏幕左下角菱形布局，对齐等距网格方向
 */
export class TouchInput {
  private startX = 0;
  private startY = 0;
  private minSwipeDist = 50;
  private isDetectMobile: boolean;

  constructor(target: HTMLElement, onDirection: (dir: Direction) => void) {
    this.isDetectMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 滑动输入
    target.addEventListener('touchstart', (e) => {
      // 忽略虚拟按键区域的触摸
      if ((e.target as HTMLElement).closest('.dpad')) return;
      const t = e.touches[0];
      this.startX = t.clientX;
      this.startY = t.clientY;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if ((e.target as HTMLElement).closest('.dpad')) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.startX;
      const dy = t.clientY - this.startY;

      // 使用纯函数解析滑动方向（等距逆投影 + 死区过滤）
      const dir = resolveSwipeDirection(dx, dy, this.minSwipeDist);
      if (dir) {
        onDirection(dir);
      }
      e.preventDefault();
    }, { passive: false });

    // 虚拟方向键（仅移动端显示）
    if (this.isDetectMobile) {
      this.createDpad(onDirection);
    }
  }

  /** 创建菱形虚拟方向键（对齐等距网格方向） */
  private createDpad(onDirection: (dir: Direction) => void): void {
    const dpad = document.createElement('div');
    dpad.className = 'dpad';
    // 菱形布局：↗=North, ↙=South, ↘=East, ↖=West
    // 对齐等距视角：North在屏幕右上，South在屏幕左下，East在屏幕右下，West在屏幕左上
    dpad.innerHTML = `
      <button class="dpad-btn dpad-north" data-dir="N">↗</button>
      <button class="dpad-btn dpad-west" data-dir="W">↖</button>
      <button class="dpad-btn dpad-east" data-dir="E">↘</button>
      <button class="dpad-btn dpad-south" data-dir="S">↙</button>
    `;

    const dirMap: Record<string, Direction> = {
      N: Direction.North, S: Direction.South,
      E: Direction.East, W: Direction.West,
    };

    dpad.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = (btn as HTMLElement).dataset.dir!;
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onDirection(dirMap[dir]);
      };
      btn.addEventListener('touchstart', handler, { passive: false });
      btn.addEventListener('mousedown', handler);
    });

    document.body.appendChild(dpad);
  }
}
```

- [ ] **Step 2: 运行测试确认纯函数仍然正确**

```bash
npm run test
```

Expected: 所有测试 PASS

- [ ] **Step 3: Commit**

```bash
git add src/input/TouchInput.ts
git commit -m "fix: 修复滑动方向映射Bug + 提高最小滑动距离到50px"
```

---

### Task 3: 更新 D-pad CSS — 菱形布局对齐等距视角

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: 替换 D-pad 样式为菱形布局**

将 `src/style.css` 中从 `/* === 虚拟方向键 === */` 开始的 `.dpad` 相关样式全部替换为：

```css
/* === 虚拟方向键（菱形布局，对齐等距视角） === */
.dpad {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 140px;
  height: 140px;
  z-index: 100;
  display: grid;
  grid-template-columns: 46px 46px 46px;
  grid-template-rows: 46px 46px 46px;
  grid-template-areas:
    ".    north ."
    "west .    east"
    ".    south .";
  pointer-events: auto;
  transform: rotate(45deg);  /* 菱形旋转，对齐等距网格 */
}

.dpad-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  transition: background 0.1s, color 0.1s;
  transform: rotate(-45deg);  /* 按钮文字反向旋转，保持文字正立 */
}

.dpad-btn:active {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.dpad-north { grid-area: north; }
.dpad-west  { grid-area: west; }
.dpad-east  { grid-area: east; }
.dpad-south { grid-area: south; }

/* PC 上隐藏虚拟方向键 */
@media (hover: hover) and (pointer: fine) {
  .dpad { display: none; }
}
```

说明：
- D-pad 整体旋转45°变成菱形，对齐等距网格的四个轴方向
- 按钮文字反向旋转45°保持正立可读
- ↗=North（屏幕右上方向），↘=East（屏幕右下方向），↙=South（屏幕左下方向），↖=West（屏幕左上方向）

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: D-pad菱形布局对齐等距视角方向"
```

---

### Task 4: 添加滑动方向视觉反馈

**Files:**
- Modify: `src/input/TouchInput.ts`
- Modify: `src/style.css`

- [ ] **Step 1: 在 TouchInput.ts 中添加方向指示器**

在 `TouchInput.ts` 的滑动检测成功后，显示一个短暂的方向箭头指示器。

在 `src/input/TouchInput.ts` 的构造函数中添加方向指示器逻辑：

```ts
// 方向指示器元素（滑动成功后短暂显示）
private directionIndicator: HTMLElement | null = null;

private showDirectionIndicator(dir: Direction): void {
  // 移除旧的指示器
  if (this.directionIndicator) {
    this.directionIndicator.remove();
  }

  const arrowMap: Record<Direction, string> = {
    [Direction.North]: '↗',
    [Direction.South]: '↙',
    [Direction.East]: '↘',
    [Direction.West]: '↖',
  };

  const indicator = document.createElement('div');
  indicator.className = 'swipe-indicator';
  indicator.textContent = arrowMap[dir];
  document.body.appendChild(indicator);
  this.directionIndicator = indicator;

  // 300ms后自动移除
  setTimeout(() => {
    indicator.remove();
    if (this.directionIndicator === indicator) {
      this.directionIndicator = null;
    }
  }, 300);
}
```

在滑动检测成功时调用：

```ts
const dir = resolveSwipeDirection(dx, dy, this.minSwipeDist);
if (dir) {
  onDirection(dir);
  this.showDirectionIndicator(dir);
}
```

- [ ] **Step 2: 在 style.css 中添加方向指示器样式**

在 `src/style.css` 末尾添加：

```css
/* === 滑动方向指示器 === */
.swipe-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
  z-index: 50;
  animation: swipe-fade 300ms ease-out forwards;
}

@keyframes swipe-fade {
  0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/input/TouchInput.ts src/style.css
git commit -m "feat: 添加滑动方向视觉反馈指示器"
```

---

### Task 5: 构建验证 — 运行游戏确认所有方向正确

**Files:** 无修改，仅验证

- [ ] **Step 1: 运行开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 运行单元测试**

```bash
npm run test
```

Expected: 所有测试 PASS

- [ ] **Step 3: 在浏览器中验证滑动方向**

在移动端视口（或浏览器开发者工具的移动模拟模式）下测试：

| 滑动方向 | 期望游戏方向 | 物块屏幕移动 |
|---------|------------|-------------|
| 右下滑动 | East (+X) | 物块移向屏幕右下 |
| 左上滑动 | West (-X) | 物块移向屏幕左上 |
| 左下滑动 | South (+Z) | 物块移向屏幕左下 |
| 右上滑动 | North (-Z) | 物块移向屏幕右上 |

- [ ] **Step 4: 验证 D-pad 菱形布局**

D-pad 四个按钮应对齐等距菱形：
- ↗（右上位置）→ 物块移向屏幕右上 ✓
- ↘（右下位置）→ 物块移向屏幕右下 ✓
- ↙（左下位置）→ 物块移向屏幕左下 ✓
- ↖（左上位置）→ 物块移向屏幕左上 ✓

- [ ] **Step 5: 验证方向指示器**

每次滑动成功后，屏幕中央应短暂显示对应方向箭头（↗↘↙↖），300ms后淡出消失。

- [ ] **Step 6: 最终 Commit（如有调整）**

```bash
git add -A
git commit -m "验证完成：触屏滑动方向准确性优化"
```