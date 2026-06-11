import { describe, it, expect } from 'vitest';
import { Cell, LevelData, Orientation } from './types';
import { Grid } from './Grid';
import { checkSwitchTrigger } from './SwitchState';

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
