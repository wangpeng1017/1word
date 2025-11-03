// 数据库初始化脚本
// 用于在Vercel部署后初始化数据库

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建默认系统配置
  const configs = [
    {
      key: 'review_timeout_hours',
      value: '24',
      description: '复习超时时长（小时）',
    },
    {
      key: 'daily_new_words',
      value: '20',
      description: '每日新学单词数量',
    },
    {
      key: 'daily_review_limit',
      value: '50',
      description: '每日复习单词数量上限',
    },
    {
      key: 'mastery_threshold',
      value: '3',
      description: '掌握阈值（连续正确次数）',
    },
    {
      key: 'difficult_threshold',
      value: '3',
      description: '难点阈值（累计错误次数）',
    },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('✅ 系统配置创建成功')

  // 创建默认管理员账号（可选）
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vocab.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: '系统管理员',
        role: 'TEACHER',
        teacher: {
          create: {
            school: '示例学校',
          },
        },
      },
    })

    console.log('✅ 管理员账号创建成功')
    console.log(`   邮箱: ${adminEmail}`)
    console.log(`   密码: ${adminPassword}`)
  } else {
    console.log('ℹ️  管理员账号已存在')
  }

  console.log('✅ 数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
