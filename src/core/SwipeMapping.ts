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