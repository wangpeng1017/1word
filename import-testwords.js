/**
 * 批量导入testword.md中的50个词汇
 * 步骤:
 * 1. 清空现有词汇数据
 * 2. 导入50个新词汇(带音标)
 */

const https = require('https');

// 线上环境配置
const API_BASE_URL = 'https://11word.vercel.app';
// 本地测试配置(如需本地测试,取消注释下面这行)
// const API_BASE_URL = 'http://localhost:3000';

// 从testword.md提取的50个词汇
const vocabularies = [
  { word: 'refugee', partOfSpeech: ['n.'], primaryMeaning: '难民', phonetic: '/ˌrefjʊˈdʒiː/' },
  { word: 'supply', partOfSpeech: ['n.', 'v.'], primaryMeaning: '供应', phonetic: '/səˈplaɪ/' },
  { word: 'specific', partOfSpeech: ['adj.'], primaryMeaning: '特定的', phonetic: '/spəˈsɪfɪk/' },
  { word: 'region', partOfSpeech: ['n.'], primaryMeaning: '区域', phonetic: '/ˈriːdʒən/' },
  { word: 'sunset', partOfSpeech: ['n.'], primaryMeaning: '日落', phonetic: '/ˈsʌnset/' },
  { word: 'rescue', partOfSpeech: ['v.', 'n.'], primaryMeaning: '救援', phonetic: '/ˈreskjuː/' },
  { word: 'species', partOfSpeech: ['n.'], primaryMeaning: '物种', phonetic: '/ˈspiːʃiːz/' },
  { word: 'superior', partOfSpeech: ['adj.'], primaryMeaning: '优越的', phonetic: '/suːˈpɪəriər/' },
  { word: 'regard', partOfSpeech: ['v.'], primaryMeaning: '认为', phonetic: '/rɪˈɡɑːd/' },
  { word: 'resident', partOfSpeech: ['n.'], primaryMeaning: '居民', phonetic: '/ˈrezɪdənt/' },
  
  { word: 'policy', partOfSpeech: ['n.'], primaryMeaning: '政策', phonetic: '/ˈpɒləsi/' },
  { word: 'engage', partOfSpeech: ['v.'], primaryMeaning: '参与', phonetic: '/ɪnˈɡeɪdʒ/' },
  { word: 'electricity', partOfSpeech: ['n.'], primaryMeaning: '电力', phonetic: '/ɪˌlekˈtrɪsəti/' },
  { word: 'edge', partOfSpeech: ['n.'], primaryMeaning: '边缘', phonetic: '/edʒ/' },
  { word: 'phrase', partOfSpeech: ['n.'], primaryMeaning: '短语', phonetic: '/freɪz/' },
  { word: 'flow', partOfSpeech: ['v.', 'n.'], primaryMeaning: '流动', phonetic: '/fləʊ/' },
  { word: 'drill', partOfSpeech: ['n.', 'v.'], primaryMeaning: '训练；钻头', phonetic: '/drɪl/' },
  { word: 'persuade', partOfSpeech: ['v.'], primaryMeaning: '说服', phonetic: '/pəˈsweɪd/' },
  { word: 'personality', partOfSpeech: ['n.'], primaryMeaning: '个性', phonetic: '/ˌpɜːsəˈnæləti/' },
  { word: 'entertainment', partOfSpeech: ['n.'], primaryMeaning: '娱乐', phonetic: '/ˌentəˈteɪnmənt/' },
  
  { word: 'destroy', partOfSpeech: ['v.'], primaryMeaning: '破坏', phonetic: '/dɪˈstrɔɪ/' },
  { word: 'disappear', partOfSpeech: ['v.'], primaryMeaning: '消失', phonetic: '/ˌdɪsəˈpɪə/' },
  { word: 'distinction', partOfSpeech: ['n.'], primaryMeaning: '区别', phonetic: '/dɪˈstɪŋkʃn/' },
  { word: 'flavour', partOfSpeech: ['n.'], primaryMeaning: '味道', phonetic: '/ˈfleɪvə/' },
  { word: 'cycle', partOfSpeech: ['n.'], primaryMeaning: '循环', phonetic: '/ˈsaɪkl/' },
  { word: 'define', partOfSpeech: ['v.'], primaryMeaning: '定义', phonetic: '/dɪˈfaɪn/' },
  { word: 'contrast', partOfSpeech: ['n.', 'v.'], primaryMeaning: '对比', phonetic: '/ˈkɒntrɑːst/' },
  { word: 'coal', partOfSpeech: ['n.'], primaryMeaning: '煤', phonetic: '/kəʊl/' },
  { word: 'ban', partOfSpeech: ['v.', 'n.'], primaryMeaning: '禁止', phonetic: '/bæn/' },
  { word: 'accurate', partOfSpeech: ['adj.'], primaryMeaning: '准确的', phonetic: '/ˈækjərət/' },
  
  { word: 'ambition', partOfSpeech: ['n.'], primaryMeaning: '雄心', phonetic: '/æmˈbɪʃn/' },
  { word: 'announce', partOfSpeech: ['v.'], primaryMeaning: '宣布', phonetic: '/əˈnaʊns/' },
  { word: 'annual', partOfSpeech: ['adj.'], primaryMeaning: '年度的', phonetic: '/ˈænjuəl/' },
  { word: 'acid', partOfSpeech: ['n.'], primaryMeaning: '酸', phonetic: '/ˈæsɪd/' },
  { word: 'admission', partOfSpeech: ['n.'], primaryMeaning: '承认', phonetic: '/ədˈmɪʃn/' },
  { word: 'agency', partOfSpeech: ['n.'], primaryMeaning: '机构', phonetic: '/ˈeɪdʒənsi/' },
  { word: 'elderly', partOfSpeech: ['adj.'], primaryMeaning: '年老的', phonetic: '/ˈeldəli/' },
  { word: 'entry', partOfSpeech: ['n.'], primaryMeaning: '进入', phonetic: '/ˈentri/' },
  { word: 'dull', partOfSpeech: ['adj.'], primaryMeaning: '枯燥的', phonetic: '/dʌl/' },
  { word: 'employment', partOfSpeech: ['n.'], primaryMeaning: '就业', phonetic: '/ɪmˈplɔɪmənt/' },
  
  { word: 'regulate', partOfSpeech: ['v.'], primaryMeaning: '管理；调节', phonetic: '/ˈreɡjəleɪt/' },
  { word: 'encouragement', partOfSpeech: ['n.'], primaryMeaning: '鼓励', phonetic: '/ɪnˈkʌrɪdʒmənt/' },
  { word: 'enormous', partOfSpeech: ['adj.'], primaryMeaning: '巨大的', phonetic: '/ɪˈnɔːməs/' },
  { word: 'ecology', partOfSpeech: ['n.'], primaryMeaning: '生态', phonetic: '/iˈkɒlədʒi/' },
  { word: 'edition', partOfSpeech: ['n.'], primaryMeaning: '版本', phonetic: '/ɪˈdɪʃn/' },
  { word: 'educate', partOfSpeech: ['v.'], primaryMeaning: '教育', phonetic: '/ˈedʒukeɪt/' },
  { word: 'elect', partOfSpeech: ['v.'], primaryMeaning: '选举', phonetic: '/ɪˈlekt/' },
  { word: 'reliable', partOfSpeech: ['adj.'], primaryMeaning: '可靠的', phonetic: '/rɪˈlaɪəbl/' },
  { word: 'register', partOfSpeech: ['v.', 'n.'], primaryMeaning: '注册', phonetic: '/ˈredʒɪstə/' },
  { word: 'replicate', partOfSpeech: ['v.'], primaryMeaning: '复制', phonetic: '/ˈreplɪkeɪt/' },
];

// 登录凭证(需要管理员权限)
let AUTH_TOKEN = '';

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

// 登录获取token
async function login() {
  console.log('🔐 正在登录...');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@vocab.com',
      password: 'admin123456'
    });
    
    if (response.success && response.data.token) {
      AUTH_TOKEN = response.data.token;
      console.log('✅ 登录成功!\n');
      return true;
    }
    throw new Error('登录失败: 未获取到token');
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    console.log('\n💡 提示: 请在脚本中配置正确的管理员账号和密码');
    return false;
  }
}

// 获取所有词汇ID
async function getAllVocabularyIds() {
  console.log('📋 正在获取现有词汇列表...');
  try {
    const response = await makeRequest('GET', '/api/vocabularies?limit=1000');
    if (response.success && response.data.vocabularies) {
      console.log(`✅ 找到 ${response.data.vocabularies.length} 个现有词汇\n`);
      return response.data.vocabularies.map(v => v.id);
    }
    return [];
  } catch (error) {
    console.error('❌ 获取词汇列表失败:', error.message);
    return [];
  }
}

// 删除单个词汇
async function deleteVocabulary(id) {
  try {
    await makeRequest('DELETE', `/api/vocabularies/${id}`);
    return true;
  } catch (error) {
    console.error(`  ❌ 删除失败: ${error.message}`);
    return false;
  }
}

// 清空所有词汇
async function clearAllVocabularies() {
  const ids = await getAllVocabularyIds();
  
  if (ids.length === 0) {
    console.log('✅ 数据库中没有词汇数据,无需清空\n');
    return;
  }

  console.log('🗑️  开始清空现有词汇...');
  let successCount = 0;
  
  for (let i = 0; i < ids.length; i++) {
    process.stdout.write(`  删除进度: ${i + 1}/${ids.length}\r`);
    const success = await deleteVocabulary(ids[i]);
    if (success) successCount++;
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ 清空完成! 成功删除 ${successCount}/${ids.length} 个词汇\n`);
}

// 创建单个词汇
async function createVocabulary(vocab) {
  try {
    await makeRequest('POST', '/api/vocabularies', {
      word: vocab.word,
      partOfSpeech: vocab.partOfSpeech,
      primaryMeaning: vocab.primaryMeaning,
      phonetic: vocab.phonetic,
      phoneticUS: vocab.phonetic, // 暂时使用通用音标
      phoneticUK: vocab.phonetic,
      isHighFrequency: true, // 默认都是高频词
      difficulty: 'MEDIUM'
    });
    return true;
  } catch (error) {
    console.error(`  ❌ ${vocab.word} 导入失败: ${error.message}`);
    return false;
  }
}

// 批量导入词汇
async function importVocabularies() {
  console.log('📥 开始导入50个词汇...');
  let successCount = 0;
  
  for (let i = 0; i < vocabularies.length; i++) {
    const vocab = vocabularies[i];
    process.stdout.write(`  导入进度: ${i + 1}/${vocabularies.length} - ${vocab.word}\r`);
    
    const success = await createVocabulary(vocab);
    if (success) successCount++;
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log(`\n✅ 导入完成! 成功导入 ${successCount}/${vocabularies.length} 个词汇\n`);
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('📚 开始批量导入testword.md词汇');
  console.log('='.repeat(60));
  console.log();

  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    process.exit(1);
  }

  // 2. 清空现有数据
  await clearAllVocabularies();

  // 3. 导入新词汇
  await importVocabularies();

  console.log('='.repeat(60));
  console.log('✅ 所有操作完成!');
  console.log('='.repeat(60));
}

// 运行
main().catch(error => {
  console.error('❌ 程序执行出错:', error);
  process.exit(1);
});
