/**
 * 导入多词性多释义数据
 * 
 * 数据格式示例:
 * const wordsData = [
 *   {
 *     word: "register",
 *     phonetic: "/ˈredʒɪstə(r)/",
 *     meanings: [
 *       { partOfSpeech: "n.", meaning: "登记，注册；登记表，注册簿", examples: [] },
 *       { partOfSpeech: "v.", meaning: "注册，登记，记录，挂号", examples: [] }
 *     ]
 *   }
 * ]
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// PDF数据 - 50个单词的多词性多释义
const wordsData = [
  {
    word: "register",
    meanings: [
      { partOfSpeech: "n.", meaning: "登记, 注册; 登记表, 注册簿; 记录, 登记簿, 暂存器", examples: [] },
      { partOfSpeech: "v.", meaning: "登记, 注册; 记录, 挂号", examples: [] }
    ]
  },
  {
    word: "educate",
    meanings: [
      { partOfSpeech: "v.", meaning: "教育, 培养, 训练", examples: [] }
    ]
  },
  {
    word: "enormous",
    meanings: [
      { partOfSpeech: "adj.", meaning: "巨大的, 庞大的", examples: [] }
    ]
  },
  {
    word: "regulate",
    meanings: [
      { partOfSpeech: "v.", meaning: "控制, 管理, 调整, 校准", examples: [] }
    ]
  },
  {
    word: "elect",
    meanings: [
      { partOfSpeech: "n.", meaning: "被选中者, [神学]上帝的选民", examples: [] },
      { partOfSpeech: "v.", meaning: "选举, 选择", examples: [] },
      { partOfSpeech: "adj.", meaning: "精选的, 卓越的; 选定的, 选中的, 当选的", examples: [] }
    ]
  },
  {
    word: "ecology",
    meanings: [
      { partOfSpeech: "n.", meaning: "生态, 生态学", examples: [] }
    ]
  },
  {
    word: "replicate",
    meanings: [
      { partOfSpeech: "n.", meaning: "复制品", examples: [] },
      { partOfSpeech: "v.", meaning: "复制, 模拟, 折叠", examples: [] },
      { partOfSpeech: "adj.", meaning: "复制的, 折叠的", examples: [] }
    ]
  },
  {
    word: "reliable",
    meanings: [
      { partOfSpeech: "adj.", meaning: "可靠的, 可信的", examples: [] }
    ]
  },
  {
    word: "edition",
    meanings: [
      { partOfSpeech: "n.", meaning: "版, 版本", examples: [] }
    ]
  },
  {
    word: "dull",
    meanings: [
      { partOfSpeech: "v.", meaning: "迟钝, 变钝; 减轻", examples: [] },
      { partOfSpeech: "adj.", meaning: "钝的, 迟钝的, 呆滞的, 无趣的; 不鲜明的, 阴暗的", examples: [] }
    ]
  },
  {
    word: "agency",
    meanings: [
      { partOfSpeech: "n.", meaning: "代理, 代理处, 政府机构", examples: [] }
    ]
  },
  {
    word: "annual",
    meanings: [
      { partOfSpeech: "n.", meaning: "一年生植物, 年刊, 年报, 年鉴", examples: [] },
      { partOfSpeech: "adj.", meaning: "每年的, 一年一度的", examples: [] }
    ]
  },
  {
    word: "employment",
    meanings: [
      { partOfSpeech: "n.", meaning: "职业, 雇用, 使用", examples: [] }
    ]
  },
  {
    word: "elderly",
    meanings: [
      { partOfSpeech: "adj.", meaning: "年长的, 年老的", examples: [] }
    ]
  },
  {
    word: "acid",
    meanings: [
      { partOfSpeech: "n.", meaning: "酸, 酸性物质, 迷幻药", examples: [] },
      { partOfSpeech: "adj.", meaning: "酸的, 酸性的, 尖酸的, 刻薄的", examples: [] }
    ]
  },
  {
    word: "encouragement",
    meanings: [
      { partOfSpeech: "n.", meaning: "鼓励, 激励", examples: [] }
    ]
  },
  {
    word: "entry",
    meanings: [
      { partOfSpeech: "n.", meaning: "条目, 进入, 入口, 进入权", examples: [] }
    ]
  },
  {
    word: "admission",
    meanings: [
      { partOfSpeech: "n.", meaning: "承认, 许可, 入会费", examples: [] }
    ]
  },
  {
    word: "accurate",
    meanings: [
      { partOfSpeech: "adj.", meaning: "准确的, 精确的", examples: [] }
    ]
  },
  {
    word: "contrast",
    meanings: [
      { partOfSpeech: "n.", meaning: "对比, 差别, 对照物, [计算机]反差", examples: [] },
      { partOfSpeech: "v.", meaning: "对比, 成对照", examples: [] }
    ]
  },
  {
    word: "flavour",
    meanings: [
      { partOfSpeech: "n.", meaning: "味道, 风味, 特色", examples: [] },
      { partOfSpeech: "v.", meaning: "给...调味, 给...增添风趣", examples: [] }
    ]
  },
  {
    word: "ambition",
    meanings: [
      { partOfSpeech: "n.", meaning: "雄心, 野心, 抱负, 精力", examples: [] },
      { partOfSpeech: "v.", meaning: "追求, 有...野心", examples: [] }
    ]
  },
  {
    word: "coal",
    meanings: [
      { partOfSpeech: "n.", meaning: "煤, 木炭", examples: [] },
      { partOfSpeech: "v.", meaning: "加煤, 烧成炭, 供应煤", examples: [] }
    ]
  },
  {
    word: "cycle",
    meanings: [
      { partOfSpeech: "n.", meaning: "周期, 循环, 自行车, 摩托车", examples: [] },
      { partOfSpeech: "v.", meaning: "(骑)自行车, (使)轮转, (使)循环", examples: [] }
    ]
  },
  {
    word: "announce",
    meanings: [
      { partOfSpeech: "v.", meaning: "宣布, 宣告, 预示, 播报", examples: [] }
    ]
  },
  {
    word: "ban",
    meanings: [
      { partOfSpeech: "n.", meaning: "禁止, 禁令", examples: [] },
      { partOfSpeech: "v.", meaning: "禁止, 取缔, 剥夺权利", examples: [] }
    ]
  },
  {
    word: "define",
    meanings: [
      { partOfSpeech: "v.", meaning: "定义, 解释, 规定, 限定", examples: [] }
    ]
  },
  {
    word: "destroy",
    meanings: [
      { partOfSpeech: "v.", meaning: "破坏, 摧毁, 消灭, 杀死", examples: [] }
    ]
  },
  {
    word: "entertainment",
    meanings: [
      { partOfSpeech: "n.", meaning: "娱乐", examples: [] }
    ]
  },
  {
    word: "personality",
    meanings: [
      { partOfSpeech: "n.", meaning: "个性, 名人, 特色", examples: [] }
    ]
  },
  {
    word: "disappear",
    meanings: [
      { partOfSpeech: "v.", meaning: "消失, 不见, 失踪", examples: [] }
    ]
  },
  {
    word: "drill",
    meanings: [
      { partOfSpeech: "n.", meaning: "钻孔机, 钻子, 播种机, 反复操练, 训练", examples: [] },
      { partOfSpeech: "v.", meaning: "钻(孔), 打(眼); 训练, 练习", examples: [] }
    ]
  },
  {
    word: "electricity",
    meanings: [
      { partOfSpeech: "n.", meaning: "电, 电流, 电学, 热情", examples: [] }
    ]
  },
  {
    word: "distinction",
    meanings: [
      { partOfSpeech: "n.", meaning: "区分, 差别, 荣誉, 优秀", examples: [] }
    ]
  },
  {
    word: "edge",
    meanings: [
      { partOfSpeech: "n.", meaning: "边, 边缘, 优势, 刀口, 刀刃, 尖锐", examples: [] },
      { partOfSpeech: "v.", meaning: "使锋利, 徐徐前进, 渐渐移动, 给...加边", examples: [] }
    ]
  },
  {
    word: "engage",
    meanings: [
      { partOfSpeech: "v.", meaning: "从事, 参加, 啃合, 答应; 使忙于, 占用(时间), 吸引, 雇, 聘, 使订婚", examples: [] }
    ]
  },
  {
    word: "flow",
    meanings: [
      { partOfSpeech: "n.", meaning: "流, 流动, 流量, 涨潮", examples: [] },
      { partOfSpeech: "v.", meaning: "流动, 流畅, 涌出, 飘动, 涌至", examples: [] }
    ]
  },
  {
    word: "rescue",
    meanings: [
      { partOfSpeech: "n.", meaning: "救援, 营救, 抢救", examples: [] },
      { partOfSpeech: "v.", meaning: "救援, 营救, 抢救", examples: [] }
    ]
  },
  {
    word: "resident",
    meanings: [
      { partOfSpeech: "n.", meaning: "居民, 住院医生, 住客, 定居者", examples: [] },
      { partOfSpeech: "adj.", meaning: "居住的, 定居的; 住校的, 住院的", examples: [] }
    ]
  },
  {
    word: "policy",
    meanings: [
      { partOfSpeech: "n.", meaning: "政策, 方针, 保险单", examples: [] }
    ]
  },
  {
    word: "region",
    meanings: [
      { partOfSpeech: "n.", meaning: "地区, 范围, 地带, 领域", examples: [] }
    ]
  },
  {
    word: "refugee",
    meanings: [
      { partOfSpeech: "n.", meaning: "难民", examples: [] }
    ]
  },
  {
    word: "persuade",
    meanings: [
      { partOfSpeech: "v.", meaning: "说服, 劝说", examples: [] }
    ]
  },
  {
    word: "phrase",
    meanings: [
      { partOfSpeech: "n.", meaning: "短语, 词组, 习语, 措辞, [音]乐句", examples: [] },
      { partOfSpeech: "v.", meaning: "措辞, 用语言表达, 叙述", examples: [] }
    ]
  },
  {
    word: "regard",
    meanings: [
      { partOfSpeech: "n.", meaning: "注意, 尊重, 问候, 关心", examples: [] },
      { partOfSpeech: "v.", meaning: "视为, 看作, 尊敬, 注视, 留意", examples: [] }
    ]
  },
  {
    word: "species",
    meanings: [
      { partOfSpeech: "n.", meaning: "种类, (单复同)物种", examples: [] }
    ]
  },
  {
    word: "sunset",
    meanings: [
      { partOfSpeech: "n.", meaning: "日落, 衰落时期(尤指人的晚年)", examples: [] }
    ]
  },
  {
    word: "specific",
    meanings: [
      { partOfSpeech: "n.", meaning: "特效药, 特性, 详情", examples: [] },
      { partOfSpeech: "adj.", meaning: "特殊的, 特定的, 明确的, 详细的, 具有特效的", examples: [] }
    ]
  },
  {
    word: "superior",
    meanings: [
      { partOfSpeech: "n.", meaning: "长者, 高手, 上级", examples: [] },
      { partOfSpeech: "adj.", meaning: "较高的, 上级的, 高傲的, 上好的, 出众的, 上层的", examples: [] }
    ]
  },
  {
    word: "supply",
    meanings: [
      { partOfSpeech: "n.", meaning: "供应, 供应量, 补给品, 贮备", examples: [] },
      { partOfSpeech: "v.", meaning: "供给, 补充, 供应, 提供", examples: [] }
    ]
  }
]

async function importWordMeanings() {
  console.log('🚀 开始导入多词性多释义数据...\n')
  
  let successCount = 0
  let errorCount = 0
  let updateCount = 0
  const errors = []

  for (const wordData of wordsData) {
    try {
      console.log(`\n📝 处理单词: ${wordData.word}`)
      
      // 1. 查找或创建词汇
      let vocabulary = await prisma.vocabularies.findUnique({
        where: { word: wordData.word.toLowerCase() },
        include: { word_meanings: true }
      })

      if (!vocabulary) {
        // 创建新词汇
        vocabulary = await prisma.vocabularies.create({
          data: {
            id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            word: wordData.word.toLowerCase(),
            part_of_speech: wordData.meanings.map(m => m.partOfSpeech),
            primary_meaning: wordData.meanings[0]?.meaning || '',
            secondary_meaning: wordData.meanings[1]?.meaning || null,
            phonetic: wordData.phonetic || null,
            phonetic_us: wordData.phoneticUS || null,
            phonetic_uk: wordData.phoneticUK || null,
            created_at: new Date(),
            updated_at: new Date(),
          }
        })
        console.log(`  ✓ 创建词汇: ${wordData.word}`)
      } else {
        // 更新现有词汇
        await prisma.vocabularies.update({
          where: { id: vocabulary.id },
          data: {
            part_of_speech: wordData.meanings.map(m => m.partOfSpeech),
            primary_meaning: wordData.meanings[0]?.meaning || vocabulary.primary_meaning,
            phonetic: wordData.phonetic || vocabulary.phonetic,
            phonetic_us: wordData.phoneticUS || vocabulary.phonetic_us,
            phonetic_uk: wordData.phoneticUK || vocabulary.phonetic_uk,
            updated_at: new Date(),
          }
        })
        console.log(`  ✓ 更新词汇: ${wordData.word}`)
        updateCount++
      }

      // 2. 删除旧的释义
      if (vocabulary.word_meanings?.length > 0) {
        await prisma.word_meanings.deleteMany({
          where: { vocabularyId: vocabulary.id }
        })
        console.log(`  - 删除旧释义: ${vocabulary.word_meanings.length}条`)
      }

      // 3. 创建新的多词性释义
      for (let i = 0; i < wordData.meanings.length; i++) {
        const meaningData = wordData.meanings[i]
        
        await prisma.word_meanings.create({
          data: {
            id: `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vocabularyId: vocabulary.id,
            partOfSpeech: meaningData.partOfSpeech,
            meaning: meaningData.meaning,
            orderIndex: i,
            examples: meaningData.examples || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })
        
        console.log(`  + 添加释义 [${meaningData.partOfSpeech}]: ${meaningData.meaning.substring(0, 30)}...`)
      }

      successCount++
      
    } catch (error) {
      console.error(`  ❌ 处理失败: ${wordData.word}`)
      console.error(`     ${error.message}`)
      errorCount++
      errors.push({
        word: wordData.word,
        error: error.message
      })
    }
  }

  // 统计报告
  console.log('\n' + '='.repeat(60))
  console.log('📊 导入完成统计')
  console.log('='.repeat(60))
  console.log(`✅ 成功: ${successCount} 个单词`)
  console.log(`🔄 更新: ${updateCount} 个单词`)
  console.log(`❌ 失败: ${errorCount} 个单词`)
  console.log(`📝 总计: ${wordsData.length} 个单词`)
  
  if (errors.length > 0) {
    console.log('\n❌ 错误详情:')
    errors.forEach(err => {
      console.log(`  - ${err.word}: ${err.error}`)
    })
  }

  // 验证数据
  const totalVocabs = await prisma.vocabularies.count()
  const totalMeanings = await prisma.word_meanings.count()
  
  console.log('\n' + '='.repeat(60))
  console.log('📈 数据库状态')
  console.log('='.repeat(60))
  console.log(`📚 总词汇数: ${totalVocabs}`)
  console.log(`📖 总释义数: ${totalMeanings}`)
  console.log(`📊 平均释义: ${(totalMeanings / totalVocabs).toFixed(2)} 个/单词`)
  console.log('='.repeat(60))
}

async function main() {
  try {
    await importWordMeanings()
  } catch (error) {
    console.error('\n❌ 导入失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ 脚本执行完成\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败\n')
    process.exit(1)
  })
