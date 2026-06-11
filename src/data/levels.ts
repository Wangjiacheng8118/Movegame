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

/**
 * 第9关：闸门 — 先踩机关开路，再到达终点
 * 推演：Standing(1,1)→S→LyingZ(1,2)→E→LyingZ(2,2)→N→Standing(2,1) ✅ 踩机关！
 *   →E→LyingX(3,1)→E→LyingX(4,1)→S→LyingX(4,2) 路障已开
 *   →S→LyingX(4,3) 路障已开→S→LyingX(4,4)→S→LyingX(4,5)
 *   →E→Standing(5,5) ✅ 约10步
 */
export const LEVEL_9: LevelData = {
  id: '9',
  name: '闸门',
  width: 7,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 1, 1, 1, 0],  // (2,1)=机关
    [0, 1, 1, 1, 3, 1, 0],  // (4,2)=路障
    [0, 1, 1, 1, 3, 1, 0],  // (4,3)=路障
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 5, z: 5 },
  switches: [
    {
      cell: { x: 2, z: 1 },
      barriers: [{ x: 4, z: 2 }, { x: 4, z: 3 }],
    },
  ],
};

/**
 * 第10关：双闸 — 两个机关分别控制两组路障
 * 推演：
 *   先踩机关A(2,2)：Standing(1,1)→E→LyingX(2,1)→E→LyingX(3,1)→S→LyingX(3,2)→W→Standing(2,2) ✅
 *   再踩机关B(6,2)：E→LyingX(3,2)→E→LyingX(4,2) 路障A已开→E→LyingX(5,2)
 *   →S→LyingX(5,3)→E→LyingX(6,3)→N→Standing(6,2) ✅ 踩机关B！
 *   路障B(4,5)消失→S→LyingZ(6,3)→E→LyingZ(7,3)→S→Standing(7,4) ✅ 约17步
 */
export const LEVEL_10: LevelData = {
  id: '10',
  name: '双闸',
  width: 9,
  height: 7,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,1)=路障A
    [0, 1, 2, 1, 3, 1, 2, 1, 0],  // (2,2)=机关A, (4,2)=路障A, (6,2)=机关B
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,3)=路障A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,5)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 4 },
  switches: [
    {
      cell: { x: 2, z: 2 },
      barriers: [{ x: 4, z: 1 }, { x: 4, z: 2 }, { x: 4, z: 3 }],
    },
    {
      cell: { x: 6, z: 2 },
      barriers: [{ x: 4, z: 5 }],
    },
  ],
};

/**
 * 第11关：回廊开路 — 踩机关打通中路捷径
 * 中路初始被路障封堵，需先踩机关A(3,3)移除路障(4,1)，
 * 再踩机关B(3,5)移除路障(4,7)，打通中路纵穿通道
 */
export const LEVEL_11: LevelData = {
  id: '11',
  name: '回廊开路',
  width: 9,
  height: 9,
  floorMap: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,1)=路障A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 1, 1, 0],  // (3,3)=机关A
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 1, 1, 0],  // (3,5)=机关B
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 0],  // (4,7)=路障B
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 1, z: 1 },
  startOrientation: Orientation.Standing,
  goal: { x: 7, z: 6 },
  switches: [
    {
      cell: { x: 3, z: 3 },
      barriers: [{ x: 4, z: 1 }],
    },
    {
      cell: { x: 3, z: 5 },
      barriers: [{ x: 4, z: 7 }],
    },
  ],
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
  LEVEL_9,
  LEVEL_10,
  LEVEL_11,
];