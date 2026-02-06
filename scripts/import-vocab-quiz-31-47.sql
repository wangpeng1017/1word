-- 导入词汇量测试题目 31-47（形近词辨析题）
-- 这些题目是汉译英题型，测试形近词辨析能力

-- 31. 剥去
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_31_', UNIX_TIMESTAMP() * 1000), 31, '', '以下哪个单词是 "剥去"的含义', 'CHINESE_TO_ENGLISH', 'strip', 'stripe', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 32. 地位
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_32_', UNIX_TIMESTAMP() * 1000 + 1), 32, '', '以下哪个单词是 "地位"的含义', 'CHINESE_TO_ENGLISH', 'statue', 'status', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 33. 明智的
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_33_', UNIX_TIMESTAMP() * 1000 + 2), 33, '', '以下哪个单词是 "明智的"的含义', 'CHINESE_TO_ENGLISH', 'sensible', 'sensitive', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 34. 文具
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_34_', UNIX_TIMESTAMP() * 1000 + 3), 34, '', '以下哪个单词是 "文具"的含义', 'CHINESE_TO_ENGLISH', 'stationary', 'stationery', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 35. 原则
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_35_', UNIX_TIMESTAMP() * 1000 + 4), 35, '', '以下哪个单词是 "原则"的含义', 'CHINESE_TO_ENGLISH', 'principle', 'principal', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 36. 道德的
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_36_', UNIX_TIMESTAMP() * 1000 + 5), 36, '', '以下哪个单词是 "道德的"的含义', 'CHINESE_TO_ENGLISH', 'moral', 'morale', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 37. 掌控
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_37_', UNIX_TIMESTAMP() * 1000 + 6), 37, '', '以下哪个单词是 "掌控"的含义', 'CHINESE_TO_ENGLISH', 'command', 'commend', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 38. 良心
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_38_', UNIX_TIMESTAMP() * 1000 + 7), 38, '', '以下哪个单词是 "良心"的含义', 'CHINESE_TO_ENGLISH', 'conscious', 'conscience', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 39. 文学的
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_39_', UNIX_TIMESTAMP() * 1000 + 8), 39, '', '以下哪个单词是 "文学的"的含义', 'CHINESE_TO_ENGLISH', 'literal', 'literary', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 40. 赞赏
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_40_', UNIX_TIMESTAMP() * 1000 + 9), 40, '', '以下哪个单词是 "赞赏"的含义', 'CHINESE_TO_ENGLISH', 'complement', 'compliment', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 41. 体面的（注意：正确答案是D）
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_41_', UNIX_TIMESTAMP() * 1000 + 10), 41, '', '以下哪个单词是 "体面的"的含义', 'CHINESE_TO_ENGLISH', 'descend', 'descent', '不知道', 'AB选项都不是', '不认识', 'D', 2, 1, NOW(3), NOW(3));

-- 42. 委员会
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_42_', UNIX_TIMESTAMP() * 1000 + 11), 42, '', '以下哪个单词是 "委员会"的含义', 'CHINESE_TO_ENGLISH', 'council', 'counsel', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 43. 内阁
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_43_', UNIX_TIMESTAMP() * 1000 + 12), 43, '', '以下哪个单词是 "内阁"的含义', 'CHINESE_TO_ENGLISH', 'cabin', 'cabinet', '不知道', 'AB选项都不是', '不认识', 'B', 2, 1, NOW(3), NOW(3));

-- 44. 角度（注意：正确答案是D）
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_44_', UNIX_TIMESTAMP() * 1000 + 13), 44, '', '以下哪个单词是 "角度"的含义', 'CHINESE_TO_ENGLISH', 'ankle', 'angel', '不知道', 'AB选项都不是', '不认识', 'D', 2, 1, NOW(3), NOW(3));

-- 45. 上升
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_45_', UNIX_TIMESTAMP() * 1000 + 14), 45, '', '以下哪个单词是 "上升"的含义', 'CHINESE_TO_ENGLISH', 'ascent', 'accent', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 46. 相当重要的
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_46_', UNIX_TIMESTAMP() * 1000 + 15), 46, '', '以下哪个单词是 "相当重要的"的含义', 'CHINESE_TO_ENGLISH', 'considerable', 'considerate', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 47. 尤其地
INSERT INTO vocabulary_quiz_questions (id, questionNo, word, questionText, questionType, optionA, optionB, optionC, optionD, optionE, correctOption, difficulty, isActive, createdAt, updatedAt)
VALUES (CONCAT('vqq_47_', UNIX_TIMESTAMP() * 1000 + 16), 47, '', '以下哪个单词是 "尤其地"的含义', 'CHINESE_TO_ENGLISH', 'particularly', 'previously', '不知道', 'AB选项都不是', '不认识', 'A', 2, 1, NOW(3), NOW(3));

-- 验证导入结果
SELECT COUNT(*) as total_questions FROM vocabulary_quiz_questions WHERE isActive = 1;
SELECT questionNo, questionText, correctOption FROM vocabulary_quiz_questions WHERE questionNo BETWEEN 31 AND 47 ORDER BY questionNo;
