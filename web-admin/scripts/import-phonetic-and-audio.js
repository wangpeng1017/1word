/**
 * 批量导入音标和音频数据到现有词汇
 * 
 * 功能：
 * 1. 从数据库读取所有词汇
 * 2. 从ECDICT获取音标信息
 * 3. 从thousandlemons获取音频URL
 * 4. 更新词汇表并创建WordAudio记录
 */

const { PrismaClient } = require('@prisma/client');
const { findWordInECDICT, parsePhonetic, downloadECDICT } = require('./fetch-ecdict-data');
const { findAudioUrl, downloadAudioData, buildFullAudioUrl } = require('./fetch-audio-data');

const prisma = new PrismaClient();

/**
 * 更新单个词汇的音标和音频
 */
async function updateVocabularyWithData(vocabulary) {
  const word = vocabulary.word.toLowerCase();
  let updated = false;
  const updates = {};

  console.log(`\n处理单词: ${vocabulary.word}`);

  // 1. 获取ECDICT音标信息
  const ecdictInfo = findWordInECDICT(word);
  if (ecdictInfo && ecdictInfo.phonetic) {
    const { uk, us } = parsePhonetic(ecdictInfo.phonetic);
    
    updates.phonetic = ecdictInfo.phonetic;
    updates.phoneticUK = uk;
    updates.phoneticUS = us;
    
    console.log(`  ✓ 找到音标: ${ecdictInfo.phonetic}`);
    updated = true;
  } else {
    console.log(`  ⚠️  未找到音标`);
  }

  // 2. 更新词汇表
  if (updated) {
    await prisma.vocabulary.update({
      where: { id: vocabulary.id },
      data: updates
    });
  }

  // 3. 获取音频URL并创建WordAudio记录
  const audioInfo = findAudioUrl(word);
  if (audioInfo) {
    const fullAudioUrl = buildFullAudioUrl(audioInfo.audioUrl);
    
    // 检查是否已经存在该音频
    const existingAudio = await prisma.wordAudio.findFirst({
      where: {
        vocabularyId: vocabulary.id,
        accent: audioInfo.accent
      }
    });

    if (!existingAudio) {
      await prisma.wordAudio.create({
        data: {
          vocabularyId: vocabulary.id,
          audioUrl: fullAudioUrl,
          accent: audioInfo.accent,
          duration: null
        }
      });
      console.log(`  ✓ 添加音频: ${audioInfo.accent}`);
    } else {
      console.log(`  ⚠️  音频已存在，跳过`);
    }
  } else {
    console.log(`  ⚠️  未找到音频`);
  }

  return updated;
}

/**
 * 批量导入所有词汇的数据
 */
async function batchImportData(options = {}) {
  const { limit = null, offset = 0, onlyMissing = true } = options;

  try {
    console.log('🚀 开始批量导入音标和音频数据...\n');

    // 1. 下载最新数据（如果需要）
    console.log('📥 检查数据文件...');
    try {
      await downloadECDICT();
      await downloadAudioData();
    } catch (error) {
      console.log('⚠️  数据文件已存在或下载失败，使用本地文件');
    }

    // 2. 获取词汇列表
    const whereClause = onlyMissing ? {
      OR: [
        { phonetic: null },
        { phoneticUS: null },
        { phoneticUK: null }
      ]
    } : {};

    const vocabularies = await prisma.vocabulary.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { word: 'asc' }
    });

    console.log(`\n📚 找到 ${vocabularies.length} 个需要处理的词汇\n`);

    if (vocabularies.length === 0) {
      console.log('✅ 所有词汇都已包含音标信息');
      return;
    }

    // 3. 逐个处理
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < vocabularies.length; i++) {
      const vocabulary = vocabularies[i];
      console.log(`[${i + 1}/${vocabularies.length}]`);

      try {
        const updated = await updateVocabularyWithData(vocabulary);
        if (updated) successCount++;
        
        // 添加延迟避免过于频繁的数据库操作
        if (i < vocabularies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`  ❌ 处理失败:`, error.message);
        failCount++;
      }
    }

    // 4. 统计结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 导入统计:');
    console.log(`  总计处理: ${vocabularies.length}`);
    console.log(`  成功更新: ${successCount}`);
    console.log(`  失败: ${failCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 批量导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 导入指定单词列表的数据
 */
async function importSpecificWords(words) {
  try {
    console.log(`🚀 开始导入 ${words.length} 个指定单词的数据...\n`);

    // 下载数据
    try {
      await downloadECDICT();
      await downloadAudioData();
    } catch (error) {
      console.log('⚠️  使用本地数据文件');
    }

    let successCount = 0;
    let notFoundCount = 0;

    for (const word of words) {
      // 查找词汇
      const vocabulary = await prisma.vocabulary.findFirst({
        where: { word: { equals: word } }  // MySQL 默认大小写不敏感
      });

      if (!vocabulary) {
        console.log(`⚠️  词汇 "${word}" 不在数据库中`);
        notFoundCount++;
        continue;
      }

      const updated = await updateVocabularyWithData(vocabulary);
      if (updated) successCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 导入统计:');
    console.log(`  成功更新: ${successCount}`);
    console.log(`  未找到: ${notFoundCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 导出函数
module.exports = {
  updateVocabularyWithData,
  batchImportData,
  importSpecificWords
};

// 命令行运行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 导入指定单词
    importSpecificWords(args)
      .then(() => {
        console.log('\n✅ 导入完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ 导入失败:', error);
        process.exit(1);
      });
  } else {
    // 批量导入（仅处理缺少音标的词汇）
    batchImportData({ 
      limit: 100,  // 一次处理100个
      onlyMissing: true 
    })
      .then(() => {
        console.log('\n✅ 导入完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ 导入失败:', error);
        process.exit(1);
      });
  }
}
