import { describe, it, expect } from 'vitest';
import { Cell, LevelData, Orientation } from './types';
import { Grid } from './Grid';
import { checkSwitchToggle } from './SwitchState';

function createTestLevel(): LevelData {
  return {
    id: 'test',
    name: '测试',
    width: 5,
    height: 5,
    floorMap: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 2, 1, 0],
      [0, 1, 3, 1, 0],
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
    expect(grid.isBarrier(2, 3)).toBe(true);
    expect(grid.isFloor(2, 3)).toBe(false);
    expect(grid.isSwitchActivated(2, 2)).toBe(false);

    const result = checkSwitchToggle({ x: 2, z: 2 }, grid);

    expect(result).not.toBeNull();
    expect(result!.switchCell).toEqual({ x: 2, z: 2 });
    expect(result!.barriersAffected).toEqual([{ x: 2, z: 3 }]);
    expect(result!.newState).toBe('open');

    expect(grid.isBarrier(2, 3)).toBe(false);
    expect(grid.isFloor(2, 3)).toBe(true);
    expect(grid.isSwitchActivated(2, 2)).toBe(true);
  });

  it('再次踩同一机关 → 关闭路障（closed）', () => {
    const grid = new Grid(createTestLevel());
    checkSwitchToggle({ x: 2, z: 2 }, grid);
    expect(grid.isSwitchActivated(2, 2)).toBe(true);
    expect(grid.isBarrier(2, 3)).toBe(false);

    const result = checkSwitchToggle({ x: 2, z: 2 }, grid);

    expect(result).not.toBeNull();
    expect(result!.newState).toBe('closed');
    expect(result!.barriersAffected).toEqual([{ x: 2, z: 3 }]);
    expect(grid.isBarrier(2, 3)).toBe(true);
    expect(grid.isFloor(2, 3)).toBe(false);
    expect(grid.isSwitchActivated(2, 2)).toBe(false);
  });

  it('第三次踩 → 再次打开（切换循环）', () => {
    const grid = new Grid(createTestLevel());
    checkSwitchToggle({ x: 2, z: 2 }, grid);
    checkSwitchToggle({ x: 2, z: 2 }, grid);
    const result = checkSwitchToggle({ x: 2, z: 2 }, grid);

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
        [0, 1, 2, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 3, 1, 3, 0],
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

    const openResult = checkSwitchToggle({ x: 2, z: 1 }, grid);
    expect(openResult!.newState).toBe('open');
    expect(openResult!.barriersAffected).toHaveLength(2);
    expect(grid.isFloor(1, 3)).toBe(true);
    expect(grid.isFloor(3, 3)).toBe(true);

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