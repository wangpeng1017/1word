'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Tabs,
  Empty,
  message,
  Modal,
  Form,
  Input,
  Select,
  Radio,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Popconfirm } from 'antd'

const { TextArea } = Input
const { Option } = Select

interface Question {
  id: string
  type: string
  content: string
  correctAnswer: string
  options: { id: string; content: string; isCorrect: boolean; order: number }[]
}

const questionTypeNames: Record<string, string> = {
  ENGLISH_TO_CHINESE: '英选汉',
  CHINESE_TO_ENGLISH: '汉选英',
  LISTENING: '听音选词',
  FILL_IN_BLANK: '选词填空',
}

export default function VocabularyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vocabularyId = params.id as string

  const [vocabulary, setVocabulary] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [currentType, setCurrentType] = useState<string>('ENGLISH_TO_CHINESE')
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [vocabularyId])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/vocabularies/${vocabularyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setVocabulary(result.data)
        setQuestions(result.data.questions || [])
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = (type: string) => {
    setCurrentType(type)
    setEditingQuestion(null)
    form.resetFields()
    form.setFieldsValue({
      type,
      content: vocabulary?.word || '',
      options: ['', '', '', ''].map((_, i) => ({ content: '', order: i })),
    })
    setModalVisible(true)
  }

  const handleSubmitQuestion = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')

      // 构建选项数据
      const options = values.options.map((opt: any, index: number) => ({
        content: opt,
        isCorrect: index === values.correctAnswerIndex,
        order: index,
      }))

      const payload = {
        type: values.type,
        content: values.content,
        correctAnswer: values.options[values.correctAnswerIndex],
        options,
      }

      const response = await fetch(`/api/vocabularies/${vocabularyId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success) {
        message.success('添加成功')
        setModalVisible(false)
        loadData()
      } else {
        message.error(result.error || '添加失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const getQuestionsByType = (type: string) => {
    return questions.filter((q) => q.type === type)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/vocabularies/${vocabularyId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        loadData()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const renderQuestionList = (type: string) => {
    const typeQuestions = getQuestionsByType(type)

    if (typeQuestions.length === 0) {
      return (
        <Empty
          description={`暂无${questionTypeNames[type]}题目`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddQuestion(type)}>
            添加题目
          </Button>
        </Empty>
      )
    }

    return (
      <div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleAddQuestion(type)}
          style={{ marginBottom: 16 }}
        >
          添加题目
        </Button>
        {typeQuestions.map((question, index) => (
          <Card 
            key={question.id} 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              <Popconfirm
                title="确认删除这道题目？"
                onConfirm={() => handleDeleteQuestion(question.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            }
          >
            <div>
              <div style={{ marginBottom: 12, fontWeight: 500 }}>
                题目 {index + 1}: {question.content}
              </div>
              <div>
                {question.options.map((opt) => (
                  <div
                    key={opt.id}
                    style={{
                      padding: '8px 12px',
                      marginBottom: 8,
                      background: opt.isCorrect ? '#f6ffed' : '#fafafa',
                      border: opt.isCorrect ? '1px solid #52c41a' : '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  >
                    {String.fromCharCode(65 + opt.order)}. {opt.content}
                    {opt.isCorrect && (
                      <Tag color="success" style={{ marginLeft: 8 }}>
                        正确答案
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const tabs = [
    {
      key: 'ENGLISH_TO_CHINESE',
      label: `英选汉 (${getQuestionsByType('ENGLISH_TO_CHINESE').length})`,
      children: renderQuestionList('ENGLISH_TO_CHINESE'),
    },
    {
      key: 'CHINESE_TO_ENGLISH',
      label: `汉选英 (${getQuestionsByType('CHINESE_TO_ENGLISH').length})`,
      children: renderQuestionList('CHINESE_TO_ENGLISH'),
    },
    {
      key: 'LISTENING',
      label: `听音选词 (${getQuestionsByType('LISTENING').length})`,
      children: renderQuestionList('LISTENING'),
    },
    {
      key: 'FILL_IN_BLANK',
      label: `选词填空 (${getQuestionsByType('FILL_IN_BLANK').length})`,
      children: renderQuestionList('FILL_IN_BLANK'),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          返回
        </Button>
      </Space>

      <Card title="词汇信息" loading={loading} style={{ marginBottom: 16 }}>
        {vocabulary && (
          <Descriptions column={2}>
            <Descriptions.Item label="单词">{vocabulary.word}</Descriptions.Item>
            <Descriptions.Item label="音标">{vocabulary.phonetic || '-'}</Descriptions.Item>
            <Descriptions.Item label="词性">
              {vocabulary.partOfSpeech?.map((pos: string, i: number) => (
                <Tag key={i} color="blue">
                  {pos}
                </Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="难度">
              <Tag color={vocabulary.difficulty === 'EASY' ? 'green' : vocabulary.difficulty === 'HARD' ? 'red' : 'orange'}>
                {vocabulary.difficulty === 'EASY' ? '简单' : vocabulary.difficulty === 'HARD' ? '困难' : '中等'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="核心释义" span={2}>
              {vocabulary.primaryMeaning}
            </Descriptions.Item>
            {vocabulary.secondaryMeaning && (
              <Descriptions.Item label="延伸释义" span={2}>
                {vocabulary.secondaryMeaning}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>

      <Card title="题目管理">
        <Tabs items={tabs} />
      </Card>

      <Modal
        title={`添加${questionTypeNames[currentType]}题目`}
        open={modalVisible}
        onOk={handleSubmitQuestion}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <Input placeholder="例如: 单词或句子" />
          </Form.Item>

          <Form.Item label="选项">
            {[0, 1, 2, 3].map((index) => (
              <Form.Item
                key={index}
                name={['options', index]}
                rules={[{ required: true, message: '请输入选项' }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder={`选项 ${String.fromCharCode(65 + index)}`} />
              </Form.Item>
            ))}
          </Form.Item>

          <Form.Item
            label="正确答案"
            name="correctAnswerIndex"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Radio.Group>
              <Radio value={0}>A</Radio>
              <Radio value={1}>B</Radio>
              <Radio value={2}>C</Radio>
              <Radio value={3}>D</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
