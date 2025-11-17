/**
 * 分页性能对比测试
 * 
 * 测试场景:
 * 1. Offset分页 vs 游标分页
 * 2. 有COUNT vs 无COUNT
 * 3. 深度分页性能
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query'], // 打印SQL查询
})

async function testOffsetPagination(page, limit) {
  const skip = (page - 1) * limit
  
  const startTime = Date.now()
  
  const [questions, total] = await Promise.all([
    prisma.questions.findMany({
      where: { id: { startsWith: 'q_test_' } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
        question_options: {
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.questions.count({
      where: { id: { startsWith: 'q_test_' } },
    }),
  ])
  
  const duration = Date.now() - startTime
  
  return {
    method: 'Offset分页',
    page,
    limit,
    count: questions.length,
    total,
    duration,
  }
}

async function testCursorPagination(cursor, limit) {
  const startTime = Date.now()
  
  const cursorCondition = cursor ? {
    cursor: { id: cursor },
    skip: 1,
  } : {}
  
  const questions = await prisma.questions.findMany({
    where: { id: { startsWith: 'q_test_' } },
    ...cursorCondition,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      content: true,
      sentence: true,
      audioUrl: true,
      correctAnswer: true,
      createdAt: true,
      updatedAt: true,
      vocabularyId: true,
      vocabularies: {
        select: {
          word: true,
          primary_meaning: true,
        },
      },
      question_options: {
        select: {
          id: true,
          content: true,
          isCorrect: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  
  const duration = Date.now() - startTime
  const nextCursor = questions.length === limit ? questions[questions.length - 1].id : null
  
  return {
    method: '游标分页',
    cursor: cursor || 'null',
    limit,
    count: questions.length,
    nextCursor,
    duration,
  }
}

async function testWithoutCount(page, limit) {
  const skip = (page - 1) * limit
  
  const startTime = Date.now()
  
  const questions = await prisma.questions.findMany({
    where: { id: { startsWith: 'q_test_' } },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      content: true,
      vocabularyId: true,
      vocabularies: {
        select: {
          word: true,
        },
      },
    },
  })
  
  const duration = Date.now() - startTime
  
  return {
    method: 'Offset分页(无COUNT)',
    page,
    limit,
    count: questions.length,
    duration,
  }
}

async function runBenchmark() {
  console.log('🚀 开始性能测试...\n')
  
  // 检查测试数据
  const totalQuestions = await prisma.questions.count({
    where: { id: { startsWith: 'q_test_' } },
  })
  
  if (totalQuestions === 0) {
    console.error('❌ 没有测试数据! 请先运行: node scripts/generate-test-data.js')
    process.exit(1)
  }
  
  console.log(`📊 测试数据: ${totalQuestions} 个题目\n`)
  console.log('='.repeat(80))
  
  const results = []
  
  // 测试1: 浅分页 (第1页)
  console.log('\n📌 测试1: 浅分页 (第1页, limit=20)')
  console.log('-'.repeat(80))
  
  const test1a = await testOffsetPagination(1, 20)
  console.log(`✓ ${test1a.method}: ${test1a.duration}ms`)
  results.push(test1a)
  
  const test1b = await testCursorPagination(null, 20)
  console.log(`✓ ${test1b.method}: ${test1b.duration}ms`)
  results.push(test1b)
  
  const test1c = await testWithoutCount(1, 20)
  console.log(`✓ ${test1c.method}: ${test1c.duration}ms`)
  results.push(test1c)
  
  // 测试2: 中度分页 (第50页)
  console.log('\n📌 测试2: 中度分页 (第50页, limit=20)')
  console.log('-'.repeat(80))
  
  const test2a = await testOffsetPagination(50, 20)
  console.log(`✓ ${test2a.method}: ${test2a.duration}ms`)
  results.push(test2a)
  
  // 获取第50页的游标 (需要模拟游标跳转)
  const cursorForPage50 = await prisma.questions.findMany({
    where: { id: { startsWith: 'q_test_' } },
    skip: 49 * 20,
    take: 1,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  
  const test2b = await testCursorPagination(cursorForPage50[0]?.id, 20)
  console.log(`✓ ${test2b.method}: ${test2b.duration}ms`)
  results.push(test2b)
  
  // 测试3: 深度分页 (第100页)
  console.log('\n📌 测试3: 深度分页 (第100页, limit=20)')
  console.log('-'.repeat(80))
  
  const test3a = await testOffsetPagination(100, 20)
  console.log(`✓ ${test3a.method}: ${test3a.duration}ms`)
  results.push(test3a)
  
  const cursorForPage100 = await prisma.questions.findMany({
    where: { id: { startsWith: 'q_test_' } },
    skip: 99 * 20,
    take: 1,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  
  const test3b = await testCursorPagination(cursorForPage100[0]?.id, 20)
  console.log(`✓ ${test3b.method}: ${test3b.duration}ms`)
  results.push(test3b)
  
  // 测试4: 大批量加载
  console.log('\n📌 测试4: 大批量加载 (limit=100)')
  console.log('-'.repeat(80))
  
  const test4a = await testOffsetPagination(1, 100)
  console.log(`✓ ${test4a.method}: ${test4a.duration}ms`)
  results.push(test4a)
  
  const test4b = await testCursorPagination(null, 100)
  console.log(`✓ ${test4b.method}: ${test4b.duration}ms`)
  results.push(test4b)
  
  // 汇总报告
  console.log('\n' + '='.repeat(80))
  console.log('📈 性能测试报告')
  console.log('='.repeat(80))
  
  console.log('\n📋 详细结果:')
  console.table(results.map(r => ({
    '方法': r.method,
    '页码/游标': r.page || r.cursor || '-',
    '数量': r.count,
    '耗时(ms)': r.duration,
  })))
  
  // 性能对比
  const offsetAvg = results
    .filter(r => r.method === 'Offset分页')
    .reduce((sum, r) => sum + r.duration, 0) / 
    results.filter(r => r.method === 'Offset分页').length
  
  const cursorAvg = results
    .filter(r => r.method === '游标分页')
    .reduce((sum, r) => sum + r.duration, 0) / 
    results.filter(r => r.method === '游标分页').length
  
  console.log('\n📊 平均性能对比:')
  console.log(`  Offset分页: ${offsetAvg.toFixed(2)}ms`)
  console.log(`  游标分页: ${cursorAvg.toFixed(2)}ms`)
  console.log(`  性能提升: ${((offsetAvg - cursorAvg) / offsetAvg * 100).toFixed(2)}%`)
  
  console.log('\n💡 优化建议:')
  console.log('  1. 使用游标分页替代offset分页')
  console.log('  2. 首次加载时获取总数，后续加载跳过COUNT查询')
  console.log('  3. 使用select精确指定字段，避免加载不必要数据')
  console.log('  4. 添加数据库索引优化查询性能')
  console.log('  5. 实现前端虚拟滚动减少DOM渲染开销')
  
  console.log('\n' + '='.repeat(80))
}

async function main() {
  try {
    await runBenchmark()
  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
