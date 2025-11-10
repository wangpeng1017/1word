export interface PlanItem {
  studentId: string
  studentName?: string
  classId?: string
  vocabularyId: string
  word?: string
  primaryMeaning?: string | null
  status?: string
  reviewCount?: number
  nextReviewAt?: Date | string | null
  createdAt?: Date | string | null
}

export interface FailedItem {
  studentId: string
  vocabularyId: string
  reason: string
}

export interface PlanClassesResponse {
  createdCount: number
  duplicateCount: number
  updatedCount: number
  failedCount: number
  created: PlanItem[]
  duplicates: PlanItem[]
  updated: PlanItem[]
  failed: FailedItem[]
}