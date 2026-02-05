// 用户相关类型
export interface LoginRequest {
  email?: string
  phone?: string
  studentNo?: string
  password: string
}

export interface RegisterRequest {
  email?: string
  phone?: string
  password: string
  name: string
  role: 'TEACHER' | 'STUDENT'
}

// 词汇相关类型
export interface VocabularyMeaningInput {
  partOfSpeech: string
  meaning: string
}

export interface VocabularyCreateInput {
  word: string
  // 新的释义数组格式
  meanings?: VocabularyMeaningInput[]
  // 向后兼容的旧字段
  partOfSpeech?: string[]
  primaryMeaning?: string
  secondaryMeaning?: string
  phonetic?: string
  phoneticUS?: string
  phoneticUK?: string
  isHighFrequency?: boolean
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  // 音频相关
  audioUrlUS?: string
  audioUrlUK?: string
  // 图片相关
  imageUrl?: string
  imageDescription?: string
}


export interface VocabularyWithDetails {
  id: string
  word: string
  partOfSpeech: string[]
  primaryMeaning: string
  secondaryMeaning?: string
  phonetic?: string
  phoneticUS?: string
  phoneticUK?: string
  isHighFrequency: boolean
  difficulty: string
  audios: {
    id: string
    audioUrl: string
    accent: string
  }[]
  images: {
    id: string
    imageUrl: string
    description?: string
  }[]
  questions: {
    id: string
    type: string
    content: string
    correctAnswer: string
    options: {
      id: string
      content: string
      isCorrect: boolean
      order: number
    }[]
  }[]
}

// 题目相关类型
export interface QuestionCreateInput {
  vocabularyId: string
  type: 'ENGLISH_TO_CHINESE' | 'CHINESE_TO_ENGLISH' | 'LISTENING' | 'FILL_IN_BLANK'
  content: string
  audioUrl?: string
  correctAnswer: string
  options: {
    content: string
    isCorrect: boolean
    order: number
  }[]
}

// 学生相关类型
export interface StudentCreateInput {
  name: string
  studentNo: string
  classId?: string
  email?: string
  phone?: string
  password: string
}

export interface StudentImportRow {
  name: string
  studentNo: string
  className?: string
  phone: string // 必填，用于登录
}

// 学习记录相关类型
export interface StudyRecordCreateInput {
  studentId: string
  taskDate: Date
  totalWords: number
  completedWords: number
  correctCount: number
  wrongCount: number
  accuracy: number
  totalTime: number
  startedAt: Date
  completedAt?: Date
  isCompleted: boolean
}

export interface WrongQuestionCreateInput {
  studentId: string
  vocabularyId: string
  questionId: string
  wrongAnswer: string
  correctAnswer: string
}

// 数据导出相关类型
export interface ExportFilter {
  studentIds?: string[]
  classIds?: string[]
  startDate?: Date
  endDate?: Date
  sortBy?: 'word' | 'wrongCount'
  sortOrder?: 'asc' | 'desc'
}

export interface ExportFormat {
  type: 'excel' | 'pdf' | 'word'
  template?: string
}
