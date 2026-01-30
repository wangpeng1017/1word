-- =====================================================
-- 新东方 iEnglish 词汇学习系统 - 数据库表结构初始化
-- 数据库: bdcxcx (MySQL 阿里云 RDS)
-- 版本: v1.1
-- 生成时间: 2025-01-28
-- 说明: 无外键约束版本，所有可选字段使用空字符串代替NULL
-- =====================================================

USE bdcxcx;

-- =====================================================
-- 一、用户与认证相关表
-- =====================================================

-- 用户表 (基础用户信息)
-- 注意: email/phone 可选但数据库不允许NULL，使用空字符串代替
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `phone` VARCHAR(191) NOT NULL DEFAULT '',
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'STUDENT',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key` (`email`),
  UNIQUE INDEX `users_phone_key` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 教师表
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `school` VARCHAR(191) NOT NULL DEFAULT '',
  `subject` VARCHAR(191) NOT NULL DEFAULT '英语',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `teachers_user_id_key` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 班级表
-- 注意: teacher_id 可选但数据库不允许NULL，使用空字符串代替
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `teacher_id` VARCHAR(191) NOT NULL DEFAULT '',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学生表
-- 注意: wechat_id 可选但数据库不允许NULL，使用空字符串代替
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `student_no` VARCHAR(191) NOT NULL,
  `class_id` VARCHAR(191) NOT NULL,
  `wechat_id` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `students_user_id_key` (`user_id`),
  UNIQUE INDEX `students_student_no_key` (`student_no`),
  UNIQUE INDEX `students_wechat_id_key` (`wechat_id`),
  INDEX `students_class_id_idx` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 二、词汇相关表
-- =====================================================

-- 词汇主表
-- 注意: JSON字段默认值使用 (json_array()) 代替 ('[]')
CREATE TABLE IF NOT EXISTS `vocabularies` (
  `id` VARCHAR(191) NOT NULL,
  `word` VARCHAR(191) NOT NULL,
  `part_of_speech` JSON NOT NULL,
  `primary_meaning` VARCHAR(191) NOT NULL,
  `secondary_meaning` VARCHAR(191) NOT NULL DEFAULT '',
  `phonetic` VARCHAR(191) NOT NULL DEFAULT '',
  `phonetic_us` VARCHAR(191) NOT NULL DEFAULT '',
  `phonetic_uk` VARCHAR(191) NOT NULL DEFAULT '',
  `audio_url` VARCHAR(191) NOT NULL DEFAULT '',
  `is_high_frequency` TINYINT(1) NOT NULL DEFAULT 0,
  `difficulty` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `vocabularies_word_key` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 单词释义表
-- 注意: JSON字段默认值问题，移除DEFAULT
CREATE TABLE IF NOT EXISTS `word_meanings` (
  `id` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `partOfSpeech` VARCHAR(191) NOT NULL COMMENT '词性: n., v., adj., adv., prep., conj., pron., etc.',
  `meaning` VARCHAR(191) NOT NULL COMMENT '该词性下的释义',
  `orderIndex` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  `examples` JSON NOT NULL COMMENT '例句数组',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `word_meanings_vocabularyId_idx` (`vocabularyId`),
  INDEX `word_meanings_partOfSpeech_idx` (`partOfSpeech`),
  INDEX `word_meanings_vocabularyId_orderIndex_idx` (`vocabularyId`, `orderIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 单词音频表
CREATE TABLE IF NOT EXISTS `word_audios` (
  `id` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `audioUrl` VARCHAR(191) NOT NULL,
  `accent` VARCHAR(191) NOT NULL DEFAULT 'US',
  `duration` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 单词图片表
CREATE TABLE IF NOT EXISTS `word_images` (
  `id` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 题目表
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `type` ENUM('ENGLISH_TO_CHINESE', 'CHINESE_TO_ENGLISH', 'LISTENING', 'FILL_IN_BLANK') NOT NULL,
  `content` VARCHAR(191) NOT NULL,
  `sentence` VARCHAR(191) NOT NULL DEFAULT '',
  `audioUrl` VARCHAR(191) NOT NULL DEFAULT '',
  `correctAnswer` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 题目选项表
CREATE TABLE IF NOT EXISTS `question_options` (
  `id` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `content` VARCHAR(191) NOT NULL,
  `isCorrect` TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 三、学习计划与任务表
-- =====================================================

-- 每日任务表
CREATE TABLE IF NOT EXISTS `daily_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `taskDate` DATE NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'INTERRUPTED') NOT NULL DEFAULT 'PENDING',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `daily_tasks_studentId_vocabularyId_taskDate_key` (`studentId`, `vocabularyId`, `taskDate`),
  INDEX `daily_tasks_studentId_taskDate_idx` (`studentId`, `taskDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习计划表
CREATE TABLE IF NOT EXISTS `study_plans` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `status` ENUM('LEARNING', 'MASTERED') NOT NULL DEFAULT 'LEARNING',
  `reviewCount` INT NOT NULL DEFAULT 0,
  `lastReviewAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `nextReviewAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `study_plans_studentId_vocabularyId_key` (`studentId`, `vocabularyId`),
  INDEX `study_plans_studentId_status_idx` (`studentId`, `status`),
  INDEX `study_plans_studentId_nextReviewAt_idx` (`studentId`, `nextReviewAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习记录表
CREATE TABLE IF NOT EXISTS `study_records` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `taskDate` DATE NOT NULL,
  `totalWords` INT NOT NULL,
  `completedWords` INT NOT NULL,
  `correctCount` INT NOT NULL,
  `wrongCount` INT NOT NULL,
  `accuracy` DOUBLE NOT NULL,
  `totalTime` INT NOT NULL,
  `startedAt` DATETIME(3) NOT NULL,
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isCompleted` TINYINT(1) NOT NULL DEFAULT 0,
  `isRetestMode` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为错题重测模式',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
  `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `study_records_studentId_taskDate_idx` (`studentId`, `taskDate`),
  INDEX `study_records_studentId_status_idx` (`studentId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 连续学习记录表
CREATE TABLE IF NOT EXISTS `study_streaks` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `currentStreak` INT NOT NULL DEFAULT 0 COMMENT '当前连续天数',
  `longestStreak` INT NOT NULL DEFAULT 0 COMMENT '最长连续天数',
  `lastStudyDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后学习日期',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `study_streaks_studentId_key` (`studentId`),
  INDEX `study_streaks_currentStreak_idx` (`currentStreak`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 单词掌握表
CREATE TABLE IF NOT EXISTS `word_masteries` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `totalWrongCount` INT NOT NULL DEFAULT 0,
  `recentAccuracy` DOUBLE NOT NULL DEFAULT 0,
  `consecutiveCorrect` INT NOT NULL DEFAULT 0,
  `isMastered` TINYINT(1) NOT NULL DEFAULT 0,
  `isDifficult` TINYINT(1) NOT NULL DEFAULT 0,
  `lastPracticeAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `word_masteries_studentId_vocabularyId_key` (`studentId`, `vocabularyId`),
  INDEX `word_masteries_studentId_isDifficult_idx` (`studentId`, `isDifficult`),
  INDEX `word_masteries_studentId_isMastered_idx` (`studentId`, `isMastered`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 答题详情表
CREATE TABLE IF NOT EXISTS `question_answers` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `answer` VARCHAR(191) NOT NULL COMMENT '用户的选择/回答',
  `isCorrect` TINYINT(1) NOT NULL COMMENT '是否正确',
  `timeSpent` INT NOT NULL DEFAULT 0 COMMENT '答题耗时（秒）',
  `answeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `question_answers_studentId_vocabularyId_idx` (`studentId`, `vocabularyId`),
  INDEX `question_answers_studentId_answeredAt_idx` (`studentId`, `answeredAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 错题表
CREATE TABLE IF NOT EXISTS `wrong_questions` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `wrongAnswer` VARCHAR(191) NOT NULL,
  `correctAnswer` VARCHAR(191) NOT NULL,
  `wrongCount` INT NOT NULL DEFAULT 1 COMMENT '答错次数',
  `correctCount` INT NOT NULL DEFAULT 0 COMMENT '重测答对次数',
  `status` ENUM('ACTIVE', 'CONFIRMED', 'MASTERED') NOT NULL DEFAULT 'ACTIVE' COMMENT '错题状态:活跃/待确认/已掌握',
  `wrongAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastReviewAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后复习时间',
  PRIMARY KEY (`id`),
  INDEX `wrong_questions_studentId_vocabularyId_idx` (`studentId`, `vocabularyId`),
  INDEX `wrong_questions_studentId_status_idx` (`studentId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 四、测试相关表
-- =====================================================

-- 水平测试表
-- 注意: JSON字段移除DEFAULT
CREATE TABLE IF NOT EXISTS `proficiency_tests` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT '测试名称，如"高考核心词汇测试"',
  `description` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '测试描述',
  `vocabularyIds` JSON NOT NULL COMMENT '测试包含的词汇ID列表',
  `totalWords` INT NOT NULL COMMENT '总词汇数',
  `passScore` INT NOT NULL DEFAULT 60 COMMENT '及格分数',
  `duration` INT NOT NULL DEFAULT 0 COMMENT '测试时长（分钟），0表示不限时',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `createdBy` VARCHAR(191) NOT NULL COMMENT '创建者（教师ID）',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `proficiency_tests_isActive_idx` (`isActive`),
  INDEX `proficiency_tests_createdBy_idx` (`createdBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 测试记录表
-- 注意: JSON字段移除DEFAULT
CREATE TABLE IF NOT EXISTS `test_records` (
  `id` VARCHAR(191) NOT NULL,
  `testId` VARCHAR(191) NOT NULL COMMENT '测试ID',
  `studentId` VARCHAR(191) NOT NULL COMMENT '学生ID',
  `totalQuestions` INT NOT NULL COMMENT '总题数',
  `correctCount` INT NOT NULL COMMENT '正确数',
  `wrongCount` INT NOT NULL COMMENT '错数',
  `score` INT NOT NULL COMMENT '得分',
  `accuracy` DOUBLE NOT NULL COMMENT '正确率',
  `totalTime` INT NOT NULL COMMENT '总用时（秒）',
  `startedAt` DATETIME(3) NOT NULL COMMENT '开始时间',
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '完成时间',
  `isCompleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
  `answers` JSON NOT NULL COMMENT '答题详情 [{vocabularyId, questionId, answer, isCorrect}]',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `test_records_testId_idx` (`testId`),
  INDEX `test_records_studentId_idx` (`studentId`),
  INDEX `test_records_studentId_testId_idx` (`studentId`, `testId`),
  INDEX `test_records_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 词汇量测试题目表
CREATE TABLE IF NOT EXISTS `vocabulary_quiz_questions` (
  `id` VARCHAR(191) NOT NULL,
  `questionNo` INT NOT NULL COMMENT '题号 1-50',
  `word` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '单词（英译汉题型必填）',
  `questionText` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '题目文本（汉译英题型必填）',
  `questionType` ENUM('ENGLISH_TO_CHINESE', 'CHINESE_TO_ENGLISH', 'CONFUSABLE_WORDS') NOT NULL DEFAULT 'ENGLISH_TO_CHINESE',
  `optionA` VARCHAR(191) NOT NULL,
  `optionB` VARCHAR(191) NOT NULL,
  `optionC` VARCHAR(191) NOT NULL,
  `optionD` VARCHAR(191) NOT NULL DEFAULT '以上都不对',
  `optionE` VARCHAR(191) NOT NULL DEFAULT '不认识',
  `correctOption` VARCHAR(191) NOT NULL COMMENT '正确选项 A/B/C/D',
  `difficulty` INT NOT NULL DEFAULT 1 COMMENT '难度等级 1-3',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `vocabulary_quiz_questions_word_idx` (`word`),
  INDEX `vocabulary_quiz_questions_questionType_idx` (`questionType`),
  INDEX `vocabulary_quiz_questions_difficulty_idx` (`difficulty`),
  INDEX `vocabulary_quiz_questions_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 词汇量测试记录表
CREATE TABLE IF NOT EXISTS `vocabulary_quiz_records` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `totalQuestions` INT NOT NULL COMMENT '总题数',
  `correctCount` INT NOT NULL COMMENT '正确数',
  `wrongCount` INT NOT NULL COMMENT '错数',
  `unknownCount` INT NOT NULL DEFAULT 0 COMMENT '选"不认识"数量',
  `estimatedVocab` INT NOT NULL COMMENT '估算词汇量',
  `accuracy` DOUBLE NOT NULL COMMENT '正确率',
  `totalTime` INT NOT NULL COMMENT '总用时（秒）',
  `startedAt` DATETIME(3) NOT NULL,
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isCompleted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `vocabulary_quiz_records_studentId_idx` (`studentId`),
  INDEX `vocabulary_quiz_records_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 词汇量测试答题详情表
CREATE TABLE IF NOT EXISTS `vocabulary_quiz_answers` (
  `id` VARCHAR(191) NOT NULL,
  `recordId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `userAnswer` VARCHAR(191) NOT NULL COMMENT '用户选择 A/B/C/D/E',
  `isCorrect` TINYINT(1) NOT NULL,
  `timeSpent` INT NOT NULL DEFAULT 0 COMMENT '答题耗时（秒）',
  PRIMARY KEY (`id`),
  INDEX `vocabulary_quiz_answers_recordId_idx` (`recordId`),
  INDEX `vocabulary_quiz_answers_questionId_idx` (`questionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 五、词汇包相关表
-- =====================================================

-- 词汇包表
CREATE TABLE IF NOT EXISTS `vocabulary_packs` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT '如"高考核心词汇10天班"',
  `description` VARCHAR(191) NOT NULL DEFAULT '',
  `totalDays` INT NOT NULL COMMENT '总天数，如10、20',
  `totalWords` INT NOT NULL DEFAULT 0 COMMENT '总词汇数（自动统计）',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdBy` VARCHAR(191) NOT NULL COMMENT '创建者教师ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `vocabulary_packs_name_key` (`name`),
  INDEX `vocabulary_packs_isActive_idx` (`isActive`),
  INDEX `vocabulary_packs_createdBy_idx` (`createdBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 词汇包天数表
CREATE TABLE IF NOT EXISTS `vocabulary_pack_days` (
  `id` VARCHAR(191) NOT NULL,
  `packId` VARCHAR(191) NOT NULL,
  `dayNumber` INT NOT NULL COMMENT '1, 2, 3...',
  `title` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '"Day1 - 基础动词"',
  `wordCount` INT NOT NULL DEFAULT 0 COMMENT '该天词汇数（自动统计）',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `vocabulary_pack_days_packId_dayNumber_key` (`packId`, `dayNumber`),
  INDEX `vocabulary_pack_days_packId_idx` (`packId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 词汇包每日单词关联表
CREATE TABLE IF NOT EXISTS `vocabulary_pack_day_words` (
  `id` VARCHAR(191) NOT NULL,
  `packDayId` VARCHAR(191) NOT NULL,
  `vocabularyId` VARCHAR(191) NOT NULL,
  `orderIndex` INT NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `vocabulary_pack_day_words_packDayId_vocabularyId_key` (`packDayId`, `vocabularyId`),
  INDEX `vocabulary_pack_day_words_packDayId_idx` (`packDayId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 班级词汇包关联表
CREATE TABLE IF NOT EXISTS `plan_classes` (
  `id` VARCHAR(191) NOT NULL,
  `class_id` VARCHAR(191) NOT NULL,
  `pack_id` VARCHAR(191) NOT NULL COMMENT '词汇库ID（必填）',
  `status` ENUM('ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `start_date` DATE NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `plan_classes_class_id_pack_id_key` (`class_id`, `pack_id`),
  INDEX `plan_classes_class_id_idx` (`class_id`),
  INDEX `plan_classes_status_idx` (`status`),
  INDEX `plan_classes_pack_id_idx` (`pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 六、积分与成就系统表
-- =====================================================

-- 学生积分表
CREATE TABLE IF NOT EXISTS `student_points` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `totalPoints` INT NOT NULL DEFAULT 0 COMMENT '总积分',
  `dailyPoints` INT NOT NULL DEFAULT 0 COMMENT '今日积分',
  `weeklyPoints` INT NOT NULL DEFAULT 0 COMMENT '本周积分',
  `monthlyPoints` INT NOT NULL DEFAULT 0 COMMENT '本月积分',
  `level` INT NOT NULL DEFAULT 1 COMMENT '等级',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `student_points_studentId_key` (`studentId`),
  INDEX `student_points_totalPoints_idx` (`totalPoints`),
  INDEX `student_points_level_idx` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分历史表
CREATE TABLE IF NOT EXISTS `point_history` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `points` INT NOT NULL COMMENT '积分变化（正数为增加，负数为减少）',
  `reason` VARCHAR(191) NOT NULL COMMENT '原因（如：完成学习、连续签到、测试通过等）',
  `relatedType` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '关联类型（study_record, test_record, achievement等）',
  `relatedId` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '关联ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `point_history_studentId_idx` (`studentId`),
  INDEX `point_history_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 成就表
-- 注意: JSON字段移除DEFAULT
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(191) NOT NULL COMMENT '成就描述',
  `icon` VARCHAR(191) NOT NULL COMMENT '成就图标',
  `type` VARCHAR(191) NOT NULL COMMENT '成就类型(study, test, streak, mastery等)',
  `condition` JSON NOT NULL COMMENT '达成条件(JSON格式)',
  `points` INT NOT NULL DEFAULT 0 COMMENT '奖励积分',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `achievements_type_idx` (`type`),
  INDEX `achievements_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学生成就表
CREATE TABLE IF NOT EXISTS `student_achievements` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `achievementId` VARCHAR(191) NOT NULL,
  `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `student_achievements_studentId_achievementId_key` (`studentId`, `achievementId`),
  INDEX `student_achievements_studentId_idx` (`studentId`),
  INDEX `student_achievements_unlockedAt_idx` (`unlockedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 勋章定义表
CREATE TABLE IF NOT EXISTS `badges` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT '勋章名称',
  `icon` VARCHAR(191) NOT NULL COMMENT '勋章图标 emoji',
  `description` VARCHAR(191) NOT NULL COMMENT '勋章描述',
  `rarity` ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL COMMENT '稀有度: 普通/稀有/史诗/传说',
  `type` VARCHAR(191) NOT NULL DEFAULT 'PRESET' COMMENT '类型: PRESET(预置)/EXCHANGE(兑换)',
  `pointsCost` INT NOT NULL DEFAULT 0 COMMENT '兑换所需积分(仅兑换类勋章)',
  `achievementId` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '关联的成就ID(可选)',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `badges_rarity_idx` (`rarity`),
  INDEX `badges_isActive_idx` (`isActive`),
  INDEX `badges_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学生勋章表
CREATE TABLE IF NOT EXISTS `student_badges` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `badgeId` VARCHAR(191) NOT NULL,
  `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isDisplayed` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否在用户名旁显示',
  `displayOrder` INT NOT NULL DEFAULT 0 COMMENT '显示顺序(1-3)',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `student_badges_studentId_badgeId_key` (`studentId`, `badgeId`),
  INDEX `student_badges_studentId_isDisplayed_idx` (`studentId`, `isDisplayed`),
  INDEX `student_badges_studentId_displayOrder_idx` (`studentId`, `displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 可兑换成就表
CREATE TABLE IF NOT EXISTS `redeemable_achievements` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT '成就名称',
  `icon` VARCHAR(191) NOT NULL COMMENT '图标',
  `description` VARCHAR(191) NOT NULL COMMENT '描述',
  `pointsCost` INT NOT NULL COMMENT '所需积分',
  `category` VARCHAR(191) NOT NULL DEFAULT 'decoration' COMMENT '类别: decoration, badge等',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `redeemable_achievements_isActive_idx` (`isActive`),
  INDEX `redeemable_achievements_pointsCost_idx` (`pointsCost`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 成就兑换记录表
CREATE TABLE IF NOT EXISTS `achievement_redemptions` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `achievementId` VARCHAR(191) NOT NULL,
  `pointsSpent` INT NOT NULL COMMENT '消耗的积分',
  `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `achievement_redemptions_studentId_achievementId_key` (`studentId`, `achievementId`),
  INDEX `achievement_redemptions_studentId_idx` (`studentId`),
  INDEX `achievement_redemptions_redeemedAt_idx` (`redeemedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 七、系统配置与日志表
-- =====================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `system_configs_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
-- 注意: JSON字段允许NULL
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL COMMENT '操作用户ID',
  `userName` VARCHAR(191) NOT NULL COMMENT '操作用户名称（冗余存储）',
  `action` VARCHAR(191) NOT NULL COMMENT '操作类型：CREATE, UPDATE, DELETE, LOGIN, LOGOUT',
  `module` VARCHAR(191) NOT NULL COMMENT '模块：accounts, students, vocabularies 等',
  `target` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作对象描述',
  `targetId` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作对象ID',
  `detail` JSON COMMENT '操作详情（JSON）',
  `ip` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '客户端IP',
  `userAgent` VARCHAR(191) NOT NULL DEFAULT '' COMMENT '浏览器信息',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `operation_logs_userId_idx` (`userId`),
  INDEX `operation_logs_action_idx` (`action`),
  INDEX `operation_logs_module_idx` (`module`),
  INDEX `operation_logs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 执行完成
-- =====================================================
