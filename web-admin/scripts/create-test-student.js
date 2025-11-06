const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestStudent() {
  try {
    console.log('开始创建测试学生账号...\n')

    // 检查学生是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: '2025001' },
          { email: '2025001@test.com' }
        ]
      },
      include: {
        student: true
      }
    })

    if (existingUser) {
      console.log('✅ 学生账号已存在:')
      console.log('  学号(phone):', existingUser.phone)
      console.log('  邮箱:', existingUser.email)
      console.log('  姓名:', existingUser.name)
      console.log('  学生ID:', existingUser.student?.id)
      
      // 更新密码为 123456
      const hashedPassword = await bcrypt.hash('123456', 10)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          password: hashedPassword,
          phone: '2025001',  // 确保phone字段正确
          isActive: true
        }
      })
      console.log('\n✅ 已更新密码为: 123456')
      return
    }

    // 创建新学生账号
    const hashedPassword = await bcrypt.hash('123456', 10)

    // 查找或创建班级
    let testClass = await prisma.class.findFirst({
      where: { name: '测试班级-高三1班' }
    })

    if (!testClass) {
      // 查找测试教师
      const teacher = await prisma.teacher.findFirst()
      if (!teacher) {
        console.error('❌ 未找到教师，请先创建教师账号')
        return
      }

      testClass = await prisma.class.create({
        data: {
          name: '测试班级-高三1班',
          grade: '高三',
          teacherId: teacher.id
        }
      })
      console.log('✅ 创建测试班级:', testClass.name)
    }

    // 创建用户和学生
    const user = await prisma.user.create({
      data: {
        name: '张三',
        email: '2025001@test.com',
        phone: '2025001',  // 学号作为phone字段
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
        student: {
          create: {
            studentNo: '2025001',
            grade: '高三',
            classId: testClass.id
          }
        }
      },
      include: {
        student: true
      }
    })

    console.log('\n✅ 成功创建测试学生:')
    console.log('  姓名:', user.name)
    console.log('  学号:', user.phone)
    console.log('  密码: 123456')
    console.log('  邮箱:', user.email)
    console.log('  班级:', testClass.name)
    console.log('  学生ID:', user.student.id)
    console.log('\n✅ 现在可以使用学号 2025001 和密码 123456 登录小程序')

  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestStudent()
