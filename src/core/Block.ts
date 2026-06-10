import { Orientation, BlockState, OccupiedCells, Direction, TransitionResult } from './types';
import { computeTransition } from './TransitionTable';

/** 物块状态类 */
export class Block {
  state: BlockState;

  constructor(initial: BlockState) {
    this.state = initial;
  }

  /** 计算当前占格 */
  getOccupiedCells(): OccupiedCells {
    const { orientation, anchor } = this.state;
    switch (orientation) {
      case Orientation.Standing:
        return [anchor];
      case Orientation.LyingX:
        return [anchor, { x: anchor.x + 1, z: anchor.z }];
      case Orientation.LyingZ:
        return [anchor, { x: anchor.x, z: anchor.z + 1 }];
    }
  }

  /** 计算指定方向的翻滚结果（纯计算，不修改状态） */
  computeTransition(dir: Direction): TransitionResult {
    return computeTransition(this.state, dir);
  }

  /** 应用翻滚（修改状态） */
  applyTransition(result: TransitionResult): void {
    this.state = result.newState;
  }

  /** 是否站立 */
  isStanding(): boolean {
    return this.state.orientation === Orientation.Standing;
  }
}