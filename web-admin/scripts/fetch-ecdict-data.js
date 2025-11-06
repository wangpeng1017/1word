/**
 * ECDICT 词典数据获取脚本
 * 数据源: https://github.com/skywind3000/ECDICT
 * 
 * 功能:
 * 1. 从ECDICT数据库获取单词的音标信息
 * 2. 支持英式和美式音标
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ECDICT_RAW_URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.mini.csv';
const DATA_DIR = path.join(__dirname, '../data');
const ECDICT_FILE = path.join(DATA_DIR, 'ecdict.csv');

/**
 * 下载ECDICT数据文件
 */
async function downloadECDICT() {
  return new Promise((resolve, reject) => {
    console.log('📥 开始下载ECDICT数据...');
    
    // 确保data目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const file = fs.createWriteStream(ECDICT_FILE);
    
    https.get(ECDICT_RAW_URL, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ ECDICT数据下载完成');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(ECDICT_FILE, () => {});
      console.error('❌ 下载失败:', err.message);
      reject(err);
    });
  });
}

/**
 * 解析CSV行
 */
function parseCSVLine(line) {
  const regex = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\",]+))(?:,|$)/g;
  const result = [];
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    result.push(match[1] ? match[1].replace(/""/g, '"') : match[2] || '');
  }
  
  return result;
}

/**
 * 从ECDICT数据中查找单词信息
 */
function findWordInECDICT(word) {
  if (!fs.existsSync(ECDICT_FILE)) {
    console.error('❌ ECDICT数据文件不存在，请先运行下载');
    return null;
  }
  
  const content = fs.readFileSync(ECDICT_FILE, 'utf-8');
  const lines = content.split('\n');
  
  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    const dictWord = columns[0]?.toLowerCase();
    
    if (dictWord === word.toLowerCase()) {
      // ECDICT CSV格式: word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange, detail, audio
      return {
        word: columns[0],
        phonetic: columns[1] || null,  // 音标
        definition: columns[2] || null, // 英文定义
        translation: columns[3] || null, // 中文翻译
        pos: columns[4] || null, // 词性
        collins: columns[5] || null, // 柯林斯星级
        oxford: columns[6] || null, // 牛津3000核心词汇
        tag: columns[7] || null, // 标签(如gk, cet4, cet6等)
      };
    }
  }
  
  return null;
}

/**
 * 批量查找单词信息
 */
function batchFindWords(words) {
  console.log(`🔍 开始查找 ${words.length} 个单词的信息...`);
  
  const results = [];
  const notFound = [];
  
  for (const word of words) {
    const info = findWordInECDICT(word);
    if (info) {
      results.push(info);
    } else {
      notFound.push(word);
    }
  }
  
  console.log(`✅ 找到 ${results.length} 个单词`);
  if (notFound.length > 0) {
    console.log(`⚠️  未找到 ${notFound.length} 个单词:`, notFound.slice(0, 10).join(', '));
  }
  
  return { results, notFound };
}

/**
 * 将ECDICT音标转换为英式和美式音标
 * ECDICT中音标格式通常是 /phonetic/
 */
function parsePhonetic(phonetic) {
  if (!phonetic) return { uk: null, us: null };
  
  // 去除前后的斜杠
  const cleaned = phonetic.replace(/^\/|\/$/g, '');
  
  // 简单处理: 默认都使用同一个音标
  // 实际应用中可能需要更复杂的逻辑来区分英式和美式
  return {
    uk: `/${cleaned}/`,
    us: `/${cleaned}/`
  };
}

// 导出函数
module.exports = {
  downloadECDICT,
  findWordInECDICT,
  batchFindWords,
  parsePhonetic
};

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    try {
      // 下载数据
      await downloadECDICT();
      
      // 测试查找功能
      console.log('\n📖 测试查找功能:');
      const testWords = ['ambitious', 'adapt', 'adopt', 'accept'];
      const { results, notFound } = batchFindWords(testWords);
      
      console.log('\n查找结果:');
      results.forEach(word => {
        console.log(`\n单词: ${word.word}`);
        console.log(`音标: ${word.phonetic}`);
        console.log(`翻译: ${word.translation}`);
        console.log(`词性: ${word.pos}`);
        console.log(`标签: ${word.tag}`);
      });
      
    } catch (error) {
      console.error('❌ 执行失败:', error);
      process.exit(1);
    }
  })();
}
