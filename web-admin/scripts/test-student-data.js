const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testStudentData() {
  try {
    console.log('🔍 查询学生数据...\n')
    
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
    })
    
    console.log(`找到 ${students.length} 个学生:\n`)
    
    students.forEach((student, index) => {
      console.log(`学生 ${index + 1}:`)
      console.log(`  ID: ${student.id}`)
      console.log(`  学号: ${student.studentNo}`)
      console.log(`  年级: ${student.grade || '未设置'}`)
      console.log(`  班级: ${student.class?.name || '未分配'}`)
      console.log(`  用户信息:`)
      console.log(`    姓名: ${student.user?.name || '未设置'}`)
      console.log(`    邮箱: ${student.user?.email || '未设置'}`)
      console.log(`    电话: ${student.user?.phone || '未设置'}`)
      console.log(`    激活: ${student.user?.isActive ? '是' : '否'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ 查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStudentData()
