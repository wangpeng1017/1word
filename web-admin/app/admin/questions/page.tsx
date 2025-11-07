'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Upload, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

interface Question {
  id: string
  type: string
  content: string
  sentence?: string
  audioUrl?: string
  correctAnswer: string
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

export default function QuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [vocabularies, setVocabularies] = useState<Array<{ id: string; word: string }>>([])
  const [filters, setFilters] = useState<{
    vocabularyId?: string
    type?: string
  }>({})
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 从URL参数中读取初始筛选条件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const vocabularyId = urlParams.get('vocabularyId')
      const word = urlParams.get('word')
      if (vocabularyId) {
        setFilters(prev => ({ ...prev, vocabularyId }))
        if (word) {
          message.info(`已筛选词汇: ${word}`)
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
    fetchVocabularies()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchVocabularies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vocabularies?limit=1000', {
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
      
      if (filters.vocabularyId) {
        params.append('vocabularyId', filters.vocabularyId)
      }
      if (filters.type) {
        params.append('type', filters.type)
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
    setModalVisible(true)
  }

  const handleEdit = (record: Question) => {
    setEditingQuestion(record)
    form.setFieldsValue({
      vocabularyId: record.vocabulary.word,
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
        content: 'apple',
        correctAnswer: '苹果',
        options: 'A.苹果|B.香蕉|C.橙子|D.梨',
        sentence: '',
        audioUrl: '',
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
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗?"
            onConfirm={() => handleDelete([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
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
            value={filters.vocabularyId || ''}
            onChange={(value) => {
              setFilters({ ...filters, vocabularyId: value || undefined })
              setPagination({ ...pagination, current: 1 })
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
            value={filters.type || ''}
            onChange={(value) => {
              setFilters({ ...filters, type: value || undefined })
              setPagination({ ...pagination, current: 1 })
            }}
          />
          {(filters.vocabularyId || filters.type) && (
            <Button
              onClick={() => {
                setFilters({})
                setPagination({ ...pagination, current: 1 })
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
          <Form.Item
            name="vocabularyId"
            label="词汇"
            rules={[{ required: true, message: '请输入词汇ID或单词' }]}
          >
            <Input placeholder="请输入词汇ID或单词" />
          </Form.Item>
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
