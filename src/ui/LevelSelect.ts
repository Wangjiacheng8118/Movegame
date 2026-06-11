import { LevelData } from '../core/types';

/** 关卡选择界面 — 全屏覆盖层，网格显示所有关卡 */
export class LevelSelect {
  private container: HTMLElement;
  private onSelect: (levelIndex: number) => void;

  constructor(levels: LevelData[], onSelect: (levelIndex: number) => void) {
    this.onSelect = onSelect;

    this.container = document.createElement('div');
    this.container.className = 'level-select';

    const title = document.createElement('h2');
    title.className = 'level-select-title';
    title.textContent = '选择关卡';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'level-grid';

    for (let i = 0; i < levels.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-card';
      btn.dataset.index = String(i);

      const num = document.createElement('span');
      num.className = 'level-num';
      num.textContent = `${i + 1}`;

      const name = document.createElement('span');
      name.className = 'level-name';
      name.textContent = levels[i].name;

      btn.appendChild(num);
      btn.appendChild(name);

      btn.addEventListener('click', () => {
        this.hide();
        this.onSelect(i);
      });

      grid.appendChild(btn);
    }

    this.container.appendChild(grid);
    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}