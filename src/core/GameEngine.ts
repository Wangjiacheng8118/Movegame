import { Direction, GameEvents, LevelData, TransitionResult } from './types';
import { Block } from './Block';
import { Grid } from './Grid';
import { checkSwitchToggle } from './SwitchState';

/** 游戏引擎 — 连接物块状态、边界检测、机关触发、通关判定 */
export class GameEngine {
  block: Block;
  grid: Grid;
  level: LevelData;
  moveCount: number;
  isAnimating: boolean;
  events: GameEvents;

  constructor(level: LevelData, events: GameEvents) {
    this.level = level;
    this.grid = new Grid(level);
    this.block = new Block({
      orientation: level.startOrientation,
      anchor: level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events = events;
  }

  /** 尝试翻滚：先计算结果，验证合法性，再应用 */
  tryMove(dir: Direction): TransitionResult | null {
    if (this.isAnimating) return null;

    const result = this.block.computeTransition(dir);
    const cells = Array.from(result.occupiedCells);

    // 边界检测：所有占格必须是路径格子
    if (!this.grid.areAllFloor(cells)) {
      this.events.onMoveRejected(dir);
      return null;
    }

    const prev = { ...this.block.state };
    this.block.applyTransition(result);
    this.moveCount++;

    // 立即锁定，防止动画期间接受新输入
    this.isAnimating = true;

    this.events.onBlockMove(prev, this.block.state, result, dir);

    // 机关触发检测：只有Standing状态能踩机关（切换模式）
    if (this.block.isStanding()) {
      const switchResult = checkSwitchToggle(this.block.state.anchor, this.grid);
      if (switchResult) {
        this.events.onSwitchToggled(
          switchResult.switchCell,
          switchResult.barriersAffected,
          switchResult.newState
        );
      }
    }

    // 通关检测
    if (this.checkWin()) {
      this.events.onLevelComplete();
    }

    return result;
  }

  /** 通关判定：物块站立且锚点等于终点 */
  checkWin(): boolean {
    return (
      this.block.isStanding() &&
      this.block.state.anchor.x === this.level.goal.x &&
      this.block.state.anchor.z === this.level.goal.z
    );
  }

  /** 重置关卡 */
  reset(): void {
    this.grid = new Grid(this.level);
    this.block = new Block({
      orientation: this.level.startOrientation,
      anchor: this.level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events.onReset();
  }

  /** 加载新关卡 */
  loadLevel(level: LevelData): void {
    this.level = level;
    this.grid = new Grid(level);
    this.block = new Block({
      orientation: level.startOrientation,
      anchor: level.start,
    });
    this.moveCount = 0;
    this.isAnimating = false;
    this.events.onLevelLoad(level);
  }

  /** 设置动画状态 */
  setAnimating(value: boolean): void {
    this.isAnimating = value;
  }
}
