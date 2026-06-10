import * as THREE from 'three';
import { Orientation, BlockState, Direction } from '../core/types';

/** 物块尺寸常量 */
const BLOCK_LEN = 1.9;   // 长边（2格 - 0.1间隙）
const BLOCK_SHORT = 0.9; // 短边（1格 - 0.1间隙）

/** 翻滚动画 — 用 pivot + attach 实现真实的支点旋转 */
export class BlockRenderer {
  group: THREE.Group;
  private mesh: THREE.Mesh;
  private anim: {
    startTime: number;
    duration: number;
    pivot: THREE.Object3D;
    axis: 'x' | 'z';
    targetAngle: number;
    toState: BlockState;
    onComplete: (() => void) | null;
  } | null = null;

  constructor() {
    this.group = new THREE.Group();

    // 统一几何体：1.9×0.9×0.9，默认长轴沿X（LyingX形态）
    const geo = new THREE.BoxGeometry(BLOCK_LEN, BLOCK_SHORT, BLOCK_SHORT);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3388dd });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);
  }

  /** 设置物块状态（无动画） */
  snapToState(state: BlockState): void {
    this.anim = null;
    const { orientation, anchor } = state;
    const { x, z } = anchor;

    this.mesh.rotation.set(0, 0, 0);

    switch (orientation) {
      case Orientation.Standing:
        // 绕Z轴旋转90度：长轴从X转到Y（竖立），高1.9
        // 底面贴地(y=0)，中心在 y=BLOCK_LEN/2=0.95
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.position.set(x + 0.5, BLOCK_LEN / 2, z + 0.5);
        break;
      case Orientation.LyingX:
        // 默认形态：长轴沿X，高0.9
        // 底面贴地(y=0)，中心在 y=BLOCK_SHORT/2=0.45
        this.mesh.position.set(x + 1, BLOCK_SHORT / 2, z + 0.5);
        break;
      case Orientation.LyingZ:
        // 绕Y轴旋转90度：长轴从X转到Z，高0.9
        // 底面贴地(y=0)，中心在 y=BLOCK_SHORT/2=0.45
        this.mesh.rotation.y = Math.PI / 2;
        this.mesh.position.set(x + 0.5, BLOCK_SHORT / 2, z + 1);
        break;
    }
  }

  /** 播放翻滚动画 */
  animateRoll(
    from: BlockState,
    dir: Direction,
    to: BlockState,
    duration: number,
    onComplete: () => void
  ): void {
    // 如果有正在进行的动画，立即完成它
    this.finishCurrentAnim();

    // 设置到初始状态
    this.snapToState(from);

    // 计算翻滚支点（物块底面的翻滚边缘）
    const pivotInfo = this.computePivot(from, dir);

    // 创建临时 pivot 对象
    const pivot = new THREE.Object3D();
    pivot.position.copy(pivotInfo.pivotPos);
    this.group.add(pivot);

    // 将 mesh 附加到 pivot（Three.js 保持世界变换不变）
    pivot.attach(this.mesh);

    this.anim = {
      startTime: performance.now(),
      duration,
      pivot,
      axis: pivotInfo.axis,
      targetAngle: pivotInfo.angle,
      toState: to,
      onComplete,
    };
  }

  /** 立即完成当前动画（防重入安全） */
  private finishCurrentAnim(): void {
    if (!this.anim) return;

    const { toState, onComplete, pivot } = this.anim;

    // 将 mesh 移回 group
    this.group.attach(this.mesh);
    pivot.removeFromParent();

    this.anim = null;
    this.snapToState(toState);

    if (onComplete) onComplete();
  }

  /** 每帧更新 */
  update(): void {
    if (!this.anim) return;

    const elapsed = performance.now() - this.anim.startTime;
    let t = Math.min(elapsed / this.anim.duration, 1);
    // 缓出效果
    t = 1 - Math.pow(1 - t, 3);

    // 旋转 pivot 到当前角度
    const currentAngle = this.anim.targetAngle * t;
    this.anim.pivot.rotation.set(0, 0, 0);
    if (this.anim.axis === 'z') {
      this.anim.pivot.rotation.z = currentAngle;
    } else {
      this.anim.pivot.rotation.x = currentAngle;
    }

    // 动画结束
    if (t >= 1) {
      const { toState, onComplete } = this.anim;

      // 将 mesh 移回 group（Three.js 保持世界变换）
      this.group.attach(this.mesh);
      // 移除临时 pivot
      this.anim.pivot.removeFromParent();

      this.anim = null;

      // 精确 snap 到目标状态（消除间隙导致的微小偏差）
      this.snapToState(toState);

      if (onComplete) onComplete();
    }
  }

  /** 计算翻滚支点位置和旋转参数 */
  private computePivot(
    state: BlockState,
    dir: Direction
  ): { pivotPos: THREE.Vector3; axis: 'x' | 'z'; angle: number } {
    // 计算物块底面几何信息
    const face = this.getBottomFace(state);
    const halfX = face.halfWidthX;
    const halfZ = face.halfWidthZ;

    // 翻滚方向 → 支点是底面对应边缘
    switch (dir) {
      case Direction.East:
        // 绕底面+X边缘，向+X翻倒 → 绕Z轴 -PI/2
        return {
          pivotPos: new THREE.Vector3(face.cx + halfX, 0, face.cz),
          axis: 'z',
          angle: -Math.PI / 2,
        };
      case Direction.West:
        // 绕底面-X边缘，向-X翻倒 → 绕Z轴 +PI/2
        return {
          pivotPos: new THREE.Vector3(face.cx - halfX, 0, face.cz),
          axis: 'z',
          angle: Math.PI / 2,
        };
      case Direction.South:
        // 绕底面+Z边缘，向+Z翻倒 → 绕X轴 +PI/2
        return {
          pivotPos: new THREE.Vector3(face.cx, 0, face.cz + halfZ),
          axis: 'x',
          angle: Math.PI / 2,
        };
      case Direction.North:
        // 绕底面-Z边缘，向-Z翻倒 → 绕X轴 -PI/2
        return {
          pivotPos: new THREE.Vector3(face.cx, 0, face.cz - halfZ),
          axis: 'x',
          angle: -Math.PI / 2,
        };
    }
  }

  /** 获取物块底面几何信息 */
  private getBottomFace(state: BlockState): {
    cx: number; cz: number;
    halfWidthX: number; halfWidthZ: number;
  } {
    const { orientation, anchor } = state;
    const { x, z } = anchor;

    switch (orientation) {
      case Orientation.Standing:
        // 竖立底面：0.9×0.9 正方形
        return {
          cx: x + 0.5,
          cz: z + 0.5,
          halfWidthX: BLOCK_SHORT / 2,
          halfWidthZ: BLOCK_SHORT / 2,
        };
      case Orientation.LyingX:
        // 横躺X底面：1.9×0.9 矩形
        return {
          cx: x + 1,
          cz: z + 0.5,
          halfWidthX: BLOCK_LEN / 2,
          halfWidthZ: BLOCK_SHORT / 2,
        };
      case Orientation.LyingZ:
        // 横躺Z底面：0.9×1.9 矩形
        return {
          cx: x + 0.5,
          cz: z + 1,
          halfWidthX: BLOCK_SHORT / 2,
          halfWidthZ: BLOCK_LEN / 2,
        };
    }
  }
}