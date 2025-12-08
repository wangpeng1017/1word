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

interface AddWordsDialogProps {
  open: boolean
  onClose: () => void
  studentId: string | undefined
  onCompleted: (vocabularyIds: string[]) => void
}

export default function AddWordsDialog({
  open,
  onClose,
  studentId,
  onCompleted,
}: AddWordsDialogProps) {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabularyIds, setSelectedVocabularyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingVocabularyIds, setExistingVocabularyIds] = useState<Set<string>>(new Set())

  // 加载词汇列表和已有的学习计划
  useEffect(() => {
    if (open && studentId) {
      fetchVocabularies()
      fetchExistingPlans()
    }
  }, [open, studentId])

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
    if (!studentId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/study-plans?studentId=${studentId}&limit=10000`, {
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
    if (selectedVocabularyIds.length === 0) {
      message.warning('请至少选择一个词汇')
      return
    }

    setSubmitting(true)
    try {
      await onCompleted(selectedVocabularyIds)
      setSelectedVocabularyIds([])
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedVocabularyIds([])
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
          <p style={{ color: '#666', marginBottom: 8 }}>
            选择要添加到学习计划的词汇（已排除该学生已有的词汇）
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
