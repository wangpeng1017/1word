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
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response body:`, body.substring(0, 500));
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
      console.log('Request data:', JSON.stringify(data, null, 2));
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
    console.log('✅ 登录成功\n');
    return true;
  }
  return false;
}

async function testUpdate() {
  // 获取第一个词汇
  console.log('📋 获取第一个词汇...\n');
  const listResponse = await makeRequest('GET', '/api/vocabularies?limit=1');
  
  if (!listResponse.success || !listResponse.data.vocabularies[0]) {
    console.error('❌ 无法获取词汇');
    return;
  }
  
  const vocab = listResponse.data.vocabularies[0];
  console.log(`获取到词汇: ${vocab.word}`);
  console.log(`当前audioUrl: ${vocab.audioUrl || '(无)'}\n`);
  
  // 测试更新
  console.log('🔄 测试更新音频URL...\n');
  const testAudioUrl = 'https://test.example.com/test-audio.mp3';
  
  const updateResponse = await makeRequest('PUT', `/api/vocabularies/${vocab.id}`, {
    word: vocab.word,
    partOfSpeech: vocab.partOfSpeech,
    primaryMeaning: vocab.primaryMeaning,
    secondaryMeaning: vocab.secondaryMeaning,
    phonetic: vocab.phonetic,
    phoneticUS: vocab.phoneticUS,
    phoneticUK: vocab.phoneticUK,
    audioUrl: testAudioUrl,
    isHighFrequency: vocab.isHighFrequency,
    difficulty: vocab.difficulty
  });
  
  if (updateResponse.success) {
    console.log('\n✅ 更新成功!');
    console.log(`新的audioUrl: ${updateResponse.data.audioUrl || '(仍然为空)'}`);
  } else {
    console.log('\n❌ 更新失败');
  }
}

async function main() {
  await login();
  await testUpdate();
}

main().catch(error => {
  console.error('❌ 错误:', error.message);
});
