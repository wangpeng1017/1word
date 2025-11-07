const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSchema() {
  try {
    // 直接查询
    const result = await prisma.$queryRaw`SELECT * FROM word_audios LIMIT 1`
    console.log('\n数据库中的实际数据:')
    console.log(JSON.stringify(result, null, 2))
    
    console.log('\n字段名:')
    if (result && result.length > 0) {
      console.log(Object.keys(result[0]))
    }
    
  } catch (error) {
    console.error('错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
