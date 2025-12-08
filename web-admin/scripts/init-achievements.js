// scripts/init-achievements.js
// 初始化预设成就数据

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const achievements = [
  // 学习类成就
  {
    name: '初学者',
    description: '完成第一次学习',
    icon: '🎓',
    type: 'study',
    condition: { totalWords: 1 },
    points: 10
  },
  {
    name: '勤奋学习',
    description: '累计学习100个单词',
    icon: '📚',
    type: 'study',
    condition: { totalWords: 100 },
    points: 50
  },
  {
    name: '学习达人',
    description: '累计学习500个单词',
    icon: '📖',
    type: 'study',
    condition: { totalWords: 500 },
    points: 200
  },
  {
    name: '学霸',
    description: '学习正确率达到90%',
    icon: '🌟',
    type: 'study',
    condition: { totalWords: 10, accuracy: 0.9 },
    points: 100
  },
  {
    name: '完美主义者',
    description: '学习正确率达到95%',
    icon: '💯',
    type: 'study',
    condition: { totalWords: 20, accuracy: 0.95 },
    points: 150
  },

  // 测试类成就
  {
    name: '测试新手',
    description: '完成第一次测试',
    icon: '📝',
    type: 'test',
    condition: { totalTests: 1 },
    points: 20
  },
  {
    name: '考试达人',
    description: '测试通过率达到80%',
    icon: '🎯',
    type: 'test',
    condition: { totalTests: 5, passRate: 0.8 },
    points: 80
  },
  {
    name: '考试专家',
    description: '完成10次测试',
    icon: '📊',
    type: 'test',
    condition: { totalTests: 10 },
    points: 100
  },
  {
    name: '满分王者',
    description: '获得一次满分',
    icon: '👑',
    type: 'test',
    condition: { minScore: 100 },
    points: 150
  },
  {
    name: '优秀学生',
    description: '测试平均分达到90分',
    icon: '🏆',
    type: 'test',
    condition: { totalTests: 5, minScore: 90 },
    points: 120
  },

  // 连续学习类成就
  {
    name: '坚持一天',
    description: '连续学习1天',
    icon: '📅',
    type: 'streak',
    condition: { days: 1 },
    points: 5
  },
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
    name: '坚持半月',
    description: '连续学习15天',
    icon: '🌙',
    type: 'streak',
    condition: { days: 15 },
    points: 150
  },
  {
    name: '月度冠军',
    description: '连续学习30天',
    icon: '🏅',
    type: 'streak',
    condition: { days: 30 },
    points: 300
  },

  // 掌握类成就
  {
    name: '词汇新星',
    description: '掌握10个单词',
    icon: '⭐',
    type: 'mastery',
    condition: { masteredWords: 10 },
    points: 30
  },
  {
    name: '词汇能手',
    description: '掌握50个单词',
    icon: '💪',
    type: 'mastery',
    condition: { masteredWords: 50 },
    points: 100
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
    name: '词汇专家',
    description: '掌握300个单词',
    icon: '🌟',
    type: 'mastery',
    condition: { masteredWords: 300 },
    points: 500
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

async function main() {
  console.log('开始初始化成就数据...')

  let createdCount = 0
  let skippedCount = 0

  for (const achievement of achievements) {
    try {
      // 检查是否已存在同名成就
      const existing = await prisma.achievements.findFirst({
        where: { name: achievement.name }
      })

      if (existing) {
        console.log(`⏭️  跳过已存在的成就: ${achievement.name}`)
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
  console.log(`📊 总计: ${achievements.length} 个成就`)
}

main()
  .catch((error) => {
    console.error('初始化失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
