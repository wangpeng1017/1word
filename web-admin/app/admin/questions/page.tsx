'use client'

import { useState, useEffect, Suspense } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Upload, message, Tag, Spin } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'
import { useRouter, useSearchParams } from 'next/navigation'

const { TextArea } = Input

interface Question {
  id: string
  type: string
  content: string
  sentence?: string
  audioUrl?: string
  correctAnswer: string
  vocabularyId: string
  vocabulary: {
    word: string
    primaryMeaning: string
  }
  options: Array<{
    id: string
    content: string
    isCorrect: boolean
    order: number
  }>
  createdAt: string
}

const questionTypeMap: Record<string, { label: string; color: string }> = {
  ENGLISH_TO_CHINESE: { label: '英选汉', color: 'blue' },
  CHINESE_TO_ENGLISH: { label: '汉选英', color: 'green' },
  LISTENING: { label: '听音选词', color: 'purple' },
  FILL_IN_BLANK: { label: '选词填空', color: 'orange' },
}

function QuestionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [vocabularies, setVocabularies] = useState<Array<{ id: string; word: string }>>([])

  // 从 URL 参数获取筛选条件
  const urlVocabularyId = searchParams.get('vocabularyId')
  const urlWord = searchParams.get('word')

  // 用户手动选择的筛选条件（优先级低于 URL 参数）
  const [manualFilters, setManualFilters] = useState<{
    vocabularyId?: string
    type?: string
  }>({})

  // 实际使用的 vocabularyId：URL 参数优先，否则用用户手动选择
  const activeVocabularyId = urlVocabularyId || manualFilters.vocabularyId
  const activeType = manualFilters.type

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [shownMessage, setShownMessage] = useState(false)

  // 显示 URL 筛选提示（只显示一次）
  useEffect(() => {
    if (urlWord && urlVocabularyId && !shownMessage) {
      message.info(`已筛选词汇: ${urlWord}`)
      setShownMessage(true)
    }
  }, [urlVocabularyId, urlWord, shownMessage])

  // 加载词汇列表
  useEffect(() => {
    fetchVocabularies()
  }, [])

  // 加载题目列表 - 依赖分页和筛选条件
  useEffect(() => {
    fetchQuestions()
  }, [pagination.current, pagination.pageSize, activeVocabularyId, activeType])

  const fetchVocabularies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vocabularies?limit=5000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setVocabularies(data.data.vocabularies)
      }
    } catch (error) {
      console.error('获取词汇列表失败', error)
    }
  }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
      })

      if (activeVocabularyId) {
        params.append('vocabularyId', activeVocabularyId)
      }
      if (activeType) {
        params.append('type', activeType)
      }

      const response = await fetch(
        `/api/questions?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()
      if (data.success) {
        setQuestions(data.data.questions)
        setPagination({
          ...pagination,
          total: data.data.pagination.total,
        })
      }
    } catch (error) {
      message.error('获取题目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingQuestion(null)
    form.resetFields()
    // 如果有词汇筛选，自动填入该词汇
    if (activeVocabularyId) {
      const vocab = vocabularies.find(v => v.id === activeVocabularyId)
      if (vocab) {
        form.setFieldValue('vocabularyId', vocab.word)
      }
    }
    setModalVisible(true)
  }

  const handleEdit = (record: Question) => {
    setEditingQuestion(record)
    form.setFieldsValue({
      vocabularyId: record.vocabularyId, // 使用真正的 ID
      vocabularyWord: record.vocabulary.word, // 用于显示
      type: record.type,
      content: record.content,
      sentence: record.sentence,
      audioUrl: record.audioUrl,
      correctAnswer: record.correctAnswer,
      options: record.options.map(opt => opt.content).join('\n'),
    })
    setModalVisible(true)
  }

  const handleDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/questions?ids=${ids.join(',')}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        message.success('删除成功')
        fetchQuestions()
      } else {
        message.error(data.message || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return
    await handleDelete(selectedRowKeys as string[])
    setSelectedRowKeys([])
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')

      // 解析选项
      const optionLines = values.options?.split('\n').filter((line: string) => line.trim()) || []
      const options = optionLines.map((line: string, index: number) => ({
        content: line.trim(),
        isCorrect: line.trim() === values.correctAnswer.trim(),
        order: index,
      }))

      const payload = {
        ...values,
        options,
        id: editingQuestion?.id,
      }

      const url = editingQuestion ? '/api/questions' : '/api/questions'
      const method = editingQuestion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        message.success(editingQuestion ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchQuestions()
      } else {
        message.error(data.message || '操作失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleImport = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/questions/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        message.success(data.message || '导入成功')
        setImportModalVisible(false)
        fetchQuestions()
      } else {
        message.error(data.message || '导入失败')
        if (data.data?.errors?.length > 0) {
          Modal.error({
            title: '导入错误详情',
            content: data.data.errors.join('\n'),
          })
        }
      }
    } catch (error) {
      message.error('导入失败')
    }

    return false // 阻止默认上传行为
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        word: 'apple',
        type: 'ENGLISH_TO_CHINESE',
        content: 'apple /ˈæpl/',
        correctAnswer: '苹果',
        options: 'A.苹果|B.香蕉|C.橙子|D.梨',
        sentence: '',
        audioUrl: '',
      },
      {
        word: 'banana',
        type: 'CHINESE_TO_ENGLISH',
        content: '香蕉',
        correctAnswer: 'banana',
        options: 'A.apple|B.banana|C.orange|D.pear',
        sentence: '',
        audioUrl: '',
      },
      {
        word: 'orange',
        type: 'FILL_IN_BLANK',
        content: 'orange',
        correctAnswer: 'orange',
        options: 'A.apple|B.banana|C.orange|D.pear',
        sentence: 'I like to drink ___ juice in the morning.',
        audioUrl: '',
      },
      {
        word: 'pear',
        type: 'LISTENING',
        content: 'pear',
        correctAnswer: 'pear',
        options: 'A.apple|B.banana|C.orange|D.pear',
        sentence: '',
        audioUrl: 'https://example.com/audio/pear.mp3',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '题目模板')
    XLSX.writeFile(wb, '题目导入模板.xlsx')
  }

  const columns: ColumnsType<Question> = [
    {
      title: '词汇',
      dataIndex: ['vocabulary', 'word'],
      key: 'word',
      width: 120,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeInfo = questionTypeMap[type]
        return <Tag color={typeInfo?.color}>{typeInfo?.label || type}</Tag>
      },
    },
    {
      title: '题目内容',
      key: 'contentWithOptions',
      render: (_, record) => (
        <div style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            {record.content}
            {record.sentence && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                句子: {record.sentence}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>
            选项:
            {record.options
              .sort((a, b) => a.order - b.order)
              .map((opt, idx) => (
                <div key={opt.id} style={{ marginLeft: 8 }}>
                  {String.fromCharCode(65 + idx)}. {opt.content}
                  {opt.isCorrect && (
                    <Tag color="green" style={{ marginLeft: 4 }}>✓</Tag>
                  )}
                </div>
              ))}
          </div>
        </div>
      ),
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      width: 150,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>题目管理</h2>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              下载模板
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
              批量导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增题目
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button danger onClick={handleBatchDelete}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        </div>

        {/* 筛选区域 */}
        <Space size="middle" style={{ marginBottom: 16 }}>
          <span>筛选：</span>
          <Select
            style={{ width: 200 }}
            placeholder="选择词汇"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { label: '全部词汇', value: '' },
              ...vocabularies.map(v => ({
                label: v.word,
                value: v.id,
              })),
            ]}
            value={activeVocabularyId || ''}
            onChange={(value) => {
              setManualFilters({ ...manualFilters, vocabularyId: value || undefined })
              setPagination({ ...pagination, current: 1 })
              // 清除 URL 参数（如果有）
              if (urlVocabularyId) {
                router.push('/admin/questions')
              }
            }}
          />
          <Select
            style={{ width: 150 }}
            placeholder="选择题型"
            allowClear
            options={[
              { label: '全部题型', value: '' },
              ...Object.entries(questionTypeMap).map(([key, { label }]) => ({
                label,
                value: key,
              })),
            ]}
            value={activeType || ''}
            onChange={(value) => {
              setManualFilters({ ...manualFilters, type: value || undefined })
              setPagination({ ...pagination, current: 1 })
            }}
          />
          {(activeVocabularyId || activeType) && (
            <Button
              onClick={() => {
                setManualFilters({})
                setPagination({ ...pagination, current: 1 })
                if (urlVocabularyId) {
                  router.push('/admin/questions')
                }
              }}
            >
              清空筛选
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={questions}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize: pageSize || 20 })
          },
        }}
      />

      <Modal
        title={editingQuestion ? '编辑题目' : '新增题目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
      >
        <Form form={form} layout="vertical">
          {editingQuestion ? (
            // 编辑模式：显示词汇名称（只读）
            <Form.Item label="词汇">
              <Input value={form.getFieldValue('vocabularyWord')} disabled />
              <Form.Item name="vocabularyId" hidden><Input /></Form.Item>
            </Form.Item>
          ) : (
            // 新建模式：可选择词汇
            <Form.Item
              name="vocabularyId"
              label="词汇"
              rules={[{ required: true, message: '请选择词汇' }]}
            >
              <Select
                showSearch
                placeholder="搜索并选择词汇"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={vocabularies.map(v => ({
                  label: v.word,
                  value: v.id,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="type"
            label="题型"
            rules={[{ required: true, message: '请选择题型' }]}
          >
            <Select>
              {Object.entries(questionTypeMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="sentence" label="填空句子（仅填空题）">
            <Input />
          </Form.Item>
          <Form.Item name="audioUrl" label="音频URL（仅听力题）">
            <Input />
          </Form.Item>
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="options" label="选项（每行一个）">
            <TextArea rows={4} placeholder="选项1&#10;选项2&#10;选项3&#10;选项4" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入题目"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleImport}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 .xlsx, .xls 格式</p>
        </Upload.Dragger>
      </Modal>
    </div>
  )
}

// 使用 Suspense 包装以支持 useSearchParams (Next.js 15 要求)
export default function QuestionsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}>
      <QuestionsContent />
    </Suspense>
  )
}
