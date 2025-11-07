const https = require('https');

const API_BASE_URL = 'https://11word.vercel.app';
let AUTH_TOKEN = '';

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
          resolve(response);
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

async function verifyAudioUrls() {
  console.log('📊 验证音频URL...\n');
  
  const response = await makeRequest('GET', '/api/vocabularies?limit=100');
  
  if (response.success && response.data) {
    const { vocabularies } = response.data;
    
    let hasAudioCount = 0;
    let noAudioCount = 0;
    
    console.log(`总词汇数: ${vocabularies.length}\n`);
    console.log('前10个词汇的音频URL:');
    
    vocabularies.slice(0, 10).forEach((v, i) => {
      if (v.audioUrl) {
        hasAudioCount++;
        console.log(`  ${i + 1}. ${v.word}: ${v.audioUrl.substring(0, 60)}...`);
      } else {
        noAudioCount++;
        console.log(`  ${i + 1}. ${v.word}: [无音频]`);
      }
    });
    
    // 统计全部
    vocabularies.forEach(v => {
      if (v.audioUrl && !hasAudioCount) hasAudioCount++;
      if (!v.audioUrl && !noAudioCount) noAudioCount++;
    });
    
    console.log(`\n统计结果:`);
    console.log(`  - 有音频URL: ${vocabularies.filter(v => v.audioUrl).length}/${vocabularies.length}`);
    console.log(`  - 无音频URL: ${vocabularies.filter(v => !v.audioUrl).length}/${vocabularies.length}`);
    
    if (vocabularies.filter(v => !v.audioUrl).length > 0) {
      console.log(`\n缺少音频的词汇:`);
      vocabularies.filter(v => !v.audioUrl).forEach(v => {
        console.log(`  - ${v.word}`);
      });
    }
  }
}

async function main() {
  await login();
  await verifyAudioUrls();
}

main().catch(console.error);
