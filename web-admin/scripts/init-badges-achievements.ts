/**
 * @file init-badges-achievements.ts
 * @desc 新东方生产环境 - 初始化成就和勋章数据
 * 运行方式: npx ts-node scripts/init-badges-achievements.ts
 */

import { PrismaClient, BadgeRarity } from '@prisma/client'

const prisma = new PrismaClient()

// 成就定义数据
const achievementsData = [
  {
    id: 'ach_first_study',
    name: '初出茅庐',
    description: '完成第一次学习',
    icon: '🌱',
    type: 'study',
    condition: { type: 'first_study' },
    points: 10,
    isActive: true,
  },
  {
    id: 'ach_study_50',
    name: '勤奋好学',
    description: '累计学习50个单词',
    icon: '📚',
    type: 'study',
    condition: { type: 'word_count', count: 50 },
    points: 50,
    isActive: true,
  },
  {
    id: 'ach_study_200',
    name: '学富五车',
    description: '累计学习200个单词',
    icon: '🎓',
    type: 'study',
    condition: { type: 'word_count', count: 200 },
    points: 200,
    isActive: true,
  },
  {
    id: 'ach_master_500',
    name: '词汇大师',
    description: '掌握500个单词',
    icon: '👑',
    type: 'mastery',
    condition: { type: 'mastered_count', count: 500 },
    points: 500,
    isActive: true,
  },
  {
    id: 'ach_streak_7',
    name: '坚持不懈',
    description: '连续7天学习',
    icon: '🔥',
    type: 'streak',
    condition: { type: 'streak_days', count: 7 },
    points: 100,
    isActive: true,
  },
  {
    id: 'ach_streak_30',
    name: '毅力可嘉',
    description: '连续30天学习',
    icon: '⚡',
    type: 'streak',
    condition: { type: 'streak_days', count: 30 },
    points: 500,
    isActive: true,
  },
  {
    id: 'ach_perfect_score',
    name: '完美表现',
    description: '单次学习正确率100%',
    icon: '💎',
    type: 'study',
    condition: { type: 'perfect_score' },
    points: 50,
    isActive: true,
  },
  {
    id: 'ach_wrong_100',
    name: '错题克星',
    description: '答对100道错题',
    icon: '🎯',
    type: 'wrong_question',
    condition: { type: 'wrong_question_correct', count: 100 },
    points: 200,
    isActive: true,
  },
  {
    id: 'ach_wrong_500',
    name: '错题终结者',
    description: '答对500道错题',
    icon: '🏆',
    type: 'wrong_question',
    condition: { type: 'wrong_question_correct', count: 500 },
    points: 1000,
    isActive: true,
  },
  {
    id: 'ach_points_5000',
    name: '积分大亨',
    description: '累计获得5000积分',
    icon: '🌟',
    type: 'points',
    condition: { type: 'total_points', count: 5000 },
    points: 0,
    isActive: true,
  },
]

// 勋章定义数据（与成就关联）
const badgesData = [
  {
    id: 'badge_bronze_newbie',
    name: '铜牌新手',
    icon: '🥉',
    description: '完成第一次学习',
    rarity: BadgeRarity.COMMON,
    achievementId: 'ach_first_study',
  },
  {
    id: 'badge_silver_apprentice',
    name: '银牌学徒',
    icon: '🥈',
    description: '累计学习50个单词',
    rarity: BadgeRarity.COMMON,
    achievementId: 'ach_study_50',
  },
  {
    id: 'badge_gold_scholar',
    name: '金牌学者',
    icon: '🥇',
    description: '累计学习200个单词',
    rarity: BadgeRarity.RARE,
    achievementId: 'ach_study_200',
  },
  {
    id: 'badge_ultimate_master',
    name: '终极大师',
    icon: '🏆',
    description: '掌握500个单词',
    rarity: BadgeRarity.LEGENDARY,
    achievementId: 'ach_master_500',
  },
  {
    id: 'badge_streak_star',
    name: '连续之星',
    icon: '🔥',
    description: '连续7天学习',
    rarity: BadgeRarity.RARE,
    achievementId: 'ach_streak_7',
  },
  {
    id: 'badge_lightning_master',
    name: '闪电学霸',
    icon: '⚡',
    description: '连续30天学习',
    rarity: BadgeRarity.EPIC,
    achievementId: 'ach_streak_30',
  },
  {
    id: 'badge_perfectionist',
    name: '完美主义者',
    icon: '💎',
    description: '单次学习正确率100%',
    rarity: BadgeRarity.RARE,
    achievementId: 'ach_perfect_score',
  },
  {
    id: 'badge_wrong_killer',
    name: '错题克星',
    icon: '📚',
    description: '答对100道错题',
    rarity: BadgeRarity.RARE,
    achievementId: 'ach_wrong_100',
  },
  {
    id: 'badge_wrong_terminator',
    name: '错题终结者',
    icon: '🎯',
    description: '答对500道错题',
    rarity: BadgeRarity.EPIC,
    achievementId: 'ach_wrong_500',
  },
  {
    id: 'badge_points_tycoon',
    name: '积分富豪',
    icon: '🌟',
    description: '累计获得5000积分',
    rarity: BadgeRarity.LEGENDARY,
    achievementId: 'ach_points_5000',
  },
]

async function main() {
  console.log('========================================')
  console.log('  新东方生产环境 - 勋章成就数据初始化')
  console.log('========================================\n')

  // 1. 创建成就
  console.log('【1/2】创建成就数据...')
  for (const achievement of achievementsData) {
    await prisma.achievements.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    })
    console.log(`  ✓ ${achievement.icon} ${achievement.name}`)
  }
  console.log(`  ✅ 成就创建完成 (${achievementsData.length}条)\n`)

  // 2. 创建勋章
  console.log('【2/2】创建勋章数据...')
  for (const badge of badgesData) {
    await prisma.badges.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge,
    })
    console.log(`  ✓ ${badge.icon} ${badge.name}`)
  }
  console.log(`  ✅ 勋章创建完成 (${badgesData.length}条)\n`)

  console.log('========================================')
  console.log('  🎉 初始化完成!')
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
