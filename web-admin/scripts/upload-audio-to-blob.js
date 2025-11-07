/**
 * 批量上传单词音频到 Vercel Blob 存储
 * 
 * 功能:
 * 1. 从 thousandlemons 项目下载音频文件
 * 2. 上传到 Vercel Blob
 * 3. 更新数据库中的 audioUrl
 */

const https = require('https');
const { put } = require('@vercel/blob');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

/**
 * 下载音频文件
 */
async function downloadAudio(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`));
        return;
      }
      
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

/**
 * 上传音频到 Vercel Blob
 */
async function uploadToBlob(buffer, filename) {
  try {
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'audio/mpeg',
    });
    
    return blob.url;
  } catch (error) {
    console.error('上传到 Blob 失败:', error);
    throw error;
  }
}

/**
 * 构建完整的音频URL
 */
function buildFullAudioUrl(partialUrl) {
  if (partialUrl.startsWith('http://') || partialUrl.startsWith('https://')) {
    return partialUrl;
  }
  
  const baseUrl = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford';
  return `${baseUrl}/${partialUrl}`;
}

/**
 * 加载音频数据
 */
function loadAudioData() {
  const fs = require('fs');
  const audioDataFile = path.join(__dirname, '../data/audio-data.json');
  
  if (!fs.existsSync(audioDataFile)) {
    console.error('❌ 音频数据文件不存在，请先运行: npm run data:fetch-audio');
    return null;
  }
  
  try {
    const content = fs.readFileSync(audioDataFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 解析音频数据失败:', error.message);
    return null;
  }
}

/**
 * 处理单个单词的音频上传
 */
async function processWordAudio(word, audioPartialUrl, index, total) {
  try {
    console.log(`\n[${index}/${total}] 处理单词: ${word}`);
    
    // 1. 构建完整 URL
    const sourceUrl = buildFullAudioUrl(audioPartialUrl);
    console.log(`  源音频: ${sourceUrl}`);
    
    // 2. 下载音频
    console.log(`  ⬇️ 下载中...`);
    const audioBuffer = await downloadAudio(sourceUrl);
    console.log(`  ✅ 下载完成 (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
    
    // 3. 上传到 Vercel Blob
    console.log(`  ⬆️ 上传到 Vercel Blob...`);
    const filename = `audio/words/${word.toLowerCase()}.mp3`;
    const blobUrl = await uploadToBlob(audioBuffer, filename);
    console.log(`  ✅ 上传成功: ${blobUrl}`);
    
    // 4. 更新数据库
    console.log(`  💾 更新数据库...`);
    const updated = await prisma.vocabulary.updateMany({
      where: {
        word: {
          equals: word,
          mode: 'insensitive',
        },
      },
      data: {
        audioUrl: blobUrl,
      },
    });
    
    if (updated.count > 0) {
      console.log(`  ✅ 数据库更新成功`);
    } else {
      console.log(`  ⚠️  单词不在数据库中，仅上传音频文件`);
    }
    
    return {
      word,
      success: true,
      blobUrl,
      updated: updated.count > 0,
    };
    
  } catch (error) {
    console.error(`  ❌ 处理失败: ${error.message}`);
    return {
      word,
      success: false,
      error: error.message,
    };
  }
}

/**
 * 批量上传音频
 */
async function batchUploadAudio(words) {
  console.log('🎵 开始批量上传音频到 Vercel Blob\n');
  console.log(`待处理单词数: ${words.length}`);
  
  // 检查环境变量
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ 缺少 BLOB_READ_WRITE_TOKEN 环境变量');
    console.log('请在 .env.local 中设置: BLOB_READ_WRITE_TOKEN=your_token');
    process.exit(1);
  }
  
  // 加载音频数据
  const audioData = loadAudioData();
  if (!audioData) {
    process.exit(1);
  }
  
  const results = {
    total: words.length,
    success: [],
    failed: [],
    notFound: [],
  };
  
  // 逐个处理单词
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    
    // 查找音频URL
    if (!audioData[word]) {
      console.log(`\n[${i + 1}/${words.length}] ⚠️  未找到单词 "${word}" 的音频`);
      results.notFound.push(word);
      continue;
    }
    
    const result = await processWordAudio(
      word,
      audioData[word],
      i + 1,
      words.length
    );
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // 添加延迟，避免请求过快
    if (i < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // 打印汇总
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 上传结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${results.success.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);
  console.log(`⚠️  未找到: ${results.notFound.length}`);
  
  if (results.success.length > 0) {
    console.log('\n成功上传的单词:');
    results.success.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.word} - ${item.blobUrl}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n失败的单词:');
    results.failed.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.word} - ${item.error}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n未找到音频的单词:');
    console.log(`  ${results.notFound.join(', ')}`);
  }
  
  return results;
}

/**
 * 从数据库获取指定数量的单词
 */
async function getWordsFromDatabase(limit = 20) {
  const words = await prisma.vocabulary.findMany({
    take: limit,
    select: {
      word: true,
    },
  });
  
  return words.map(w => w.word);
}

// 主函数
async function main() {
  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    let words = [];
    
    if (args.length === 0) {
      // 没有参数，从数据库获取前20个单词
      console.log('未指定单词，从数据库获取前20个单词...');
      words = await getWordsFromDatabase(20);
    } else if (args[0] === '--from-db') {
      // 从数据库获取指定数量的单词
      const limit = parseInt(args[1]) || 20;
      console.log(`从数据库获取前 ${limit} 个单词...`);
      words = await getWordsFromDatabase(limit);
    } else {
      // 使用命令行提供的单词列表
      words = args;
    }
    
    if (words.length === 0) {
      console.log('❌ 没有要处理的单词');
      return;
    }
    
    // 执行批量上传
    await batchUploadAudio(words);
    
  } catch (error) {
    console.error('❌ 执行出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  batchUploadAudio,
  processWordAudio,
};
