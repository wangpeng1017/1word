/**
 * 修复数据库中的音频URL
 * 确保所有音频URL都是完整的可访问URL
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 构建完整的音频URL
 */
function buildFullAudioUrl(audioUrl) {
  if (!audioUrl) return null;
  
  // 如果已经是完整的URL，直接返回
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  
  // 处理相对路径，构建完整URL
  const baseUrl = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford';
  return `${baseUrl}/${audioUrl}`;
}

/**
 * 测试音频URL是否可访问
 */
async function testAudioUrl(url) {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      https.get(url, { method: 'HEAD', timeout: 5000 }, (response) => {
        resolve(response.statusCode === 200);
      }).on('error', () => {
        resolve(false);
      }).on('timeout', () => {
        resolve(false);
      });
    });
  } catch (error) {
    return false;
  }
}

/**
 * 修复所有音频URL
 */
async function fixAudioUrls(options = {}) {
  const { dryRun = false, testUrls = false } = options;
  
  try {
    console.log('🔍 开始检查音频URL...\n');
    
    // 获取所有音频记录
    const audios = await prisma.wordAudio.findMany({
      include: {
        vocabulary: {
          select: { word: true }
        }
      }
    });
    
    console.log(`📊 找到 ${audios.length} 条音频记录\n`);
    
    let fixedCount = 0;
    let invalidCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i];
      const word = audio.vocabulary?.word || '未知';
      
      console.log(`[${i + 1}/${audios.length}] 处理: ${word}`);
      console.log(`  原始URL: ${audio.audioUrl}`);
      
      // 构建完整URL
      const fullUrl = buildFullAudioUrl(audio.audioUrl);
      
      if (!fullUrl) {
        console.log(`  ⚠️  无效的URL，跳过`);
        invalidCount++;
        continue;
      }
      
      // 检查是否需要更新
      if (audio.audioUrl === fullUrl) {
        console.log(`  ✓ URL已经是完整的，跳过`);
        skippedCount++;
        continue;
      }
      
      console.log(`  新URL: ${fullUrl}`);
      
      // 可选：测试URL是否可访问
      if (testUrls) {
        const isAccessible = await testAudioUrl(fullUrl);
        if (!isAccessible) {
          console.log(`  ❌ URL不可访问`);
          invalidCount++;
          continue;
        }
        console.log(`  ✓ URL可访问`);
      }
      
      // 更新数据库
      if (!dryRun) {
        await prisma.wordAudio.update({
          where: { id: audio.id },
          data: { audioUrl: fullUrl }
        });
        console.log(`  ✅ 已更新`);
        fixedCount++;
      } else {
        console.log(`  🔄 [模拟模式] 将更新为: ${fullUrl}`);
        fixedCount++;
      }
      
      console.log('');
      
      // 添加延迟避免过于频繁的操作
      if (testUrls && i < audios.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // 输出统计信息
    console.log('=' .repeat(60));
    console.log('📊 修复统计:');
    console.log(`  总计处理: ${audios.length}`);
    console.log(`  已修复: ${fixedCount}`);
    console.log(`  已跳过: ${skippedCount}`);
    console.log(`  无效/不可访问: ${invalidCount}`);
    if (dryRun) {
      console.log(`\n  ⚠️  这是模拟运行，未实际修改数据库`);
      console.log(`  要实际执行，请运行: node scripts/fix-audio-urls.js --execute`);
    }
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 删除无效的音频记录
 */
async function removeInvalidAudios() {
  try {
    console.log('🗑️  开始清理无效音频记录...\n');
    
    const audios = await prisma.wordAudio.findMany({
      include: {
        vocabulary: {
          select: { word: true }
        }
      }
    });
    
    let removedCount = 0;
    
    for (const audio of audios) {
      if (!audio.audioUrl || audio.audioUrl.trim() === '') {
        console.log(`删除: ${audio.vocabulary?.word} - 空URL`);
        await prisma.wordAudio.delete({
          where: { id: audio.id }
        });
        removedCount++;
      }
    }
    
    console.log(`\n✅ 删除了 ${removedCount} 条无效记录`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 命令行运行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
音频URL修复工具

用法:
  node scripts/fix-audio-urls.js [选项]

选项:
  --execute          实际执行修复（默认为模拟运行）
  --test-urls        测试URL是否可访问（会变慢）
  --remove-invalid   删除无效的音频记录
  --help, -h         显示帮助信息

示例:
  # 模拟运行（不修改数据库）
  node scripts/fix-audio-urls.js

  # 实际执行修复
  node scripts/fix-audio-urls.js --execute

  # 执行修复并测试URL
  node scripts/fix-audio-urls.js --execute --test-urls

  # 删除无效记录
  node scripts/fix-audio-urls.js --remove-invalid
    `);
    process.exit(0);
  }
  
  const dryRun = !args.includes('--execute');
  const testUrls = args.includes('--test-urls');
  const removeInvalid = args.includes('--remove-invalid');
  
  if (removeInvalid) {
    removeInvalidAudios()
      .then(() => {
        console.log('\n✅ 清理完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ 清理失败:', error);
        process.exit(1);
      });
  } else {
    fixAudioUrls({ dryRun, testUrls })
      .then(() => {
        console.log('\n✅ 完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ 失败:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  fixAudioUrls,
  removeInvalidAudios,
  buildFullAudioUrl
};
