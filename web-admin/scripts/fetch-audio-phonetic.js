const { PrismaClient } = require('@prisma/client')
const { put } = require('@vercel/blob')
const https = require('https')
const http = require('http')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

// 数据源配置
const DATA_SOURCES = {
  // ECDICT - 音标数据
  ecdict: 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv',
  
  // English-words-pronunciation - 音频数据
  pronunciation: 'https://raw.githubusercontent.com/thousandlemons/English-words-pronunciation-mp3-audio-download/master/data.json',
  
  // 备用音频源
  pronunciationUltimate: 'https://raw.githubusercontent.com/thousandlemons/English-words-pronunciation-mp3-audio-download/master/ultimate.json'
}

// 下载文件内容
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    
    client.get(url, (res) => {
      let data = ''
      
      res.on('data', chunk => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve(data)
      })
      
      res.on('error', reject)
    }).on('error', reject)
  })
}

// 解析ECDICT CSV获取音标
function parseECDICT(csvContent) {
  const lines = csvContent.split('\n')
  const phoneticsMap = new Map()
  
  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // CSV格式: word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio
    const parts = line.split(',')
    if (parts.length < 2) continue
    
    const word = parts[0]?.trim().toLowerCase()
    const phonetic = parts[1]?.trim()
    
    if (word && phonetic) {
      phoneticsMap.set(word, phonetic)
    }
  }
  
  return phoneticsMap
}

// 解析音频数据
async function parseAudioData(jsonContent) {
  try {
    const data = JSON.parse(jsonContent)
    const audioMap = new Map()
    
    // data.json格式通常是: { "word": "audio_url" }
    for (const [word, audioUrl] of Object.entries(data)) {
      audioMap.set(word.toLowerCase(), audioUrl)
    }
    
    return audioMap
  } catch (error) {
    console.error('解析音频数据失败:', error.message)
    return new Map()
  }
}

// 从URL下载音频并上传到Vercel Blob
async function uploadAudioToBlob(audioUrl, word, accent = 'US') {
  try {
    console.log(`  下载音频: ${audioUrl}`)
    
    // 下载音频文件
    const audioBuffer = await new Promise((resolve, reject) => {
      const client = audioUrl.startsWith('https') ? https : http
      
      client.get(audioUrl, (res) => {
        const chunks = []
        
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    })
    
    // 上传到Vercel Blob
    const filename = `${word}-${accent}.mp3`
    const blob = await put(filename, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
    })
    
    console.log(`  ✅ 上传成功: ${blob.url}`)
    return blob.url
    
  } catch (error) {
    console.error(`  ❌ 音频上传失败: ${error.message}`)
    return null
  }
}

// 主函数
async function fetchAndSaveData() {
  try {
    console.log('🚀 开始获取音标和音频数据...\n')
    
    // 1. 获取数据库中的所有单词
    const vocabularies = await prisma.vocabularies.findMany({
      select: {
        id: true,
        word: true,
        phonetic: true,
        phonetic_us: true,
        phonetic_uk: true,
      }
    })
    
    console.log(`📚 找到 ${vocabularies.length} 个单词需要处理\n`)
    
    // 2. 下载音标数据
    console.log('📥 下载ECDICT音标数据...')
    let phoneticsMap = new Map()
    try {
      const ecdictContent = await downloadFile(DATA_SOURCES.ecdict)
      phoneticsMap = parseECDICT(ecdictContent)
      console.log(`✅ 成功解析 ${phoneticsMap.size} 个单词的音标\n`)
    } catch (error) {
      console.error('❌ ECDICT下载失败:', error.message)
      console.log('⚠️  将跳过音标更新\n')
    }
    
    // 3. 下载音频数据
    console.log('📥 下载音频数据...')
    let audioMap = new Map()
    try {
      const audioContent = await downloadFile(DATA_SOURCES.pronunciation)
      audioMap = await parseAudioData(audioContent)
      console.log(`✅ 成功解析 ${audioMap.size} 个单词的音频链接\n`)
    } catch (error) {
      console.error('❌ 音频数据下载失败:', error.message)
      
      // 尝试备用源
      try {
        console.log('🔄 尝试备用音频源...')
        const ultimateContent = await downloadFile(DATA_SOURCES.pronunciationUltimate)
        audioMap = await parseAudioData(ultimateContent)
        console.log(`✅ 备用源成功: ${audioMap.size} 个音频链接\n`)
      } catch (err) {
        console.error('❌ 备用源也失败了:', err.message)
        console.log('⚠️  将跳过音频更新\n')
      }
    }
    
    // 4. 处理每个单词
    console.log('🔄 开始处理单词...\n')
    let processedCount = 0
    let updatedPhonetics = 0
    let addedAudios = 0
    
    for (const vocab of vocabularies) {
      console.log(`\n处理: ${vocab.word}`)
      
      // 更新音标
      if (phoneticsMap.has(vocab.word) && !vocab.phonetic) {
        const phonetic = phoneticsMap.get(vocab.word)
        await prisma.vocabularies.update({
          where: { id: vocab.id },
          data: { phonetic }
        })
        console.log(`  ✅ 更新音标: ${phonetic}`)
        updatedPhonetics++
      }
      
      // 处理音频
      if (audioMap.has(vocab.word)) {
        const audioUrl = audioMap.get(vocab.word)
        
        // 检查是否已有音频
        const existingAudio = await prisma.word_audios.findFirst({
          where: { 
            vocabularyId: vocab.id,
            accent: 'US'
          }
        })
        
        if (!existingAudio && audioUrl) {
          // 上传音频到Vercel Blob
          const blobUrl = await uploadAudioToBlob(audioUrl, vocab.word, 'US')
          
          if (blobUrl) {
            // 保存到数据库
            await prisma.word_audios.create({
              data: {
                id: uuidv4(),
                vocabularyId: vocab.id,
                audioUrl: blobUrl,
                accent: 'US',
                createdAt: new Date()
              }
            })
            console.log(`  ✅ 添加音频记录`)
            addedAudios++
          }
        } else if (existingAudio) {
          console.log(`  ⏭️  已有音频,跳过`)
        }
      }
      
      processedCount++
      console.log(`  进度: ${processedCount}/${vocabularies.length}`)
    }
    
    console.log('\n\n📊 处理完成统计:')
    console.log(`  处理单词: ${processedCount} 个`)
    console.log(`  更新音标: ${updatedPhonetics} 个`)
    console.log(`  添加音频: ${addedAudios} 个`)
    
  } catch (error) {
    console.error('\n❌ 处理过程出错:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行
fetchAndSaveData()
