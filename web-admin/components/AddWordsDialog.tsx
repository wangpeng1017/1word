'use client'

import { useState, useEffect } from 'react'
import { Modal, Select, message, Spin } from 'antd'

interface Vocabulary {
  id: string
  word: string
  primaryMeaning: string
  difficulty: string
  isHighFrequency: boolean
}

interface Student {
  id: string
  user?: { name: string }
  name?: string
}

interface AddWordsDialogProps {
  open: boolean
  onClose: () => void
  students: Student[]
  onCompleted: (studentId: string, vocabularyIds: string[]) => void
}

export default function AddWordsDialog({
  open,
  onClose,
  students,
  onCompleted,
}: AddWordsDialogProps) {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabularyIds, setSelectedVocabularyIds] = useState<string[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingVocabularyIds, setExistingVocabularyIds] = useState<Set<string>>(new Set())

  // 加载词汇列表
  useEffect(() => {
    if (open) {
      fetchVocabularies()
    }
  }, [open])

  // 当选择学生时加载已有的学习计划
  useEffect(() => {
    if (open && selectedStudentId) {
      fetchExistingPlans()
    } else {
      setExistingVocabularyIds(new Set())
    }
  }, [open, selectedStudentId])

  const fetchVocabularies = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vocabularies?limit=10000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setVocabularies(result.data?.vocabularies || [])
      }
    } catch (error) {
      message.error('加载词汇列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingPlans = async () => {
    if (!selectedStudentId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/study-plans?studentId=${selectedStudentId}&limit=10000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        const existingIds = new Set(
          result.data.studyPlans.map((plan: any) => plan.vocabularyId)
        )
        setExistingVocabularyIds(existingIds)
      }
    } catch (error) {
      console.error('加载已有学习计划失败:', error)
    }
  }

  const handleOk = async () => {
    if (!selectedStudentId) {
      message.warning('请先选择学生')
      return
    }
    if (selectedVocabularyIds.length === 0) {
      message.warning('请至少选择一个词汇')
      return
    }

    setSubmitting(true)
    try {
      await onCompleted(selectedStudentId, selectedVocabularyIds)
      setSelectedVocabularyIds([])
      setSelectedStudentId(undefined)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedVocabularyIds([])
    setSelectedStudentId(undefined)
    onClose()
  }

  // 过滤掉已存在的词汇
  const availableVocabularies = vocabularies.filter(
    (v) => !existingVocabularyIds.has(v.id)
  )

  return (
    <Modal
      title="为学生添加词汇"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      width={600}
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>选择学生:</p>
          <Select
            showSearch
            placeholder="请选择学生"
            style={{ width: '100%', marginBottom: 16 }}
            value={selectedStudentId}
            onChange={(val) => {
              setSelectedStudentId(val)
              setSelectedVocabularyIds([])
            }}
            optionFilterProp="children"
            options={students.map((s) => ({
              label: s.user?.name || s.name || '',
              value: s.id,
            }))}
          />
          <p style={{ color: '#666', marginBottom: 8 }}>
            选择要添加到学习计划的词汇{selectedStudentId ? '（已排除该学生已有的词汇）' : ''}:
          </p>
          <Select
            mode="multiple"
            showSearch
            placeholder="请选择词汇"
            style={{ width: '100%' }}
            value={selectedVocabularyIds}
            onChange={setSelectedVocabularyIds}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={availableVocabularies.map((v) => ({
              label: `${v.word} - ${v.primaryMeaning}`,
              value: v.id,
            }))}
            maxTagCount="responsive"
          />
          <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            可用词汇数：{availableVocabularies.length} / 总词汇数：{vocabularies.length}
          </p>
        </div>
      </Spin>
    </Modal>
  )
}
