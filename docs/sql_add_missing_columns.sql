-- =====================================================
-- 新东方 iEnglish 词汇学习系统 - 数据库字段补全 SQL
-- 数据库: bdcxcx (MySQL 阿里云 RDS)
-- 版本: v1.2
-- 生成时间: 2026-01-30
-- 说明: 为现有表添加 Prisma ORM 所需的时间戳字段
-- =====================================================

USE bdcxcx;

-- =====================================================
-- 执行前检查: 请确认以下表当前缺少相应字段
-- 可用以下命令检查表结构:
-- SHOW COLUMNS FROM `word_meanings`;
-- SHOW COLUMNS FROM `word_audios`;
-- SHOW COLUMNS FROM `word_images`;
-- SHOW COLUMNS FROM `questions`;
-- =====================================================

-- =====================================================
-- 一、词汇相关表字段补全
-- =====================================================

-- 1. word_meanings 表添加时间戳字段
-- 说明: 该表在 Prisma schema 中需要 createdAt 和 updatedAt
ALTER TABLE `word_meanings` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';
ALTER TABLE `word_meanings` ADD COLUMN `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间';

-- 2. word_audios 表添加 createdAt 字段
-- 说明: 该表在 Prisma schema 中需要 createdAt
ALTER TABLE `word_audios` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';

-- 3. word_images 表添加 createdAt 字段
-- 说明: 该表在 Prisma schema 中需要 createdAt
ALTER TABLE `word_images` ADD COLUMN `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';

-- 4. questions 表添加 updatedAt 字段
-- 说明: 该表已有 created_at，需要补充 updatedAt
ALTER TABLE `questions` ADD COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- =====================================================
-- 二、验证表结构（执行后用此检查）
-- =====================================================
-- SHOW COLUMNS FROM `word_meanings`;
-- SHOW COLUMNS FROM `questions`;
-- SHOW COLUMNS FROM `word_audios`;
-- SHOW COLUMNS FROM `word_images`;

-- =====================================================
-- 执行完成
-- 说明: 执行完成后，通知开发人员进行应用重启
-- =====================================================
