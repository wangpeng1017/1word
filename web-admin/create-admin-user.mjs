import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: 'admin@vocab.com',
        password: '$2a$10$ethKLi2/YH0kcONK8KS1Y.EmTPiFi4ee9n34wUOG9znlmuYnj2aiK',
        name: '管理员',
        role: 'TEACHER',
        isActive: true,
      },
    })

    console.log('✅ 用户创建成功:', user.id)

    // 创建教师记录
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        school: '默认学校',
        subject: '英语',
      },
    })

    console.log('✅ 教师记录创建成功:', teacher.id)

    // 创建默认班级
    const defaultClass = await prisma.class.create({
      data: {
        name: '未分配班级',
        grade: '待分配',
        teacherId: teacher.id,
        isActive: true,
      },
    })

    console.log('✅ 默认班级创建成功:', defaultClass.id)

    console.log('\n🎉 管理员账号创建完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 邮箱: admin@vocab.com')
    console.log('🔑 密码: admin123456')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n现在可以登录了: http://localhost:3000/login')
  } catch (error) {
    console.error('❌ 创建失败:', error.message)
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
