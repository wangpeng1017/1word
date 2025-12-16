// 批量创建班级和学生数据
// 运行方式: node scripts/seed-class-students.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function main() {
  // 先获取或创建一个教师
  let teacher = await prisma.teachers.findFirst({ include: { user: true } })

  if (!teacher) {
    const teacherUser = await prisma.user.create({
      data: {
        id: generateId('user'),
        email: 'teacher@test.com',
        password: await bcrypt.hash('123456', 10),
        name: '测试教师',
        role: 'TEACHER',
        updated_at: new Date()
      }
    })
    teacher = await prisma.teachers.create({
      data: {
        id: generateId('teacher'),
        user_id: teacherUser.id,
        school: '测试学校',
        subject: '英语',
        updated_at: new Date()
      }
    })
    console.log('创建教师:', teacherUser.name)
  } else {
    console.log('使用现有教师:', teacher.user.name)
  }

  // 班级配置
  const classConfigs = [
    { name: '10天班', surname: '赵' },
    { name: '20天班', surname: '钱' },
    { name: '30天班', surname: '孙' },
    { name: '40天班', surname: '李' }
  ]

  for (const config of classConfigs) {
    // 创建班级
    const classId = generateId('class')
    const classRecord = await prisma.classes.create({
      data: {
        id: classId,
        name: config.name,
        grade: '高一',
        teacher_id: teacher.id,
        updated_at: new Date()
      }
    })
    console.log(`创建班级: ${config.name}`)

    // 创建50个学生
    for (let i = 1; i <= 50; i++) {
      const studentName = `${config.surname}${i}`
      const studentNo = `${config.name.replace('天班', '')}${String(i).padStart(3, '0')}`

      // 创建用户
      const userId = generateId('user')
      await prisma.user.create({
        data: {
          id: userId,
          phone: `138${studentNo}${String(i).padStart(4, '0')}`,
          password: await bcrypt.hash('123456', 10),
          name: studentName,
          role: 'STUDENT',
          updated_at: new Date()
        }
      })

      // 创建学生
      await prisma.students.create({
        data: {
          id: generateId('student'),
          user_id: userId,
          student_no: studentNo,
          class_id: classId,
          grade: '高一',
          updated_at: new Date()
        }
      })
    }
    console.log(`  - 创建50个学生: ${config.surname}1 ~ ${config.surname}50`)
  }

  console.log('\n数据创建完成!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
