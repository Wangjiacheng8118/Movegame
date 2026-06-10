import { Direction } from '../core/types';
import { KeyboardInput } from './KeyboardInput';
import { TouchInput } from './TouchInput';

/** 统一输入管理器 */
export class InputManager {
  constructor(target: HTMLElement, onDirection: (dir: Direction) => void) {
    new KeyboardInput(onDirection);
    new TouchInput(target, onDirection);
  }
}