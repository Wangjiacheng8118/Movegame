import { Direction } from '../core/types';

/** 键盘输入：WASD / 方向键 */
export class KeyboardInput {
  constructor(onDirection: (dir: Direction) => void) {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          onDirection(Direction.North);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          onDirection(Direction.South);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onDirection(Direction.West);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          onDirection(Direction.East);
          break;
        default:
          return; // 不阻止其他按键
      }
      e.preventDefault();
    });
  }
}