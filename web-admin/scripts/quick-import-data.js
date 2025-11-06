/**
 * 快速导入音标和音频数据
 * 用法: node scripts/quick-import-data.js [单词1] [单词2] ...
 */

const { PrismaClient } = require('@prisma/client');
const { downloadECDICT, downloadAudioData } = require('./fetch-ecdict-data');
const { batchImportData, importSpecificWords } = require('./import-phonetic-and-audio');

const prisma = new PrismaClient();

async function quickImport() {
  try {
    const args = process.argv.slice(2);

    console.log('🚀 快速导入音标和音频数据\n');
    console.log('='.repeat(50));

    // 检查数据文件
    console.log('\n📥 步骤 1/3: 检查并下载数据源...');
    try {
      await downloadECDICT();
      await downloadAudioData();
      console.log('✅ 数据源准备完成');
    } catch (error) {
      console.log('⚠️  使用已存在的本地数据');
    }

    // 导入数据
    console.log('\n📚 步骤 2/3: 导入音标和音频数据...');
    if (args.length > 0) {
      // 导入指定单词
      console.log(`目标单词: ${args.join(', ')}`);
      await importSpecificWords(args);
    } else {
      // 批量导入（仅缺失音标的）
      await batchImportData({
        limit: 50, // 每次最多处理50个
        onlyMissing: true
      });
    }

    // 统计数据
    console.log('\n📊 步骤 3/3: 统计数据完整性...');
    const totalWords = await prisma.vocabulary.count();
    const wordsWithPhonetic = await prisma.vocabulary.count({
      where: {
        OR: [
          { phoneticUS: { not: null } },
          { phoneticUK: { not: null } },
          { phonetic: { not: null } }
        ]
      }
    });
    const wordsWithAudio = await prisma.vocabulary.count({
      where: {
        audios: {
          some: {}
        }
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('📈 数据统计:');
    console.log(`  总词汇数: ${totalWords}`);
    console.log(`  有音标的词汇: ${wordsWithPhonetic} (${(wordsWithPhonetic / totalWords * 100).toFixed(1)}%)`);
    console.log(`  有音频的词汇: ${wordsWithAudio} (${(wordsWithAudio / totalWords * 100).toFixed(1)}%)`);
    console.log('='.repeat(50));

    if (wordsWithPhonetic < totalWords) {
      const missing = totalWords - wordsWithPhonetic;
      console.log(`\n💡 提示: 还有 ${missing} 个词汇缺少音标，可以再次运行此脚本继续导入`);
    } else {
      console.log('\n🎉 所有词汇都已包含音标信息！');
    }

  } catch (error) {
    console.error('\n❌ 导入过程发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
quickImport()
  .then(() => {
    console.log('\n✨ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 失败:', error);
    process.exit(1);
  });
