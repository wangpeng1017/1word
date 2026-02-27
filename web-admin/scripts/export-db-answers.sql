-- 导出数据库中所有题目的答案信息
-- 格式: word | type | correctAnswer标签 | 正确选项内容 | 所有选项
-- 在堡垒机上执行此 SQL，将结果保存为 CSV

SELECT 
    v.word,
    q.type,
    q.correctAnswer,
    qo_correct.content AS correct_content,
    qo_correct.`order` AS correct_order,
    (SELECT GROUP_CONCAT(
        CONCAT(
            CASE qo.`order` WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D' END,
            '.',
            qo.content,
            IF(qo.isCorrect, '[√]', '')
        ) ORDER BY qo.`order` SEPARATOR '|'
    ) FROM question_options qo WHERE qo.questionId = q.id) AS all_options
FROM questions q
JOIN vocabularies v ON q.vocabularyId = v.id
JOIN question_options qo_correct ON qo_correct.questionId = q.id AND qo_correct.isCorrect = 1
WHERE q.type IN ('CHINESE_TO_ENGLISH', 'ENGLISH_TO_CHINESE', 'FILL_IN_BLANK')
ORDER BY v.word, q.type;
