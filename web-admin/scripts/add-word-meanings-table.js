/**
 * 创建word_meanings表
 * 支持一个单词有多个词性和释义
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createWordMeaningsTable() {
  console.log('🚀 开始创建word_meanings表...\n')

  try {
    // 创建表
    console.log('📋 创建word_meanings表...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS word_meanings (
        id VARCHAR(255) PRIMARY KEY,
        "vocabularyId" VARCHAR(255) NOT NULL,
        "partOfSpeech" VARCHAR(50) NOT NULL,
        meaning TEXT NOT NULL,
        "orderIndex" INT DEFAULT 0,
        examples TEXT[] DEFAULT '{}',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_vocabulary
          FOREIGN KEY ("vocabularyId")
          REFERENCES vocabularies(id)
          ON DELETE CASCADE
      );
    `)
    console.log('  ✓ 表创建成功')

    // 创建索引
    console.log('\n📊 创建索引...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_word_meanings_vocabulary 
        ON word_meanings("vocabularyId");
    `)
    console.log('  ✓ idx_word_meanings_vocabulary')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_word_meanings_pos 
        ON word_meanings("partOfSpeech");
    `)
    console.log('  ✓ idx_word_meanings_pos')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab_order 
        ON word_meanings("vocabularyId", "orderIndex");
    `)
    console.log('  ✓ idx_word_meanings_vocab_order')

    // 迁移现有数据
    console.log('\n📦 迁移现有数据...')
    const migratedCount = await prisma.$executeRawUnsafe(`
      INSERT INTO word_meanings (id, "vocabularyId", "partOfSpeech", meaning, "orderIndex", "createdAt", "updatedAt")
      SELECT 
        'wm_' || v.id || '_0' as id,
        v.id as "vocabularyId",
        COALESCE(v.part_of_speech[1], 'n.') as "partOfSpeech",
        v.primary_meaning as meaning,
        0 as "orderIndex",
        v.created_at as "createdAt",
        v.updated_at as "updatedAt"
      FROM vocabularies v
      WHERE v.primary_meaning IS NOT NULL
      AND v.primary_meaning != ''
      AND NOT EXISTS (
        SELECT 1 FROM word_meanings wm WHERE wm."vocabularyId" = v.id
      )
      RETURNING id;
    `)
    console.log(`  ✓ 迁移 ${Array.isArray(migratedCount) ? migratedCount.length : 0} 条主释义`)

    // 更新统计信息
    console.log('\n📈 更新统计信息...')
    await prisma.$executeRawUnsafe('ANALYZE word_meanings;')
    console.log('  ✓ 统计信息已更新')

    // 验证
    const tableCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM word_meanings;
    `)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ word_meanings表创建完成!')
    console.log('='.repeat(60))
    console.log(`📊 当前释义数: ${tableCount[0]?.count || 0}`)
    console.log('💡 下一步: 运行 node scripts/import-word-meanings.js 导入数据')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ 创建表失败:', error.message)
    
    // 检查是否是表已存在的错误
    if (error.message.includes('already exists')) {
      console.log('\n💡 表可能已经存在，继续执行...')
      
      const tableCount = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM word_meanings;
      `)
      console.log(`📊 当前释义数: ${tableCount[0]?.count || 0}`)
    } else {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  try {
    await createWordMeaningsTable()
  } catch (error) {
    console.error('\n❌ 执行失败:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('\n✅ 脚本执行完成\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败\n')
    process.exit(1)
  })
