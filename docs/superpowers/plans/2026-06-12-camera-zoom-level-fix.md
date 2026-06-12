# 摄像机缩放调整 + 关卡9-11路障修复 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将画面初始缩放从100%改为50%，支持50%-80%范围缩放；修复第10关和第11关的路障缺口，确保不触发机关无法通关。

**Architecture:** 摄像机缩放修改 `IsometricCamera.ts` 的 `zoomLevel` 默认值和缩放范围参数，配合 `GameView.ts` 调整缩放步进量。关卡修复通过在路障缺口处补设路障格（floorMap值=3）并扩展对应 `switches.barriers` 数组，确保路障形成完整封锁线。

**Tech Stack:** TypeScript, vitest, Three.js 正交摄像机

---

## 核心问题分析

### 问题1：画面缩放参数

当前 `IsometricCamera.ts`:
```ts
private baseFrustumSize = 8;
private zoomLevel = 1;       // 画面100%大小
private minZoom = 0.5;        // 可放大到200%
private maxZoom = 1.5;        // 可缩小到67%
```

需求：画面初始缩小50%（即zoomLevel=2，视锥扩大到16），缩放范围50%-80%（即zoomLevel从2到1.25）。

数学关系：
- zoomLevel越大 → 视锥越大 → 画面越小
- zoomLevel=2 → 画面50%大小（视锥16）
- zoomLevel=1.25 → 画面80%大小（视锥10）
- zoomLevel=1 → 画面100%大小（当前默认）

修改：
- `zoomLevel = 2` → 画面初始50%
- `minZoom = 1.25` → 画面最小80%（最大放大到80%）
- `maxZoom = 2` → 画面最大50%（初始状态就是最大缩小）

缩放步进调整：当前滚轮每次±0.1，范围0.5-1.5跨度1.0，10步可达极限。新范围1.25-2.0跨度0.75，步进改为±0.05更细腻（15步可达极限）。

### 问题2：关卡路障缺口

**LEVEL_10 (双闸)** — 不触发机关可绕行：

路障A在x=4列的z=1,2,3，路障B在z=5，但z=4的(4,4)是普通地板。物块可通过(4,4)从左区走到右区，6步直达终点(7,4)。

修复方案：(4,4)设为路障格，由机关A控制。这样x=4列z=1-5全部被封（路障A占4格，路障B占1格），必须踩机关才能打通。

**LEVEL_11 (回廊开路)** — 不触发机关可绕行：

路障只在(4,1)和(4,7)，中间x=4列z=2-6全部通行。物块可轻松从(4,4)穿越中列直达终点(7,6)。

修复方案：x=4列z=2-6也设为路障格，分别由机关A和机关B控制：
- 机关A控制(4,1)和(4,2)、(4,3) — 上半段封锁
- 机关B控制(4,7)和(4,4)、(4,5)、(4,6) — 下半段封锁

这样中路被完整封锁，只有踩机关才能分段打通。

---

## 文件结构

| 文件 | 负责 | 操作 |
|------|------|------|
| `src/render/IsometricCamera.ts` | 缩放参数修改 | 修改 |
| `src/render/GameView.ts` | 缩放步进调整 | 修改 |
| `src/data/levels.ts` | LEVEL_10和LEVEL_11路障修复 | 修改 |

---

### Task 1: 摄像机缩放参数调整

**Files:**
- Modify: `src/render/IsometricCamera.ts`
- Modify: `src/render/GameView.ts`

- [ ] **Step 1: 修改 IsometricCamera.ts 缩放参数**

将 `src/render/IsometricCamera.ts` 中第6-9行的缩放参数修改为：

```ts
  private baseFrustumSize = 8;
  private zoomLevel = 2;       // 初始画面50%大小（视锥扩大到16）
  private minZoom = 1.25;      // 画面最小80%（最大放大到80%大小）
  private maxZoom = 2;         // 画面最大50%（初始就是最大缩小，视锥=16）
```

说明：
- zoomLevel=2：初始视锥 = baseFrustumSize * 2 = 16，画面显示为50%大小
- minZoom=1.25：视锥最小 = baseFrustumSize * 1.25 = 10，画面最大80%大小
- maxZoom=2：视锥最大 = baseFrustumSize * 2 = 16，画面最小50%大小
- 缩放范围从50%到80%，用户只能放大（画面变大），不能比初始更小

- [ ] **Step 2: 修改 GameView.ts 缩放步进量**

将 `src/render/GameView.ts` 中第49-52行的滚轮缩放步进从0.1改为0.05：

```ts
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.zoom(e.deltaY > 0 ? 0.05 : -0.05);
    }, { passive: false });
```

同时修改第69行的双指捏合缩放系数从0.005改为0.003：

```ts
          const delta = (dist - lastPinchDist) * 0.003;
```

步进更细腻的原因：新范围1.25-2.0跨度0.75，比旧范围0.5-1.5跨度1.0更小，需要更小步进保持手感。0.05步进需要15步到达极限，0.003捏合系数手感更平滑。

- [ ] **Step 3: 运行构建验证**

```bash
cd D:/Movegame && npm run build
```

Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
cd D:/Movegame && git add src/render/IsometricCamera.ts src/render/GameView.ts && git commit -m "feat: 画面初始缩放50%，缩放范围50%-80%，步进更细腻"
```

---

### Task 2: 修复 LEVEL_10 路障缺口

**Files:**
- Modify: `src/data/levels.ts`

- [ ] **Step 1: 修改 LEVEL_10 的 floorMap 和 switches**

将 `src/data/levels.ts` 中 LEVEL_10 的数据修改为：

```ts
/**
 * 第10关：双闸 — 两个机关分别控制两组路障，路障形成完整封锁线
 * 不触发机关无法通关：x=4列从z=1到z=5全部被路障封堵，必须踩机关打通
 *
 * 推演（触发机关A打通中路）：
 *   Standing(1,1)→S→LyingZ(1,2)→E→LyingZ(2,2)→N→Standing(2,1)
 *   →E→LyingX(3,1)→E→LyingX(4,1)→S→LyingX(4,2)路障已开→S→LyingX(4,3)路障已开
 *   →S→LyingX(4,4)路障已开→E→Standing(5,4)→E→LyingX(6,4)→E→Standing(7,4) ✅
 *
 * 验证：不触发机关时，x=4列z=1-5全部是路障(3)，物块无法从左区穿越到右区
 *   唯一可能绕行的z=4行，(4,4)也是路障，完全封锁 ✅
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
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,4)=路障A ← 新增！封堵缺口
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,5)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 4 },
  switches: [
    {
      cell: { x: 2, z: 2 },
      barriers: [{ x: 4, z: 1 }, { x: 4, z: 2 }, { x: 4, z: 3 }, { x: 4, z: 4 }],  // 机关A：4个路障（含新增(4,4)）
    },
    {
      cell: { x: 6, z: 2 },
      barriers: [{ x: 4, z: 5 }],  // 机关B：1个路障
    },
  ],
};
```

关键变更：
1. floorMap z=4行：(4,4)从1改为3（路障）
2. 机关A的barriers数组：新增 `{ x: 4, z: 4 }`

验证（不触发机关时）：
- x=4列：z=1,2,3,4全为路障A，z=5为路障B — 完整封锁
- 左区(x:1-3)与右区(x:5-7)被完全隔断
- z=4行(4,4)不再是缺口 — 不可绕行 ✅

- [ ] **Step 2: 运行测试和构建**

```bash
cd D:/Movegame && npm run test && npm run build
```

Expected: 20 passed, 构建成功

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/data/levels.ts && git commit -m "fix: LEVEL_10路障缺口封堵——(4,4)设为路障，机关A控制4格"
```

---

### Task 3: 修复 LEVEL_11 路障缺口

**Files:**
- Modify: `src/data/levels.ts`

- [ ] **Step 1: 修改 LEVEL_11 的 floorMap 和 switches**

将 `src/data/levels.ts` 中 LEVEL_11 的数据修改为：

```ts
/**
 * 第11关：回廊开路 — 踩机关打通中路封锁线
 * x=4列从z=1到z=7全部被路障封堵，形成完整封锁线
 * 不触发机关无法通关：左右区域被中路完全隔断
 *
 * 推演（触发机关A打通上半段）：
 *   Standing(1,1)→S→LyingZ(1,2)→E→LyingZ(2,2)→S→Standing(2,4)
 *   →E→LyingX(3,4)→N→LyingX(3,3)→N→Standing(3,2)→S→LyingZ(3,3)
 *   →S→Standing(3,5)踩机关B！(4,4)(4,5)(4,6)(4,7)路障B消失
 *   →W→Standing(2,5)... 需回到机关A位置踩机关A
 *   修正策略：先踩机关B打通下半段，再走回踩机关A打通上半段
 *
 * 简化推演：
 *   Standing(1,1)→S→LyingZ(1,2)→S→Standing(1,4)
 *   →E→LyingX(2,4)→E→LyingX(3,4)→N→Standing(3,2) 踩机关A！(4,1)(4,2)(4,3)路障A消失
 *   →S→LyingZ(3,3)→S→Standing(3,5) 踩机关B！(4,4)(4,5)(4,6)(4,7)路障B消失
 *   →E→LyingX(4,5)路障B已开→E→LyingX(5,5)→S→LyingX(5,6)→S→LyingX(5,7)
 *   →E→Standing(7,6)... 但终点是(7,6)需要Standing到达
 *   修正: 从(3,5)踩机关B后→E→LyingX(4,5)→E→Standing(5,5)...不够
 *   从机关B踩后走中路向南:
 *   Standing(3,5)踩机关B→E→LyingX(4,5)路障已开→S→LyingX(4,6)路障已开
 *   →S→LyingX(4,7)路障已开→E→Standing(5,7)
 *   →N→LyingZ(5,6)→N→Standing(5,4)
 *   →E→LyingX(6,4)→E→LyingX(7,4)→S→LyingX(7,5)→S→Standing(7,6) ✅
 */
export const LEVEL_11: LevelData = {
  id: '11',
  name: '回廊开路',
  width: 9,
  height: 9,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,1)=路障A
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,2)=路障A ← 新增
    [0, 1, 1, 2, 3, 1, 1, 1, 0],  // (3,3)=机关A, (4,3)=路障A ← 新增
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,4)=路障B ← 新增
    [0, 1, 1, 2, 3, 1, 1, 1, 0],  // (3,5)=机关B, (4,5)=路障B ← 新增
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,6)=路障B ← 新增
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,7)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 6 },
  switches: [
    {
      cell: { x: 3, z: 3 },
      barriers: [{ x: 4, z: 1 }, { x: 4, z: 2 }, { x: 4, z: 3 }],  // 机关A：上半段3个路障
    },
    {
      cell: { x: 3, z: 5 },
      barriers: [{ x: 4, z: 4 }, { x: 4, z: 5 }, { x: 4, z: 6 }, { x: 4, z: 7 }],  // 机关B：下半段4个路障
    },
  ],
};
```

关键变更：
1. floorMap新增路障格：(4,2)=3, (4,3)=3, (4,4)=3, (4,5)=3, (4,6)=3
2. 机关A barriers：从1个扩展为3个 `{(4,1),(4,2),(4,3)}`
3. 机关B barriers：从1个扩展为4个 `{(4,4),(4,5),(4,6),(4,7)}`
4. x=4列z=1-7全部是路障 — 完整封锁线 ✅

验证（不触发机关时）：
- x=4列：z=1到z=7全为路障 — 左区与右区完全隔断
- 没有任何缺口可以绕行 ✅

- [ ] **Step 2: 运行测试和构建**

```bash
cd D:/Movegame && npm run test && npm run build
```

Expected: 20 passed, 构建成功

- [ ] **Step 3: Commit**

```bash
cd D:/Movegame && git add src/data/levels.ts && git commit -m "fix: LEVEL_11路障缺口封堵——x=4列完整封锁线，机关A/B各控制半段"
```

---

### Task 4: 端到端验证

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

- [ ] **Step 4: 验证画面缩放**

1. 打开游戏 → 画面应显示为50%大小（比原来更远/更小）
2. 鼠标滚轮向下滚 → 画面放大（最大到80%大小）
3. 鼠标滚轮向上滚 → 画面缩小（最小回到50%大小）
4. 缩放手感应比之前更细腻

- [ ] **Step 5: 验证 LEVEL_10 路障封锁**

进入第10关"双闸"：
1. x=4列应有5个红色路障方块（z=1到z=5）— 完整封锁线
2. 不踩机关，尝试从左区走到右区 — 应无法到达终点(7,4)
3. 踩机关A(2,2) → 路障z=1-4消失 → 可通过上半段
4. 踩机关B(6,2) → 路障z=5消失 → 可通过下半段

- [ ] **Step 6: 验证 LEVEL_11 路障封锁**

进入第11关"回廊开路"：
1. x=4列应有7个红色路障方块（z=1到z=7）— 完整封锁线
2. 不踩机关，尝试从左区走到右区 — 应无法到达终点(7,6)
3. 踩机关A(3,3) → 路障z=1-3消失 → 上半段打通
4. 踩机关B(3,5) → 路障z=4-7消失 → 下半段打通
5. 两段都打通后可沿中路到达终点

- [ ] **Step 7: 验证 LEVEL_9 机关卡位**

进入第9关"闸门"：
1. 不踩机关 → 路障(4,2)(4,3)阻挡 → 无法到达终点(5,5)
2. 经严格推演验证：Standing(5,5)的唯一前驱是LyingZ(5,3)，LyingZ(5,3)的唯一前驱是Standing(5,2)，而Standing(5,2)的所有前驱都被路障(4,2)(4,3)阻断
3. 因此不触发机关无法通关 ✅ — LEVEL_9关卡设计正确

- [ ] **Step 8: 最终提交（如有调整）**

```bash
cd D:/Movegame && git add -A && git commit -m "验证完成：摄像机缩放调整 + 关卡路障修复"
```