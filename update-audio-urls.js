/**
 * 从thousandlemons项目获取音频URL并更新数据库
 * 数据源: https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download
 */

const https = require('https');
const fs = require('fs');

const API_BASE_URL = 'https://11word.vercel.app';
const AUDIO_JSON_URL = 'https://raw.githubusercontent.com/thousandlemons/English-words-pronunciation-mp3-audio-download/master/data.json';

let AUTH_TOKEN = '';
let audioData = {};

// HTTP请求辅助函数
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (AUTH_TOKEN) {
      options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || body}`));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 下载JSON文件
function downloadAudioJson() {
  return new Promise((resolve, reject) => {
    console.log('📥 正在下载音频数据...');
    https.get(AUDIO_JSON_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          audioData = JSON.parse(data);
          console.log(`✅ 成功加载 ${Object.keys(audioData).length} 个单词的音频数据\n`);
          resolve();
        } catch (e) {
          reject(new Error('解析JSON失败: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

// 登录
async function login() {
  console.log('🔐 正在登录...\n');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@vocab.com',
    password: 'admin123456'
  });
  
  if (response.success && response.data.token) {
    AUTH_TOKEN = response.data.token;
    return true;
  }
  return false;
}

// 获取所有词汇
async function getAllVocabularies() {
  console.log('📋 获取数据库中的词汇...\n');
  const response = await makeRequest('GET', '/api/vocabularies?limit=100');
  
  if (response.success && response.data) {
    return response.data.vocabularies;
  }
  return [];
}

// 更新词汇音频URL
async function updateVocabularyAudio(vocab, audioUrl) {
  try {
    await makeRequest('PUT', `/api/vocabularies/${vocab.id}`, {
      word: vocab.word,
      partOfSpeech: vocab.partOfSpeech,
      primaryMeaning: vocab.primaryMeaning,
      secondaryMeaning: vocab.secondaryMeaning,
      phonetic: vocab.phonetic,
      phoneticUS: vocab.phoneticUS,
      phoneticUK: vocab.phoneticUK,
      audioUrl: audioUrl,
      isHighFrequency: vocab.isHighFrequency,
      difficulty: vocab.difficulty
    });
    return true;
  } catch (error) {
    console.error(`  更新失败: ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('🎵 开始更新词汇音频URL');
  console.log('='.repeat(60));
  console.log();

  // 1. 下载音频数据
  await downloadAudioJson();

  // 2. 登录
  await login();

  // 3. 获取所有词汇
  const vocabularies = await getAllVocabularies();
  console.log(`找到 ${vocabularies.length} 个词汇需要更新音频\n`);

  // 4. 匹配并更新音频URL
  console.log('🔄 开始匹配音频URL...\n');
  let matchedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < vocabularies.length; i++) {
    const vocab = vocabularies[i];
    const word = vocab.word.toLowerCase();
    
    process.stdout.write(`  处理进度: ${i + 1}/${vocabularies.length} - ${word}\r`);
    
    // 在音频数据中查找匹配
    if (audioData[word]) {
      matchedCount++;
      const audioUrl = audioData[word];
      
      // 更新数据库
      const success = await updateVocabularyAudio(vocab, audioUrl);
      if (success) {
        updatedCount++;
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  console.log(`\n\n✅ 更新完成!`);
  console.log(`   - 匹配到音频: ${matchedCount}/${vocabularies.length}`);
  console.log(`   - 成功更新: ${updatedCount}/${matchedCount}`);
  
  if (matchedCount < vocabularies.length) {
    console.log(`\n⚠️  有 ${vocabularies.length - matchedCount} 个词汇未找到音频:`);
    for (const vocab of vocabularies) {
      if (!audioData[vocab.word.toLowerCase()]) {
        console.log(`   - ${vocab.word}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(error => {
  console.error('❌ 程序执行出错:', error);
  process.exit(1);
});
