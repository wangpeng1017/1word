// scripts/init-achievements.js
// 初始化预设成就数据

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 精简后的成就列表（10个）
const achievements = [
  // 学习类成就（2个）
  {
    name: '初学者',
    description: '完成第一次学习',
    icon: '🎓',
    type: 'study',
    condition: { totalWords: 1 },
    points: 10
  },
  {
    name: '学习达人',
    description: '累计学习500个单词',
    icon: '📖',
    type: 'study',
    condition: { totalWords: 500 },
    points: 200
  },

  // 测试类成就（2个）
  {
    name: '测试新手',
    description: '完成第一次测试',
    icon: '📝',
    type: 'test',
    condition: { totalTests: 1 },
    points: 20
  },
  {
    name: '考试专家',
    description: '完成10次测试',
    icon: '📊',
    type: 'test',
    condition: { totalTests: 10 },
    points: 100
  },

  // 连续学习类成就（3个）
  {
    name: '坚持三天',
    description: '连续学习3天',
    icon: '🔥',
    type: 'streak',
    condition: { days: 3 },
    points: 20
  },
  {
    name: '坚持一周',
    description: '连续学习7天',
    icon: '⭐',
    type: 'streak',
    condition: { days: 7 },
    points: 70
  },
  {
    name: '月度冠军',
    description: '连续学习30天',
    icon: '🏅',
    type: 'streak',
    condition: { days: 30 },
    points: 300
  },

  // 掌握类成就（3个）
  {
    name: '词汇新星',
    description: '掌握10个单词',
    icon: '⭐',
    type: 'mastery',
    condition: { masteredWords: 10 },
    points: 30
  },
  {
    name: '词汇大师',
    description: '掌握100个单词',
    icon: '🎖️',
    type: 'mastery',
    condition: { masteredWords: 100 },
    points: 200
  },
  {
    name: '词汇宗师',
    description: '掌握500个单词',
    icon: '👑',
    type: 'mastery',
    condition: { masteredWords: 500 },
    points: 1000
  }
]

// 需要停用的成就名称（原有但不再使用）
const achievementsToDeactivate = [
  '勤奋学习',
  '学霸',
  '完美主义者',
  '考试达人',
  '满分王者',
  '优秀学生',
  '坚持一天',
  '坚持半月',
  '词汇能手',
  '词汇专家'
]

async function main() {
  console.log('开始初始化成就数据...')

  let createdCount = 0
  let skippedCount = 0
  let deactivatedCount = 0

  // 1. 停用不再使用的成就
  console.log('\n--- 停用旧成就 ---')
  for (const name of achievementsToDeactivate) {
    try {
      const result = await prisma.achievements.updateMany({
        where: { name, isActive: true },
        data: { isActive: false, updatedAt: new Date() }
      })
      if (result.count > 0) {
        console.log(`🔒 已停用成就: ${name}`)
        deactivatedCount++
      }
    } catch (error) {
      console.error(`❌ 停用成就失败: ${name}`, error.message)
    }
  }

  // 2. 创建或更新保留的成就
  console.log('\n--- 创建/更新成就 ---')
  for (const achievement of achievements) {
    try {
      // 检查是否已存在同名成就
      const existing = await prisma.achievements.findFirst({
        where: { name: achievement.name }
      })

      if (existing) {
        // 确保已存在的成就是激活状态
        if (!existing.isActive) {
          await prisma.achievements.update({
            where: { id: existing.id },
            data: { isActive: true, updatedAt: new Date() }
          })
          console.log(`🔓 重新激活成就: ${achievement.name}`)
        } else {
          console.log(`⏭️  跳过已存在的成就: ${achievement.name}`)
        }
        skippedCount++
        continue
      }

      // 创建成就
      const achievementId = `ach_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      await prisma.achievements.create({
        data: {
          id: achievementId,
          ...achievement,
          updatedAt: new Date()
        }
      })

      console.log(`✅ 创建成就: ${achievement.icon} ${achievement.name} (+${achievement.points}积分)`)
      createdCount++

      // 避免ID冲突，稍微延迟
      await new Promise(resolve => setTimeout(resolve, 10))
    } catch (error) {
      console.error(`❌ 创建成就失败: ${achievement.name}`, error.message)
    }
  }

  console.log('\n初始化完成！')
  console.log(`✅ 成功创建: ${createdCount} 个成就`)
  console.log(`⏭️  跳过已存在: ${skippedCount} 个成就`)
  console.log(`🔒 已停用: ${deactivatedCount} 个成就`)
  console.log(`📊 当前活跃成就: ${achievements.length} 个`)
}

main()
  .catch((error) => {
    console.error('初始化失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
