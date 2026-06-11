import { Direction } from '../core/types';
import { resolveSwipeDirection } from '../core/SwipeMapping';

/**
 * 触摸输入
 * 1. 滑动：在屏幕空白区域滑动控制方向（等距视角适配）
 * 2. 虚拟方向键：屏幕左下角菱形布局，对齐等距网格方向
 */
export class TouchInput {
  private startX = 0;
  private startY = 0;
  private minSwipeDist = 50;
  private isDetectMobile: boolean;
  private directionIndicator: HTMLElement | null = null;

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

      // 使用纯函数解析滑动方向（等距逆投影 + 死区过滤）
      const dir = resolveSwipeDirection(dx, dy, this.minSwipeDist);
      if (dir) {
        onDirection(dir);
        this.showDirectionIndicator(dir);
      }
      e.preventDefault();
    }, { passive: false });

    // 虚拟方向键（仅移动端显示）
    if (this.isDetectMobile) {
      this.createDpad(onDirection);
    }
  }

  /** 显示滑动方向指示器 */
  private showDirectionIndicator(dir: Direction): void {
    // 移除旧的指示器
    if (this.directionIndicator) {
      this.directionIndicator.remove();
    }

    const arrowMap: Record<Direction, string> = {
      [Direction.North]: '↗',
      [Direction.South]: '↙',
      [Direction.East]: '↘',
      [Direction.West]: '↖',
    };

    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';
    indicator.textContent = arrowMap[dir];
    document.body.appendChild(indicator);
    this.directionIndicator = indicator;

    // 300ms后自动移除
    setTimeout(() => {
      indicator.remove();
      if (this.directionIndicator === indicator) {
        this.directionIndicator = null;
      }
    }, 300);
  }

  /** 创建菱形虚拟方向键（对齐等距网格方向） */
  private createDpad(onDirection: (dir: Direction) => void): void {
    const dpad = document.createElement('div');
    dpad.className = 'dpad';
    // 菱形布局：↗=North, ↙=South, ↘=East, ↖=West
    // 对齐等距视角：North在屏幕右上，South在屏幕左下，East在屏幕右下，West在屏幕左上
    dpad.innerHTML = `
      <button class="dpad-btn dpad-north" data-dir="N">↗</button>
      <button class="dpad-btn dpad-west" data-dir="W">↖</button>
      <button class="dpad-btn dpad-east" data-dir="E">↘</button>
      <button class="dpad-btn dpad-south" data-dir="S">↙</button>
    `;

    const dirMap: Record<string, Direction> = {
      N: Direction.North, S: Direction.South,
      E: Direction.East, W: Direction.West,
    };

    dpad.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = (btn as HTMLElement).dataset.dir!;
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