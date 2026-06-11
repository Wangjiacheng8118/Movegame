/** 四个翻滚方向 */
export enum Direction {
  North = 'north', // -Z 方向
  South = 'south', // +Z 方向
  East = 'east',   // +X 方向
  West = 'west',   // -X 方向
}

/** 物块朝向：决定占格方式 */
export enum Orientation {
  Standing = 'standing', // 竖立，占1格，高2单位
  LyingX = 'lying_x',   // 横躺沿X轴，占2格 (x,x+1)，高1单位
  LyingZ = 'lying_z',   // 横躺沿Z轴，占2格 (z,z+1)，高1单位
}

/** 网格坐标（整数） */
export interface Cell {
  x: number;
  z: number;
}

/** 物块完整状态 */
export interface BlockState {
  orientation: Orientation;
  /** 锚点格子：
   *  Standing: 锚点即唯一占格
   *  LyingX: 锚点为 x 较小的格，另一格为 (x+1, z)
   *  LyingZ: 锚点为 z 较小的格，另一格为 (x, z+1)
   */
  anchor: Cell;
}

/** 物块占用的所有格子（1或2个） */
export type OccupiedCells = [Cell] | [Cell, Cell];

/** 关卡数据 */
export interface LevelData {
  id: string;
  name: string;
  /** 地图宽度（X方向格子数） */
  width: number;
  /** 地图高度（Z方向格子数） */
  height: number;
  /** 二维数组：0=空, 1=地板, 2=机关格, 3=路障格 */
  floorMap: number[][];
  /** 起点位置 */
  start: Cell;
  /** 起点朝向 */
  startOrientation: Orientation;
  /** 终点位置（需站立到达） */
  goal: Cell;
  /** 机关列表（可选，向后兼容旧关卡） */
  switches?: SwitchDef[];
}

/** 翻滚转换结果 */
export interface TransitionResult {
  newState: BlockState;
  occupiedCells: OccupiedCells;
  /** 动画参数（供渲染层使用） */
  animation: RollAnimation;
}

/** 翻滚动画参数（渲染层自己根据方向计算几何参数） */
export interface RollAnimation {
  /** 动画时长（毫秒） */
  duration: number;
  /** 翻滚方向（渲染层用于计算支点位置） */
  direction: Direction;
}

/** 机关定义：物块站立压上去时触发，移除关联路障 */
export interface SwitchDef {
  /** 机关格子位置（必须在 floorMap 中标记为 2） */
  cell: Cell;
  /** 该机关控制的路障格子列表（必须在 floorMap 中标记为 3） */
  barriers: Cell[];
}

/** 游戏引擎事件 */
export interface GameEvents {
  onBlockMove: (prev: BlockState, next: BlockState, result: TransitionResult, dir: Direction) => void;
  onMoveRejected: (dir: Direction) => void;
  onLevelComplete: () => void;
  onReset: () => void;
  onLevelLoad: (level: LevelData) => void;
  onSwitchTriggered: (switchCell: Cell, removedBarriers: Cell[]) => void;
}