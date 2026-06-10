import { Direction } from '../core/types';

/** 触摸输入：滑动方向识别 */
export class TouchInput {
  private startX = 0;
  private startY = 0;
  private minSwipeDist = 30;

  constructor(target: HTMLElement, onDirection: (dir: Direction) => void) {
    target.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      this.startX = t.clientX;
      this.startY = t.clientY;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - this.startX;
      const dy = t.clientY - this.startY;

      if (Math.abs(dx) < this.minSwipeDist && Math.abs(dy) < this.minSwipeDist) return;

      // 滑动方向映射：屏幕右→游戏东，屏幕上→游戏北
      if (Math.abs(dx) > Math.abs(dy)) {
        onDirection(dx > 0 ? Direction.East : Direction.West);
      } else {
        onDirection(dy < 0 ? Direction.North : Direction.South);
      }
      e.preventDefault();
    }, { passive: false });
  }
}