# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言要求

所有回答、解释、思考过程必须使用 **中文**。

## 游戏开发思考过程

每次进行游戏开发相关任务时，必须遵循以下思考流程，并按步骤汇报进展：

1. **核心玩法定义** — 先明确"玩家做什么觉得有趣"，核心机制是什么？
2. **技术选型** — 根据玩法需求选择引擎/框架，不过度工程化
3. **最小可玩原型** — 先做出能跑能玩的最小版本，再迭代扩展
4. **分层设计** — 区分游戏逻辑层、渲染层、输入层、数据层，保持关注点分离
5. **迭代开发** — 小步快跑，每次只加一个功能，确保每步可运行
6. **体验优先** — 代码为游戏体验服务，不为了架构而牺牲可玩性

## Project Overview

Movegame — 翻滚长方体物块益智游戏。玩家操控 2×1×1 长方体在有限网格路径上翻滚移动，利用"站立占1格、躺卧占2格"的状态切换规划路径，从起点到达终点（需站立到达）。

## Build & Run

```bash
npm run dev      # 启动开发服务器（Vite，支持局域网访问）
npm run build    # TypeScript 编译 + Vite 生产构建
npm run preview  # 预览生产构建
```

## Architecture

项目采用分层架构，逻辑与渲染严格分离：

- **`src/core/`** — 游戏逻辑层（纯数据，无渲染依赖）
  - `types.ts` — 核心类型定义（Direction, Orientation, BlockState, LevelData 等）
  - `TransitionTable.ts` — 翻滚转换纯函数（12种状态转换，Bloxorz标准）
  - `Block.ts` — 物块状态类（占格计算、翻转应用）
  - `Grid.ts` — 网格地图与边界查询（Set<string> 存储）
  - `GameEngine.ts` — 游戏引擎（tryMove / checkWin / reset，连接所有逻辑）
- **`src/render/`** — 3D渲染层（Three.js）
  - `IsometricCamera.ts` — 正交等距视角摄像机
  - `GridRenderer.ts` — 网格地板渲染（起点绿、终点红）
  - `BlockRenderer.ts` — 物块3D模型与翻滚动画（支点旋转法）
  - `GameView.ts` — 渲染总协调器（场景、灯光、渲染循环）
- **`src/input/`** — 输入层
  - `InputManager.ts` — 统一输入分发
  - `KeyboardInput.ts` — WASD / 方向键
  - `TouchInput.ts` — 滑动方向识别（30px最小距离）
- **`src/data/`** — 关卡数据
  - `levels.ts` — 关卡定义（LEVEL_1 为 5×5 矩形路径）
- **`src/ui/`** — HUD界面
  - `HUD.ts` — 步数、重置按钮、通关提示

### 翻滚规则核心

物块有三种朝向（Standing/LyingX/LyingZ），每种朝向往四个方向翻滚都有确定性结果：
- Standing → 任何方向翻滚 → 变躺卧，占2格，远离原格
- LyingX/LyingZ → 沿长轴翻 → 变Standing占1格；沿短轴翻 → 平移仍占2格

锚点约定：LyingX 取 x 较小格，LyingZ 取 z 较小格，保证状态唯一表示。