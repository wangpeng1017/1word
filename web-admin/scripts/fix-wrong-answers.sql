-- ============================================================
-- 修复题库答案标记错误
-- 日期: 2026-02-14
-- 影响范围: 仅修改特定单词的特定题型，不影响其他数据
-- ============================================================
-- 使用事务确保原子性
START TRANSACTION;

-- ============================================================
-- 第一部分：修复 FILL_IN_BLANK 填空题 (22道)
-- 问题: startsWith() 匹配把较长单词错标为正确
-- 修复: 将 isCorrect 从错误选项移到正确选项(单词原形)
-- ============================================================

-- 通用修复逻辑：先把该题所有选项标为 false，再把匹配单词原形的选项标为 true
-- 同时更新 questions.correctAnswer 为正确选项的标签(A/B/C/D)

-- 创建临时表存储需要修复的填空题
CREATE TEMPORARY TABLE fix_fill_blank AS
SELECT q.id AS question_id, v.word, qo_correct.id AS correct_option_id,
       CASE qo_correct.`order`
         WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D'
       END AS correct_label
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo_correct ON qo_correct.questionId = q.id
  AND LOWER(qo_correct.content) = LOWER(v.word)
WHERE q.type = 'FILL_IN_BLANK'
  AND v.word IN (
    'accuse', 'adore', 'affair', 'affirm', 'ancestor',
    'ash', 'blank', 'brake', 'brick', 'bubble',
    'buck', 'candidate', 'centimeter', 'chemical', 'consume',
    'critic', 'destroy', 'dinosaur', 'disc', 'dominate',
    'dot', 'emit'
  )
  -- 只修复当前确实标错的题(正确选项没被标记为true)
  AND qo_correct.isCorrect = 0;

-- 查看将要修复的数据(可先 SELECT 验证)
-- SELECT * FROM fix_fill_blank;

-- Step 1: 把这些题目的所有选项先标为 false
UPDATE question_options qo
JOIN fix_fill_blank fb ON qo.questionId = fb.question_id
SET qo.isCorrect = 0;

-- Step 2: 把正确的选项标为 true
UPDATE question_options qo
JOIN fix_fill_blank fb ON qo.id = fb.correct_option_id
SET qo.isCorrect = 1;

-- Step 3: 更新 questions 表的 correctAnswer 字段
UPDATE questions q
JOIN fix_fill_blank fb ON q.id = fb.question_id
SET q.correctAnswer = fb.correct_label;

DROP TEMPORARY TABLE fix_fill_blank;


-- ============================================================
-- 第二部分：修复 ENGLISH_TO_CHINESE 英选中题 - 正确答案标错 (12道)
-- 问题: includes() 匹配把部分释义错标为正确
-- 修复: 将 isCorrect 移到最匹配释义(最长匹配)的选项
-- ============================================================

-- 这些单词的正确答案应该是选项中包含完整释义的那个
-- 手动指定每个单词应该选哪个选项内容

CREATE TEMPORARY TABLE fix_e2c (
  word VARCHAR(100),
  wrong_content VARCHAR(200),
  correct_content VARCHAR(200)
);

INSERT INTO fix_e2c (word, wrong_content, correct_content) VALUES
  -- 正确答案标错: 应该选完整释义而非部分释义
  ('buck',        '美元',        '美元；雄鹿'),
  ('cafeteria',   '餐厅',        '自助餐厅'),
  ('cast',        '投掷',        '投掷；演员阵容'),
  ('centimeter',  '米',          '厘米'),
  ('competition', '有竞争力的',   '竞争'),
  ('conclude',    '结论',        '下结论'),
  ('critic',      '批评',        '批评家'),
  ('critical',    '批评',        '批评的'),
  ('criticism',   '批评家',       '批评'),
  ('development', '发展的',       '发展'),
  ('disability',  '残疾的',       '残疾'),
  ('electrician', '电',          '电工');

-- 创建修复映射
CREATE TEMPORARY TABLE fix_e2c_ids AS
SELECT q.id AS question_id,
       qo_wrong.id AS wrong_option_id,
       qo_correct.id AS correct_option_id,
       f.word,
       f.correct_content,
       CASE qo_correct.`order`
         WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D'
       END AS correct_label
FROM fix_e2c f
JOIN vocabularies v ON v.word = f.word
JOIN questions q ON q.vocabularyId = v.id AND q.type = 'ENGLISH_TO_CHINESE'
JOIN question_options qo_wrong ON qo_wrong.questionId = q.id
  AND qo_wrong.content = f.wrong_content AND qo_wrong.isCorrect = 1
JOIN question_options qo_correct ON qo_correct.questionId = q.id
  AND qo_correct.content = f.correct_content AND qo_correct.isCorrect = 0;

-- 查看将要修复的数据
-- SELECT * FROM fix_e2c_ids;

-- Step 1: 把错误的选项标为 false
UPDATE question_options qo
JOIN fix_e2c_ids fe ON qo.id = fe.wrong_option_id
SET qo.isCorrect = 0;

-- Step 2: 把正确的选项标为 true
UPDATE question_options qo
JOIN fix_e2c_ids fe ON qo.id = fe.correct_option_id
SET qo.isCorrect = 1;

-- Step 3: 更新 questions 表的 correctAnswer
UPDATE questions q
JOIN fix_e2c_ids fe ON q.id = fe.question_id
SET q.correctAnswer = fe.correct_label;

DROP TEMPORARY TABLE fix_e2c;
DROP TEMPORARY TABLE fix_e2c_ids;


-- ============================================================
-- 验证修复结果
-- ============================================================

-- 验证1: 填空题 - 检查这些单词的填空题正确答案是否指向单词本身
SELECT '=== 验证填空题修复 ===' AS info;
SELECT v.word, q.type, q.correctAnswer,
       qo.content AS marked_correct_content, qo.isCorrect
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE q.type = 'FILL_IN_BLANK'
  AND v.word IN ('ash', 'blank', 'disc', 'dot', 'accuse', 'adore',
                 'affair', 'affirm', 'ancestor', 'brake', 'brick',
                 'bubble', 'buck', 'candidate', 'centimeter', 'chemical',
                 'consume', 'critic', 'destroy', 'dinosaur', 'dominate', 'emit')
ORDER BY v.word;

-- 验证2: 英选中题 - 检查这些单词的正确答案
SELECT '=== 验证英选中修复 ===' AS info;
SELECT v.word, q.type, q.correctAnswer,
       qo.content AS marked_correct_content, qo.isCorrect
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE q.type = 'ENGLISH_TO_CHINESE'
  AND v.word IN ('buck', 'cafeteria', 'cast', 'centimeter', 'competition',
                 'conclude', 'critic', 'critical', 'criticism',
                 'development', 'disability', 'electrician')
ORDER BY v.word;

-- 验证3: 确保每道题只有一个正确答案
SELECT '=== 检查是否有多个正确答案 ===' AS info;
SELECT q.id, v.word, q.type, COUNT(*) AS correct_count
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo ON qo.questionId = q.id AND qo.isCorrect = 1
WHERE v.word IN ('accuse', 'adore', 'affair', 'affirm', 'ancestor',
                 'ash', 'blank', 'brake', 'brick', 'bubble', 'buck',
                 'cafeteria', 'candidate', 'cast', 'centimeter', 'chemical',
                 'competition', 'conclude', 'consume', 'critic', 'critical',
                 'criticism', 'destroy', 'development', 'dinosaur', 'disability',
                 'disc', 'dominate', 'dot', 'electrician', 'emit')
GROUP BY q.id, v.word, q.type
HAVING correct_count != 1;

-- 如果验证通过，提交事务
-- COMMIT;

-- 如果验证不通过，回滚
-- ROLLBACK;
