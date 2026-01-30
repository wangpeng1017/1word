-- =============================================
-- 新东方词汇系统数据库结构补全 SQL
-- 日期: 2026-01-30
-- 说明: 为现有表添加缺失的字段
-- =============================================

-- 1. word_meanings 表添加时间戳字段
ALTER TABLE `word_meanings` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';
ALTER TABLE `word_meanings` ADD COLUMN `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间';

-- 2. questions 表添加 updatedAt 字段
ALTER TABLE `questions` ADD COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 3. 检查表结构（验证用）
SHOW COLUMNS FROM `word_meanings`;
SHOW COLUMNS FROM `questions`;
