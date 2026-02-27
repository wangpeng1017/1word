/**
 * @file generate-check-sql.ts
 * @desc 读取 word-doc-answers.json，生成 SQL 直接在数据库中检查答案是否正确
 */

import * as fs from 'fs'
import * as path from 'path'

interface WordQuestion {
    word: string
    meaning: string
    questionType: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    options: { label: string; content: string }[]
    correctAnswer: string
    correctContent: string
}

const data: WordQuestion[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'word-doc-answers.json'), 'utf8')
)

// 按类型分组
const c2e = data.filter(q => q.questionType === 'CHINESE_TO_ENGLISH')
const e2c = data.filter(q => q.questionType === 'ENGLISH_TO_CHINESE')
const fill = data.filter(q => q.questionType === 'FILL_IN_BLANK')

let sql = ''

// ======== 第一步: 中选英 - 简单检查 ========
// 中选英: 数据库中正确选项的 content 应该等于单词本身
sql += `-- ====================================
-- 第一步: 检查中选英题 (CHINESE_TO_ENGLISH)
-- 规则: 正确选项的 content 应该等于单词本身
-- ====================================
SELECT v.word, q.type, q.correctAnswer, qo.content AS db_correct_content
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE q.type = 'CHINESE_TO_ENGLISH'
  AND LOWER(qo.content) != LOWER(v.word)
ORDER BY v.word;

`

// ======== 第二步: 填空题 - 检查正确选项是否以单词开头 ========
sql += `-- ====================================
-- 第二步: 检查填空题 (FILL_IN_BLANK)
-- 规则: 正确选项的 content 应该以单词开头
-- 排除已知的变体形式
-- ====================================
SELECT v.word, q.type, q.correctAnswer, qo.content AS db_correct_content
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE q.type = 'FILL_IN_BLANK'
  AND NOT (LOWER(qo.content) LIKE CONCAT(LOWER(v.word), '%'))
ORDER BY v.word;

`

// ======== 第三步: 英选中 - 需要逐个对比 ========
// 英选中题的正确答案是中文，需要知道每个单词期望的正确中文内容

// 转义 MySQL 字符串
function esc(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// 生成临时表插入语句，每个 batch 500 行
sql += `-- ====================================
-- 第三步: 检查英选中题 (ENGLISH_TO_CHINESE)
-- 用 Word 文档中的正确答案内容对比数据库
-- ====================================

CREATE TEMPORARY TABLE expected_e2c (
  word VARCHAR(100),
  correct_content VARCHAR(500)
);

`

const batchSize = 200
for (let i = 0; i < e2c.length; i += batchSize) {
    const batch = e2c.slice(i, i + batchSize)
    sql += `INSERT INTO expected_e2c (word, correct_content) VALUES\n`
    sql += batch.map(q => `  ('${esc(q.word)}', '${esc(q.correctContent)}')`).join(',\n')
    sql += ';\n\n'
}

sql += `-- 对比: 数据库的正确答案 vs Word文档期望答案
SELECT 
    e.word,
    e.correct_content AS word_doc_correct,
    qo.content AS db_correct,
    q.correctAnswer AS db_answer_label
FROM expected_e2c e
JOIN vocabularies v ON v.word = e.word
JOIN questions q ON q.vocabularyId = v.id AND q.type = 'ENGLISH_TO_CHINESE'
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE qo.content != e.correct_content
ORDER BY e.word;

DROP TEMPORARY TABLE expected_e2c;

`

// ======== 第四步: 检查 填空题 的精确匹配 ========
sql += `-- ====================================
-- 第四步: 精确检查填空题 (FILL_IN_BLANK)
-- 用 Word 文档中的正确答案内容对比数据库
-- ====================================

CREATE TEMPORARY TABLE expected_fill (
  word VARCHAR(100),
  correct_content VARCHAR(500)
);

`

for (let i = 0; i < fill.length; i += batchSize) {
    const batch = fill.slice(i, i + batchSize)
    sql += `INSERT INTO expected_fill (word, correct_content) VALUES\n`
    sql += batch.map(q => `  ('${esc(q.word)}', '${esc(q.correctContent)}')`).join(',\n')
    sql += ';\n\n'
}

sql += `-- 对比
SELECT 
    e.word,
    e.correct_content AS word_doc_correct,
    qo.content AS db_correct,
    q.correctAnswer AS db_answer_label
FROM expected_fill e
JOIN vocabularies v ON v.word = e.word
JOIN questions q ON q.vocabularyId = v.id AND q.type = 'FILL_IN_BLANK'
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE LOWER(qo.content) != LOWER(e.correct_content)
ORDER BY e.word;

DROP TEMPORARY TABLE expected_fill;

`

// ======== 第五步: 中选英精确检查 ========
sql += `-- ====================================
-- 第五步: 精确检查中选英 (CHINESE_TO_ENGLISH)
-- ====================================

CREATE TEMPORARY TABLE expected_c2e (
  word VARCHAR(100),
  correct_content VARCHAR(500)
);

`

for (let i = 0; i < c2e.length; i += batchSize) {
    const batch = c2e.slice(i, i + batchSize)
    sql += `INSERT INTO expected_c2e (word, correct_content) VALUES\n`
    sql += batch.map(q => `  ('${esc(q.word)}', '${esc(q.correctContent)}')`).join(',\n')
    sql += ';\n\n'
}

sql += `-- 对比
SELECT 
    e.word,
    e.correct_content AS word_doc_correct,
    qo.content AS db_correct,
    q.correctAnswer AS db_answer_label
FROM expected_c2e e
JOIN vocabularies v ON v.word = e.word
JOIN questions q ON q.vocabularyId = v.id AND q.type = 'CHINESE_TO_ENGLISH'
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE LOWER(qo.content) != LOWER(e.correct_content)
ORDER BY e.word;

DROP TEMPORARY TABLE expected_c2e;
`

// 写入文件
const outPath = path.join(__dirname, 'check-answers.sql')
fs.writeFileSync(outPath, sql, 'utf8')
console.log(`SQL 已生成: ${outPath}`)
console.log(`中选英: ${c2e.length} 道, 英选中: ${e2c.length} 道, 填空: ${fill.length} 道`)
