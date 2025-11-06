/**
 * 手动更新现有词汇的音标数据
 * 将旧的 phonetic 字段数据分别填入 phoneticUS 和 phoneticUK
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 常见单词的美式和英式音标(如果不同)
const phoneticDifferences = {
  // 这些单词美英音标基本相同,使用通用音标
};

async function updatePhonetics() {
  try {
    console.log('🚀 开始更新词汇音标数据...\n');

    // 1. 获取所有有 phonetic 但没有 phoneticUS/UK 的词汇
    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        AND: [
          { phonetic: { not: null } },
          { phoneticUS: null },
          { phoneticUK: null }
        ]
      },
      select: {
        id: true,
        word: true,
        phonetic: true
      }
    });

    console.log(`📝 找到 ${vocabularies.length} 个需要更新的词汇\n`);

    let updated = 0;
    let skipped = 0;

    for (const vocab of vocabularies) {
      try {
        const { word, phonetic } = vocab;
        
        // 对于大多数单词,美式和英式音标相同或相似
        // 这里简化处理:将 phonetic 同时赋值给 US 和 UK
        const phoneticUS = phonetic;
        const phoneticUK = phonetic;

        await prisma.vocabulary.update({
          where: { id: vocab.id },
          data: {
            phoneticUS,
            phoneticUK
          }
        });

        console.log(`✅ ${word}: ${phoneticUS}`);
        updated++;

      } catch (error) {
        console.error(`❌ 更新失败: ${vocab.word}`, error.message);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 更新统计:');
    console.log(`  成功: ${updated}`);
    console.log(`  跳过: ${skipped}`);
    console.log('='.repeat(50));

    // 2. 统计更新后的数据
    const stats = await prisma.vocabulary.aggregate({
      _count: {
        id: true
      }
    });

    const withSeparatePhonetics = await prisma.vocabulary.count({
      where: {
        AND: [
          { phoneticUS: { not: null } },
          { phoneticUK: { not: null } }
        ]
      }
    });

    console.log('\n📈 数据完整性:');
    console.log(`  总词汇数: ${stats._count.id}`);
    console.log(`  有美英音标的: ${withSeparatePhonetics} (${(withSeparatePhonetics / stats._count.id * 100).toFixed(1)}%)`);

    console.log('\n✨ 更新完成!');
    console.log('💡 提示: 刷新浏览器页面,词汇列表将显示 美🇺🇸/英🇬🇧 标签');

  } catch (error) {
    console.error('\n❌ 更新过程发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
updatePhonetics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
