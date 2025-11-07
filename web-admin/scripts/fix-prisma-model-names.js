#!/usr/bin/env node
/**
 * 批量修复Prisma模型名称脚本
 * 
 * 将错误的camelCase模型名称替换为正确的snake_case复数形式
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// 模型名称映射规则
const MODEL_REPLACEMENTS = [
  // 基础模型
  { from: /prisma\.student\./g, to: 'prisma.students.' },
  { from: /prisma\.class\./g, to: 'prisma.classes.' },
  { from: /prisma\.teacher\./g, to: 'prisma.teachers.' },
  
  // 词汇和题目
  { from: /prisma\.vocabulary\./g, to: 'prisma.vocabularies.' },
  { from: /prisma\.question\./g, to: 'prisma.questions.' },
  { from: /prisma\.questionOption\./g, to: 'prisma.question_options.' },
  
  // 学习相关
  { from: /prisma\.studyPlan\./g, to: 'prisma.study_plans.' },
  { from: /prisma\.studyRecord\./g, to: 'prisma.study_records.' },
  { from: /prisma\.dailyTask\./g, to: 'prisma.daily_tasks.' },
  { from: /prisma\.planClass\./g, to: 'prisma.plan_classes.' },
  
  // 掌握度和错题
  { from: /prisma\.wordMastery\./g, to: 'prisma.word_masteries.' },
  { from: /prisma\.wrongQuestion\./g, to: 'prisma.wrong_questions.' },
  
  // 音频和图片
  { from: /prisma\.wordAudio\./g, to: 'prisma.word_audios.' },
  { from: /prisma\.wordImage\./g, to: 'prisma.word_images.' },
]

// 关联字段映射规则
const RELATION_REPLACEMENTS = [
  // include 中的关联
  { from: /\bstudent:\s*\{/g, to: 'students: {' },
  { from: /\bclass:\s*\{/g, to: 'classes: {' },
  { from: /\bteacher:\s*\{/g, to: 'teachers: {' },
  { from: /\bvocabulary:\s*\{/g, to: 'vocabularies: {' },
  { from: /\bquestion:\s*\{/g, to: 'questions: {' },
  { from: /\boptions:\s*\{/g, to: 'question_options: {' },
  { from: /\bstudyPlan:\s*\{/g, to: 'study_plans: {' },
  { from: /\bstudyPlans:\s*\{/g, to: 'study_plans: {' },
  { from: /\bstudyRecords:\s*\{/g, to: 'study_records: {' },
  { from: /\bdailyTasks:\s*\{/g, to: 'daily_tasks: {' },
  { from: /\bwrongQuestions:\s*\{/g, to: 'wrong_questions: {' },
  { from: /\baudios:\s*\{/g, to: 'word_audios: {' },
  { from: /\bimages:\s*\{/g, to: 'word_images: {' },
  
  // 对象属性访问
  { from: /\.student\??\./g, to: '.students.' },
  { from: /\.student\b/g, to: '.students' },
  { from: /\.class\??\./g, to: '.classes.' },
  { from: /\.class\b/g, to: '.classes' },
  { from: /\.teacher\??\./g, to: '.teachers.' },
  { from: /\.teacher\b/g, to: '.teachers' },
  { from: /\.vocabulary\??\./g, to: '.vocabularies.' },
  { from: /\.vocabulary\b/g, to: '.vocabularies' },
]

// 字段名称映射规则（where和data中）
const FIELD_REPLACEMENTS = [
  { from: /\bstudentNo:/g, to: 'student_no:' },
  { from: /\bclassId:/g, to: 'class_id:' },
  { from: /\bteacherId:/g, to: 'teacher_id:' },
  { from: /\buserId:/g, to: 'user_id:' },
  { from: /\bvocabularyId:/g, to: 'vocabularyId:' }, // 保持不变,在应用层转换
  { from: /\bquestionId:/g, to: 'questionId:' }, // 保持不变,在应用层转换
  { from: /\bisActive:/g, to: 'is_active:' },
  { from: /\bisCorrect:/g, to: 'isCorrect:' }, // 保持不变
  { from: /\bisMastered:/g, to: 'isMastered:' }, // 保持不变
  { from: /\bisDifficult:/g, to: 'isDifficult:' }, // 保持不变
  { from: /\bisHighFrequency:/g, to: 'isHighFrequency:' }, // 保持不变
  { from: /\bcreatedAt:/g, to: 'createdAt:' }, // Prisma生成的字段
  { from: /\bupdatedAt:/g, to: 'updatedAt:' }, // Prisma生成的字段
]

async function main() {
  console.log('🔍 扫描API文件...\n')
  
  // 查找所有API route文件
  const files = glob.sync('app/api/**/route.ts', {
    cwd: process.cwd(),
    absolute: true,
  })
  
  console.log(`📁 找到 ${files.length} 个API文件\n`)
  
  let totalChanges = 0
  const changedFiles = []
  
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf-8')
    let content = original
    let fileChanges = 0
    
    // 应用模型名称替换
    for (const { from, to } of MODEL_REPLACEMENTS) {
      const matches = content.match(from)
      if (matches) {
        fileChanges += matches.length
        content = content.replace(from, to)
      }
    }
    
    // 应用关联字段替换
    for (const { from, to } of RELATION_REPLACEMENTS) {
      const matches = content.match(from)
      if (matches) {
        fileChanges += matches.length
        content = content.replace(from, to)
      }
    }
    
    // 如果有修改，保存文件
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8')
      totalChanges += fileChanges
      changedFiles.push({
        file: path.relative(process.cwd(), file),
        changes: fileChanges,
      })
      console.log(`✅ ${path.relative(process.cwd(), file)} (${fileChanges} 处修改)`)
    }
  }
  
  console.log(`\n✨ 完成！共修复 ${totalChanges} 处问题，影响 ${changedFiles.length} 个文件`)
  
  if (changedFiles.length === 0) {
    console.log('\n🎉 没有发现需要修复的问题！')
  }
}

main().catch(console.error)
