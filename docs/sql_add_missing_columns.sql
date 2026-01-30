-- =============================================
-- 新东方词汇系统数据库结构补全 SQL
-- 日期: 2026-01-30
-- 说明: 为现有表添加缺失的时间戳字段
-- =============================================

-- 1. word_meanings 表添加时间戳字段
ALTER TABLE `word_meanings` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';
ALTER TABLE `word_meanings` ADD COLUMN `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间';

-- 2. questions 表添加 updatedAt 字段
ALTER TABLE `questions` ADD COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 3. word_audios 表添加 createdAt 字段
ALTER TABLE `word_audios` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';

-- 4. word_images 表添加 createdAt 字段
ALTER TABLE `word_images` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';

-- 5. vocabulary_pack_day_words 表如果缺少 createdAt，添加它
-- 检查并添加（如果不存在）
ALTER TABLE `vocabulary_pack_day_words` ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3);

-- =============================================
-- 验证表结构（执行后用此检查）
-- =============================================
-- SHOW COLUMNS FROM `word_meanings`;
-- SHOW COLUMNS FROM `questions`;
-- SHOW COLUMNS FROM `word_audios`;
-- SHOW COLUMNS FROM `word_images`;
