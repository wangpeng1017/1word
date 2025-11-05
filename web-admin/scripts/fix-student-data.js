const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixStudentData() {
  try {
    console.log('🔍 检查学生数据...')
    
    // 查找所有没有关联用户的学生
    const students = await prisma.student.findMany({
      include: {
        user: true,
        class: true,
      }
    })
    
    console.log(`找到 ${students.length} 个学生记录`)
    
    for (const student of students) {
      if (!student.user) {
        console.log(`⚠️  学生 ${student.studentNo} 没有关联用户，跳过`)
        continue
      }
      
      if (!student.user.name || student.user.name === '') {
        console.log(`📝 修复学生 ${student.studentNo} 的姓名`)
        await prisma.user.update({
          where: { id: student.user.id },
          data: {
            name: `学生${student.studentNo}`
          }
        })
      } else {
        console.log(`✅ 学生 ${student.studentNo} (${student.user.name}) 数据正常`)
      }
    }
    
    // 如果没有学生，创建一个测试学生
    if (students.length === 0) {
      console.log('📝 创建测试学生...')
      const hashedPassword = await bcrypt.hash('123456', 10)
      
      await prisma.user.create({
        data: {
          name: '测试学生',
          password: hashedPassword,
          role: 'STUDENT',
          student: {
            create: {
              studentNo: '2025001',
              grade: '高一',
            }
          }
        }
      })
      
      console.log('✅ 测试学生创建成功')
    }
    
    console.log('\n✨ 学生数据修复完成！')
  } catch (error) {
    console.error('❌ 修复失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStudentData()
