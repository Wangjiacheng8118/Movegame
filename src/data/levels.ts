import { Orientation, LevelData } from '../core/types';

/** 第1关：初试翻滚 — 宽阔矩形，熟悉操作 */
export const LEVEL_1: LevelData = {
  id: '1',
  name: '初试翻滚',
  width: 7,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 2, z: 2 },
  startOrientation: Orientation.Standing,
  goal: { x: 4, z: 4 },
};

/** 第2关：窄桥 — 单格窄路，注意躺卧方向不能越界 */
export const LEVEL_2: LevelData = {
  id: '2',
  name: '窄桥',
  width: 9,
  height: 5,
  floorMap: [
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
  ],
  start: { x: 3, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 3, z: 4 },
};

/** 第3关：L形弯道 — 拐角直角转弯 */
export const LEVEL_3: LevelData = {
  id: '3',
  name: 'L形弯道',
  width: 6,
  height: 9,
  floorMap: [
    [0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 4, z: 7 },
};

/**
 * 第4关：十字路口 — 2格宽竖臂确保物块能转向
 * 推演：Standing(4,0)→S→LyingZ(4,1)→S→Standing(4,3)→W→LyingX(2,3)→W→Standing(1,3) ✅
 */
export const LEVEL_4: LevelData = {
  id: '4',
  name: '十字路口',
  width: 11,
  height: 6,
  floorMap: [
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 4, z: 0 },
  startOrientation: Orientation.Standing,
  goal: { x: 1, z: 3 },
};

/** 第5关：T形路 — 到达横臂左端 */
export const LEVEL_5: LevelData = {
  id: '5',
  name: 'T形路',
  width: 7,
  height: 6,
  floorMap: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 3, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 0, z: 4 },
};

/**
 * 第6关：蛇形道 — 右侧竖柱2格宽，物块能通过
 * 推演：9步 E>E>E>S>S>S>W>W>W ✅
 */
export const LEVEL_6: LevelData = {
  id: '6',
  name: '蛇形道',
  width: 7,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 1, z: 4 },
};

/**
 * 第7关：断桥 — 3段宽区+2段2格窄桥
 * 推演：11步 E>E>S>S>W>W>S>E>S>E>E ✅
 */
export const LEVEL_7: LevelData = {
  id: '7',
  name: '断桥',
  width: 7,
  height: 8,
  floorMap: [
    [0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 0 },
  startOrientation: Orientation.Standing,
  goal: { x: 5, z: 6 },
};

/** 第8关：回字形 — 外圈2格宽，绕一圈到对角 */
export const LEVEL_8: LevelData = {
  id: '8',
  name: '回字形',
  width: 8,
  height: 8,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 5, z: 5 },
};

export const LEVELS: LevelData[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8,
];