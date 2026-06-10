import {
  Direction,
  Orientation,
  BlockState,
  OccupiedCells,
  TransitionResult,
  RollAnimation,
} from './types';

/** 翻滚转换纯函数 — 12种状态转换的确定性计算 */
export function computeTransition(
  current: BlockState,
  dir: Direction
): TransitionResult {
  const { orientation, anchor } = current;
  const { x, z } = anchor;

  const duration = 250;

  // --- STANDING ---
  if (orientation === Orientation.Standing) {
    switch (dir) {
      case Direction.East:
        return {
          newState: { orientation: Orientation.LyingX, anchor: { x: x + 1, z } },
          occupiedCells: [{ x: x + 1, z }, { x: x + 2, z }],
          animation: { duration, direction: dir },
        };
      case Direction.West:
        return {
          newState: { orientation: Orientation.LyingX, anchor: { x: x - 2, z } },
          occupiedCells: [{ x: x - 2, z }, { x: x - 1, z }],
          animation: { duration, direction: dir },
        };
      case Direction.South:
        return {
          newState: { orientation: Orientation.LyingZ, anchor: { x, z: z + 1 } },
          occupiedCells: [{ x, z: z + 1 }, { x, z: z + 2 }],
          animation: { duration, direction: dir },
        };
      case Direction.North:
        return {
          newState: { orientation: Orientation.LyingZ, anchor: { x, z: z - 2 } },
          occupiedCells: [{ x, z: z - 2 }, { x, z: z - 1 }],
          animation: { duration, direction: dir },
        };
    }
  }

  // --- LYING_X ---
  if (orientation === Orientation.LyingX) {
    switch (dir) {
      case Direction.East: // 长轴方向 → 站立
        return {
          newState: { orientation: Orientation.Standing, anchor: { x: x + 2, z } },
          occupiedCells: [{ x: x + 2, z }],
          animation: { duration, direction: dir },
        };
      case Direction.West: // 长轴方向 → 站立
        return {
          newState: { orientation: Orientation.Standing, anchor: { x: x - 1, z } },
          occupiedCells: [{ x: x - 1, z }],
          animation: { duration, direction: dir },
        };
      case Direction.South: // 短轴方向 → 平移
        return {
          newState: { orientation: Orientation.LyingX, anchor: { x, z: z + 1 } },
          occupiedCells: [{ x, z: z + 1 }, { x: x + 1, z: z + 1 }],
          animation: { duration, direction: dir },
        };
      case Direction.North: // 短轴方向 → 平移
        return {
          newState: { orientation: Orientation.LyingX, anchor: { x, z: z - 1 } },
          occupiedCells: [{ x, z: z - 1 }, { x: x + 1, z: z - 1 }],
          animation: { duration, direction: dir },
        };
    }
  }

  // --- LYING_Z ---
  if (orientation === Orientation.LyingZ) {
    switch (dir) {
      case Direction.South: // 长轴方向 → 站立
        return {
          newState: { orientation: Orientation.Standing, anchor: { x, z: z + 2 } },
          occupiedCells: [{ x, z: z + 2 }],
          animation: { duration, direction: dir },
        };
      case Direction.North: // 长轴方向 → 站立
        return {
          newState: { orientation: Orientation.Standing, anchor: { x, z: z - 1 } },
          occupiedCells: [{ x, z: z - 1 }],
          animation: { duration, direction: dir },
        };
      case Direction.East: // 短轴方向 → 平移
        return {
          newState: { orientation: Orientation.LyingZ, anchor: { x: x + 1, z } },
          occupiedCells: [{ x: x + 1, z }, { x: x + 1, z: z + 1 }],
          animation: { duration, direction: dir },
        };
      case Direction.West: // 短轴方向 → 平移
        return {
          newState: { orientation: Orientation.LyingZ, anchor: { x: x - 1, z } },
          occupiedCells: [{ x: x - 1, z }, { x: x - 1, z: z + 1 }],
          animation: { duration, direction: dir },
        };
    }
  }

  throw new Error(`未处理的翻滚转换: ${orientation} + ${dir}`);
}