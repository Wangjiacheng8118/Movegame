import * as THREE from 'three';
import { IsometricCamera } from './IsometricCamera';
import { GridRenderer } from './GridRenderer';
import { BlockRenderer } from './BlockRenderer';
import { Grid } from '../core/Grid';
import { LevelData, BlockState, Direction } from '../core/types';

/** 渲染层总协调器 */
export class GameView {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: IsometricCamera;
  private gridRenderer: GridRenderer;
  blockRenderer: BlockRenderer;
  private container: HTMLElement;

  constructor(container: HTMLElement, grid: Grid, level: LevelData) {
    this.container = container;

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 摄像机
    this.camera = new IsometricCamera(container.clientWidth, container.clientHeight);
    this.camera.adjustToGrid(level.width, level.height);

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.scene.add(ambient, directional);

    // 网格
    this.gridRenderer = new GridRenderer(grid, level);
    this.scene.add(this.gridRenderer.group);

    // 物块
    this.blockRenderer = new BlockRenderer();
    this.scene.add(this.blockRenderer.group);

    // 鼠标滚轮缩放（PC）
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.zoom(e.deltaY > 0 ? 0.1 : -0.1);
    }, { passive: false });

    // 双指捏合缩放（移动端）
    let lastPinchDist = 0;
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist > 0) {
          const delta = (dist - lastPinchDist) * 0.005;
          this.camera.zoom(-delta);
        }
        lastPinchDist = dist;
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      lastPinchDist = 0;
    }, { passive: true });

    // 窗口大小调整
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.camera.updateProjectionMatrix();
    });
  }

  /** 加载新关卡（替换网格） */
  loadLevel(grid: Grid, level: LevelData): void {
    // 移除旧网格
    this.scene.remove(this.gridRenderer.group);
    // 创建新网格
    this.gridRenderer = new GridRenderer(grid, level);
    this.scene.add(this.gridRenderer.group);
    // 调整摄像机
    this.camera.adjustToGrid(level.width, level.height);
    this.camera.resetZoom();
  }

  /** 渲染循环 */
  startLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.blockRenderer.update();
      this.renderer.render(this.scene, this.camera.camera);
    };
    animate();
  }

  /** 直接设置物块位置（无动画） */
  snapToState(state: BlockState): void {
    this.blockRenderer.snapToState(state);
  }

  /** 移除路障方块 */
  removeBarrier(x: number, z: number): void {
    this.gridRenderer.removeBarrier(x, z);
  }

  /** 恢复路障方块 */
  addBarrier(x: number, z: number): void {
    this.gridRenderer.addBarrier(x, z);
  }

  /** 切换机关标记视觉状态 */
  setSwitchState(x: number, z: number, state: 'activated' | 'deactivated'): void {
    this.gridRenderer.setSwitchState(x, z, state);
  }

  /** 播放翻滚动画 */
  playRollAnimation(
    dir: Direction,
    duration: number,
    from: BlockState,
    to: BlockState,
    onComplete: () => void
  ): void {
    this.blockRenderer.animateRoll(from, dir, to, duration, onComplete);
  }
}