// 等级定义（递增式）
export const LEVEL_DEFINITIONS = [
  { level: 1, minPoints: 0, name: '初学者' },
  { level: 2, minPoints: 100, name: '入门学徒' },
  { level: 3, minPoints: 300, name: '勤奋学员' },
  { level: 4, minPoints: 600, name: '进阶达人' },
  { level: 5, minPoints: 1000, name: '词汇能手' },
  { level: 6, minPoints: 1500, name: '学习精英' },
  { level: 7, minPoints: 2100, name: '词汇大师' },
  { level: 8, minPoints: 2800, name: '语言专家' },
  { level: 9, minPoints: 3600, name: '词汇宗师' },
  { level: 10, minPoints: 4500, name: '传奇学霸' }
] as const

export type LevelDefinition = typeof LEVEL_DEFINITIONS[number]

// 根据积分计算等级
export function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_DEFINITIONS[i].minPoints) {
      return LEVEL_DEFINITIONS[i].level
    }
  }
  return 1
}

// 获取等级信息
export function getLevelInfo(totalPoints: number): LevelDefinition {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_DEFINITIONS[i].minPoints) {
      return LEVEL_DEFINITIONS[i]
    }
  }
  return LEVEL_DEFINITIONS[0]
}
