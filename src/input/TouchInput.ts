import { Direction } from '../core/types';

/**
 * 触摸输入
 * 1. 滑动：在屏幕空白区域滑动控制方向（等距视角适配）
 * 2. 虚拟方向键：屏幕右下角显示方向按钮
 */
export class TouchInput {
  private startX = 0;
  private startY = 0;
  private minSwipeDist = 30;
  private isDetectMobile: boolean;

  constructor(target: HTMLElement, onDirection: (dir: Direction) => void) {
    this.isDetectMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 滑动输入
    target.addEventListener('touchstart', (e) => {
      // 忽略虚拟按键区域的触摸
      if ((e.target as HTMLElement).closest('.dpad')) return;
      const t = e.touches[0];
      this.startX = t.clientX;
      this.startY = t.clientY;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if ((e.target as HTMLElement).closest('.dpad')) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.startX;
      const dy = t.clientY - this.startY;

      if (Math.abs(dx) < this.minSwipeDist && Math.abs(dy) < this.minSwipeDist) return;

      // 等距视角方向适配：
      // 屏幕右上方 → 游戏东(+X)
      // 屏幕左下方 → 游戏西(-X)
      // 屏幕右下方 → 游戏南(+Z)
      // 屏幕左上方 → 游戏北(-Z)
      // 等距45度旋转：dx' = dx+dy, dy' = -dx+dy
      const isoX = dx + dy;
      const isoY = -dx + dy;

      if (Math.abs(isoX) > Math.abs(isoY)) {
        onDirection(isoX > 0 ? Direction.South : Direction.North);
      } else {
        onDirection(isoY > 0 ? Direction.West : Direction.East);
      }
      e.preventDefault();
    }, { passive: false });

    // 虚拟方向键（仅移动端显示）
    if (this.isDetectMobile) {
      this.createDpad(onDirection);
    }
  }

  /** 创建虚拟方向键 */
  private createDpad(onDirection: (dir: Direction) => void): void {
    const dpad = document.createElement('div');
    dpad.className = 'dpad';
    dpad.innerHTML = `
      <button class="dpad-btn dpad-up" data-dir="N">▲</button>
      <button class="dpad-btn dpad-left" data-dir="W">◀</button>
      <button class="dpad-btn dpad-right" data-dir="E">▶</button>
      <button class="dpad-btn dpad-down" data-dir="S">▼</button>
    `;

    const dirMap: Record<string, Direction> = {
      N: Direction.North, S: Direction.South,
      E: Direction.East, W: Direction.West,
    };

    dpad.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = (btn as HTMLElement).dataset.dir!;
      // 同时绑定 touch 和 click（兼容）
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onDirection(dirMap[dir]);
      };
      btn.addEventListener('touchstart', handler, { passive: false });
      btn.addEventListener('mousedown', handler);
    });

    document.body.appendChild(dpad);
  }
}