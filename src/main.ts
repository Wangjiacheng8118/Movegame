import './style.css';
import { GameEngine } from './core/GameEngine';
import { GameView } from './render/GameView';
import { InputManager } from './input/InputManager';
import { HUD } from './ui/HUD';
import { LevelSelect } from './ui/LevelSelect';
import { LEVELS } from './data/levels';
import { Direction, BlockState, TransitionResult, LevelData } from './core/types';

const appEl = document.getElementById('app')!;
const hudEl = document.getElementById('hud')!;

// 当前关卡索引
let currentLevelIndex = 0;

// HUD
const hud = new HUD(hudEl);

// 游戏引擎（初始加载第1关，但被选关界面覆盖）
const engine = new GameEngine(LEVELS[currentLevelIndex], {
  onBlockMove(prev: BlockState, next: BlockState, result: TransitionResult, dir: Direction) {
    hud.updateMoveCount(engine.moveCount);
    gameView.playRollAnimation(dir, result.animation.duration, prev, next, () => {
      engine.setAnimating(false);
    });
  },
  onMoveRejected(_dir: Direction) {
    // 碰撞反馈
  },
  onLevelComplete() {
    hud.showWin(currentLevelIndex < LEVELS.length - 1);
  },
  onReset() {
    hud.updateMoveCount(0);
    hud.hideWin();
    gameView.loadLevel(engine.grid, engine.level);
    gameView.snapToState(engine.block.state);
  },
  onLevelLoad(level: LevelData) {
    currentLevelIndex = LEVELS.findIndex((l) => l.id === level.id);
    hud.setLevelName(`第${currentLevelIndex + 1}关 — ${level.name}`);
    hud.updateMoveCount(0);
    hud.hideWin();
    gameView.loadLevel(engine.grid, level);
    gameView.snapToState(engine.block.state);
  },
  onSwitchToggled(switchCell, barriersAffected, newState) {
    if (newState === 'open') {
      gameView.setSwitchState(switchCell.x, switchCell.z, 'activated');
      for (const b of barriersAffected) {
        gameView.removeBarrier(b.x, b.z);
      }
    } else {
      gameView.setSwitchState(switchCell.x, switchCell.z, 'deactivated');
      for (const b of barriersAffected) {
        gameView.addBarrier(b.x, b.z);
      }
    }
  },
});

// 渲染
const gameView = new GameView(appEl, engine.grid, engine.level);
gameView.snapToState(engine.block.state);
gameView.startLoop();

// 输入
new InputManager(appEl, (dir: Direction) => {
  engine.tryMove(dir);
});

// 关卡选择界面
const levelSelect = new LevelSelect(LEVELS, (index: number) => {
  currentLevelIndex = index;
  engine.loadLevel(LEVELS[index]);
  hud.setLevelName(`第${index + 1}关 — ${LEVELS[index].name}`);
  gameView.snapToState(engine.block.state);
});

// 游戏启动时显示关卡选择
levelSelect.show();

// 重置
hud.setResetCallback(() => engine.reset());

// 下一关
hud.setNextLevelCallback(() => {
  if (currentLevelIndex < LEVELS.length - 1) {
    currentLevelIndex++;
    engine.loadLevel(LEVELS[currentLevelIndex]);
  }
});

// 返回选关
hud.setSelectLevelCallback(() => {
  levelSelect.show();
});