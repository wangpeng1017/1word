const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const count = await p.students.count()
  console.log('学生总数:', count)

  const byClass = await p.students.groupBy({
    by: ['class_id'],
    _count: true
  })
  console.log('按班级统计:', byClass)

  const classes = await p.classes.findMany({ select: { id: true, name: true } })
  console.log('班级列表:', classes)
}

main().finally(() => p.$disconnect())
