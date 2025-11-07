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

async function checkVocabularies() {
  console.log('📊 查询词汇数据...\n');
  
  // 获取所有词汇(请求足够大的limit)
  const response = await makeRequest('GET', '/api/vocabularies?limit=100');
  
  if (response.success && response.data) {
    const { vocabularies, pagination } = response.data;
    
    console.log(`总词汇数: ${pagination.total}`);
    console.log(`当前页: ${pagination.page}/${pagination.totalPages}`);
    console.log(`\n前10个词汇:`);
    
    vocabularies.slice(0, 10).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.word} - ${v.primaryMeaning} (${v.phonetic || '无音标'})`);
    });
    
    console.log(`\n后10个词汇:`);
    vocabularies.slice(-10).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.word} - ${v.primaryMeaning} (${v.phonetic || '无音标'})`);
    });
  }
}

async function main() {
  await login();
  await checkVocabularies();
}

main().catch(console.error);
