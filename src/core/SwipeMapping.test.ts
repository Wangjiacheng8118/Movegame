import { describe, it, expect } from 'vitest';
import { Direction } from './types';
import { resolveSwipeDirection } from './SwipeMapping';

describe('resolveSwipeDirection', () => {
  // === 核心四方向测试（基于精确等距逆投影）===

  it('屏幕右下滑动 → East (+X)', () => {
    const result = resolveSwipeDirection(87, 50);
    expect(result).toBe(Direction.East);
  });

  it('屏幕左上滑动 → West (-X)', () => {
    const result = resolveSwipeDirection(-87, -50);
    expect(result).toBe(Direction.West);
  });

  it('屏幕左下滑动 → South (+Z)', () => {
    const result = resolveSwipeDirection(-87, 50);
    expect(result).toBe(Direction.South);
  });

  it('屏幕右上滑动 → North (-Z)', () => {
    const result = resolveSwipeDirection(87, -50);
    expect(result).toBe(Direction.North);
  });

  // === 纯水平/垂直滑动（落入死区）===

  it('纯右滑动 → null（死区）', () => {
    const result = resolveSwipeDirection(100, 0);
    expect(result).toBeNull();
  });

  it('纯下滑动 → null（死区）', () => {
    const result = resolveSwipeDirection(0, 100);
    expect(result).toBeNull();
  });

  // === 沿世界轴方向的滑动 ===

  it('沿 East 轴方向滑动 → East', () => {
    const result = resolveSwipeDirection(70, 40);
    expect(result).toBe(Direction.East);
  });

  it('沿 South 轴方向滑动 → South', () => {
    const result = resolveSwipeDirection(-70, 40);
    expect(result).toBe(Direction.South);
  });

  it('沿 North 轴方向滑动 → North', () => {
    const result = resolveSwipeDirection(70, -40);
    expect(result).toBe(Direction.North);
  });

  it('沿 West 轴方向滑动 → West', () => {
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

  // === Bug对比验证 ===

  it('旧代码Bug: 判为South，正确应为East', () => {
    const result = resolveSwipeDirection(80, 46);
    expect(result).toBe(Direction.East);
  });

  it('旧代码Bug: 判为West，正确应为South', () => {
    const result = resolveSwipeDirection(-80, 46);
    expect(result).toBe(Direction.South);
  });
});
