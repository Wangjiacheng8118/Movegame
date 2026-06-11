/** HUD：关卡名、步数、重置/下一关按钮、胜利提示 */
export class HUD {
  private levelNameEl: HTMLElement;
  private moveCountEl: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private winEl: HTMLElement;
  private onReset: (() => void) | null = null;
  private onNextLevel: (() => void) | null = null;
  private onSelectLevel: (() => void) | null = null;

  constructor(container: HTMLElement) {
    container.innerHTML = '';

    this.levelNameEl = document.createElement('div');
    this.levelNameEl.className = 'hud-level';
    this.levelNameEl.textContent = '';

    this.moveCountEl = document.createElement('div');
    this.moveCountEl.className = 'hud-steps';
    this.moveCountEl.textContent = '步数: 0';

    const btnRow = document.createElement('div');
    btnRow.className = 'hud-btn-row';

    this.resetBtn = document.createElement('button');
    this.resetBtn.className = 'hud-btn hud-btn-reset';
    this.resetBtn.textContent = '↺ 重置';
    this.resetBtn.addEventListener('click', () => {
      if (this.onReset) this.onReset();
    });

    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'hud-btn hud-btn-next';
    this.nextBtn.textContent = '下一关 →';
    this.nextBtn.style.display = 'none';
    this.nextBtn.addEventListener('click', () => {
      if (this.onNextLevel) this.onNextLevel();
    });

    const selectBtn = document.createElement('button');
    selectBtn.className = 'hud-btn hud-btn-select';
    selectBtn.textContent = '☰ 选关';
    selectBtn.addEventListener('click', () => {
      if (this.onSelectLevel) this.onSelectLevel();
    });

    btnRow.appendChild(this.resetBtn);
    btnRow.appendChild(selectBtn);
    btnRow.appendChild(this.nextBtn);

    this.winEl = document.createElement('div');
    this.winEl.className = 'hud-win';
    this.winEl.textContent = '🎉 通关！';

    container.appendChild(this.levelNameEl);
    container.appendChild(this.moveCountEl);
    container.appendChild(btnRow);
    container.appendChild(this.winEl);
  }

  /** 设置关卡名 */
  setLevelName(name: string): void {
    this.levelNameEl.textContent = name;
  }

  /** 更新步数 */
  updateMoveCount(count: number): void {
    this.moveCountEl.textContent = `步数: ${count}`;
  }

  /** 显示胜利 */
  showWin(hasNext: boolean): void {
    this.winEl.style.display = 'block';
    this.nextBtn.style.display = hasNext ? 'inline-block' : 'none';
  }

  /** 隐藏胜利 */
  hideWin(): void {
    this.winEl.style.display = 'none';
    this.nextBtn.style.display = 'none';
  }

  /** 设置重置回调 */
  setResetCallback(cb: () => void): void {
    this.onReset = cb;
  }

  /** 设置下一关回调 */
  setNextLevelCallback(cb: () => void): void {
    this.onNextLevel = cb;
  }

  /** 设置选关回调 */
  setSelectLevelCallback(cb: () => void): void {
    this.onSelectLevel = cb;
  }
}