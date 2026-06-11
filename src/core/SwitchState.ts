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
  if (!grid.isSwitch(anchor.x, anchor.z)) {
    return null;
  }

  const sw = grid.getSwitch(anchor.x, anchor.z);
  if (!sw) return null;

  const activated = grid.toggleSwitch(anchor.x, anchor.z);
  if (activated === undefined) return null;

  const newState = activated ? 'open' : 'closed';
  const barriersAffected: Cell[] = [];

  for (const barrier of sw.barriers) {
    if (newState === 'open') {
      if (grid.removeBarrier(barrier.x, barrier.z)) {
        barriersAffected.push(barrier);
      }
    } else {
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