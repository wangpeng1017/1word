/**
 * 英文单词发音音频数据获取脚本
 * 数据源: https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download
 * 
 * 功能:
 * 1. 从thousandlemons项目获取单词发音MP3音频链接
 * 2. 支持119,376个独立英文单词
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUDIO_DATA_URL = 'https://raw.githubusercontent.com/thousandlemons/English-words-pronunciation-mp3-audio-download/master/data.json';
const DATA_DIR = path.join(__dirname, '../data');
const AUDIO_DATA_FILE = path.join(DATA_DIR, 'audio-data.json');

/**
 * 下载音频数据JSON文件
 */
async function downloadAudioData() {
  return new Promise((resolve, reject) => {
    console.log('📥 开始下载音频数据...');
    
    // 确保data目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const file = fs.createWriteStream(AUDIO_DATA_FILE);
    
    https.get(AUDIO_DATA_URL, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ 音频数据下载完成');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(AUDIO_DATA_FILE, () => {});
      console.error('❌ 下载失败:', err.message);
      reject(err);
    });
  });
}

/**
 * 加载音频数据
 */
function loadAudioData() {
  if (!fs.existsSync(AUDIO_DATA_FILE)) {
    console.error('❌ 音频数据文件不存在，请先运行下载');
    return null;
  }
  
  try {
    const content = fs.readFileSync(AUDIO_DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    console.log(`✅ 加载了 ${Object.keys(data).length} 个单词的音频数据`);
    return data;
  } catch (error) {
    console.error('❌ 解析音频数据失败:', error.message);
    return null;
  }
}

/**
 * 查找单词的音频URL
 * @param {string} word - 单词
 * @returns {Object|null} - 返回音频信息对象或null
 */
function findAudioUrl(word) {
  const audioData = loadAudioData();
  if (!audioData) return null;
  
  const lowerWord = word.toLowerCase();
  
  // 直接查找
  if (audioData[lowerWord]) {
    return {
      word: lowerWord,
      audioUrl: audioData[lowerWord],
      accent: 'US' // thousandlemons项目主要提供美式发音
    };
  }
  
  return null;
}

/**
 * 批量查找单词音频
 */
function batchFindAudioUrls(words) {
  console.log(`🔍 开始查找 ${words.length} 个单词的音频...`);
  
  const audioData = loadAudioData();
  if (!audioData) return { results: [], notFound: words };
  
  const results = [];
  const notFound = [];
  
  for (const word of words) {
    const audioInfo = findAudioUrl(word);
    if (audioInfo) {
      results.push(audioInfo);
    } else {
      notFound.push(word);
    }
  }
  
  console.log(`✅ 找到 ${results.length} 个单词的音频`);
  if (notFound.length > 0) {
    console.log(`⚠️  未找到 ${notFound.length} 个单词的音频:`, notFound.slice(0, 10).join(', '));
  }
  
  return { results, notFound };
}

/**
 * 构建完整的音频URL
 * thousandlemons项目的音频文件托管在不同的服务器上
 */
function buildFullAudioUrl(partialUrl) {
  // 如果已经是完整URL，直接返回
  if (partialUrl.startsWith('http://') || partialUrl.startsWith('https://')) {
    return partialUrl;
  }
  
  // 否则，构建完整URL
  const baseUrl = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford';
  return `${baseUrl}/${partialUrl}`;
}

/**
 * 获取音频元数据（可选功能）
 */
async function getAudioMetadata(audioUrl) {
  return new Promise((resolve) => {
    https.get(audioUrl, (response) => {
      const contentLength = response.headers['content-length'];
      const contentType = response.headers['content-type'];
      
      resolve({
        size: contentLength ? parseInt(contentLength) : null,
        type: contentType || 'audio/mpeg',
        duration: null // 需要额外的库来解析
      });
    }).on('error', (err) => {
      console.error(`❌ 获取音频元数据失败: ${err.message}`);
      resolve(null);
    });
  });
}

// 导出函数
module.exports = {
  downloadAudioData,
  loadAudioData,
  findAudioUrl,
  batchFindAudioUrls,
  buildFullAudioUrl,
  getAudioMetadata
};

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    try {
      // 下载数据
      await downloadAudioData();
      
      // 测试查找功能
      console.log('\n🎵 测试音频查找功能:');
      const testWords = ['ambitious', 'adapt', 'adopt', 'accept', 'hello'];
      const { results, notFound } = batchFindAudioUrls(testWords);
      
      console.log('\n查找结果:');
      for (const item of results) {
        console.log(`\n单词: ${item.word}`);
        console.log(`音频URL: ${item.audioUrl}`);
        console.log(`口音: ${item.accent}`);
        
        // 可选：获取音频元数据
        const fullUrl = buildFullAudioUrl(item.audioUrl);
        console.log(`完整URL: ${fullUrl}`);
      }
      
    } catch (error) {
      console.error('❌ 执行失败:', error);
      process.exit(1);
    }
  })();
}
