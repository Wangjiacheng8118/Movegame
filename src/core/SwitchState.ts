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
