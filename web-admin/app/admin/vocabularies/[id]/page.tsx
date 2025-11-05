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
  Divider,
  Alert,
  Badge,
  Tooltip,
  Upload,
  Image,
  Spin,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  SoundOutlined,
  PictureOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { Popconfirm } from 'antd'
import type { UploadFile, UploadProps } from 'antd'

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
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<any>(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [audioList, setAudioList] = useState<any[]>([])
  const [imageList, setImageList] = useState<any[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadFiles()
  }, [vocabularyId])

  const loadFiles = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // 加载音频文件
      const audioRes = await fetch(`/api/vocabularies/${vocabularyId}/files?type=audio`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const audioResult = await audioRes.json()
      if (audioResult.success) {
        setAudioList(audioResult.data || [])
      }
      
      // 加载图片文件
      const imageRes = await fetch(`/api/vocabularies/${vocabularyId}/files?type=image`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const imageResult = await imageRes.json()
      if (imageResult.success) {
        setImageList(imageResult.data || [])
      }
    } catch (error) {
      console.error('加载文件失败:', error)
    }
  }

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

  const handlePreviewQuestion = (question: Question) => {
    setPreviewQuestion(question)
    setPreviewVisible(true)
  }

  const handlePreviewFormQuestion = () => {
    form.validateFields().then(values => {
      const options = values.options.map((opt: any, index: number) => ({
        content: opt,
        isCorrect: index === values.correctAnswerIndex,
        order: index,
      }))
      
      setPreviewQuestion({
        type: values.type,
        content: values.content,
        options,
      })
      setPreviewVisible(true)
    }).catch(() => {
      message.warning('请先填写完整题目信息')
    })
  }

  const renderQuestionList = (type: string) => {
    const typeQuestions = getQuestionsByType(type)

    if (typeQuestions.length === 0) {
      return (
        <div style={{ padding: '40px 0' }}>
          <Empty
            description={
              <span>
                暂无{questionTypeNames[type]}题目
                <br />
                <span style={{ color: '#999', fontSize: 12 }}>
                  建议为每个单词添加至少3道题目
                </span>
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddQuestion(type)}>
              添加{questionTypeNames[type]}题目
            </Button>
          </Empty>
        </div>
      )
    }

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddQuestion(type)}
          >
            添加{questionTypeNames[type]}题目
          </Button>
          <span style={{ color: '#999' }}>
            已有 <strong style={{ color: '#1890ff' }}>{typeQuestions.length}</strong> 道题目
          </span>
        </div>
        
        {typeQuestions.map((question, index) => (
          <Card 
            key={question.id} 
            size="small" 
            style={{ 
              marginBottom: 16,
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            title={
              <Space>
                <Badge 
                  count={index + 1} 
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span style={{ fontWeight: 500 }}>{question.content}</span>
              </Space>
            }
            extra={
              <Space>
                <Tooltip title="预览题目">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewQuestion(question)}
                  >
                    预览
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="确认删除这道题目？"
                  description="删除后无法恢复"
                  onConfirm={() => handleDeleteQuestion(question.id)}
                  okText="确认删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ marginLeft: 8 }}>
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    padding: '10px 14px',
                    marginBottom: 10,
                    background: opt.isCorrect ? 'linear-gradient(135deg, #f6ffed 0%, #efffec 100%)' : '#fafafa',
                    border: opt.isCorrect ? '1px solid #52c41a' : '1px solid #e8e8e8',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>
                    <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + opt.order)}.</strong>
                    {opt.content}
                  </span>
                  {opt.isCorrect && (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      正确答案
                    </Tag>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    }
  }

  const handleAudioUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setAudioUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file as File)
      formData.append('type', 'audio')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const uploadResult = await uploadRes.json()
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '上传失败')
      }

      // 保存文件记录到数据库
      const saveRes = await fetch(`/api/vocabularies/${vocabularyId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'audio',
          url: uploadResult.data.url,
          filename: uploadResult.data.filename,
        }),
      })

      const saveResult = await saveRes.json()
      if (saveResult.success) {
        message.success('音频上传成功')
        onSuccess?.(saveResult.data, file as any)
        loadFiles()
      } else {
        throw new Error(saveResult.error || '保存失败')
      }
    } catch (error: any) {
      message.error(error.message || '上传失败')
      onError?.(error)
    } finally {
      setAudioUploading(false)
    }
  }

  const handleImageUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setImageUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file as File)
      formData.append('type', 'image')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const uploadResult = await uploadRes.json()
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '上传失败')
      }

      // 保存文件记录到数据库
      const saveRes = await fetch(`/api/vocabularies/${vocabularyId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'image',
          url: uploadResult.data.url,
          filename: uploadResult.data.filename,
        }),
      })

      const saveResult = await saveRes.json()
      if (saveResult.success) {
        message.success('图片上传成功')
        onSuccess?.(saveResult.data, file as any)
        loadFiles()
      } else {
        throw new Error(saveResult.error || '保存失败')
      }
    } catch (error: any) {
      message.error(error.message || '上传失败')
      onError?.(error)
    } finally {
      setImageUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string, type: 'audio' | 'image') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/vocabularies/${vocabularyId}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        loadFiles()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
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

      <Card title="多媒体资源" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 音频上传 */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SoundOutlined style={{ fontSize: 18, color: '#1890ff' }} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>发音音频</span>
              <Tag color="blue">{audioList.length} 个文件</Tag>
            </div>
            <Upload
              customRequest={handleAudioUpload}
              showUploadList={false}
              accept="audio/*"
              disabled={audioUploading}
            >
              <Button icon={audioUploading ? <LoadingOutlined /> : <PlusOutlined />} disabled={audioUploading}>
                {audioUploading ? '上传中...' : '上传音频'}
              </Button>
            </Upload>
            <div style={{ marginTop: 12 }}>
              {audioList.map((audio) => (
                <Card
                  key={audio.id}
                  size="small"
                  style={{ marginBottom: 8 }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <PlayCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                      <span>{audio.filename}</span>
                      <audio controls src={audio.url} style={{ height: 32 }}>
                        您的浏览器不支持音频播放
                      </audio>
                    </Space>
                    <Popconfirm
                      title="确认删除这个音频？"
                      onConfirm={() => handleDeleteFile(audio.id, 'audio')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* 图片上传 */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PictureOutlined style={{ fontSize: 18, color: '#1890ff' }} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>示意图片</span>
              <Tag color="blue">{imageList.length} 个文件</Tag>
            </div>
            <Upload
              customRequest={handleImageUpload}
              showUploadList={false}
              accept="image/*"
              disabled={imageUploading}
            >
              <Button icon={imageUploading ? <LoadingOutlined /> : <PlusOutlined />} disabled={imageUploading}>
                {imageUploading ? '上传中...' : '上传图片'}
              </Button>
            </Upload>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {imageList.map((image) => (
                <Card
                  key={image.id}
                  size="small"
                  bodyStyle={{ padding: 8 }}
                  style={{ width: 200 }}
                >
                  <Image
                    src={image.url}
                    alt={image.filename}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>{image.filename}</span>
                    <Popconfirm
                      title="确认删除？"
                      onConfirm={() => handleDeleteFile(image.id, 'image')}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Space>
      </Card>

      <Card title="题目管理">
        <Tabs items={tabs} />
      </Card>

      <Modal
        title={
          <Space>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <span>添加{questionTypeNames[currentType]}题目</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSubmitQuestion}
        onCancel={() => setModalVisible(false)}
        width={700}
        footer={[
          <Button key="preview" onClick={handlePreviewFormQuestion}>
            <EyeOutlined /> 预览题目
          </Button>,
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitQuestion}>
            保存
          </Button>,
        ]}
      >
        <Alert
          message="题目设计建议"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>选项应包含1个正确答案和3个干扰项</li>
              <li>干扰项建议选择易混淆的词义或词汇</li>
              <li>选项长度应尽量保持一致</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>题目内容</span>
                <Tooltip title="根据题目类型输入相应内容">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <Input 
              placeholder={
                currentType === 'FILL_IN_BLANK' 
                  ? '例如: I want to ___ English well.' 
                  : '例如: ' + (vocabulary?.word || '单词')
              } 
              size="large"
            />
          </Form.Item>

          <Divider orientation="left">题目选项</Divider>

          <Form.Item label="选项">
            {[0, 1, 2, 3].map((index) => (
              <Form.Item
                key={index}
                name={['options', index]}
                rules={[{ required: true, message: '请输入选项' }]}
                style={{ marginBottom: 12 }}
              >
                <Input 
                  placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                  prefix={
                    <strong style={{ 
                      color: '#1890ff',
                      minWidth: 24,
                      display: 'inline-block',
                    }}>
                      {String.fromCharCode(65 + index)}.
                    </strong>
                  }
                  size="large"
                />
              </Form.Item>
            ))}
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>正确答案</span>
                <Tag color="success">必选</Tag>
              </Space>
            }
            name="correctAnswerIndex"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Radio.Group size="large">
              <Radio.Button value={0}>A</Radio.Button>
              <Radio.Button value={1}>B</Radio.Button>
              <Radio.Button value={2}>C</Radio.Button>
              <Radio.Button value={3}>D</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* 题目预览 Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#52c41a' }} />
            <span>题目预览</span>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {previewQuestion && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ 
              marginBottom: 20,
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
            }}>
              <Tag color="blue" style={{ marginBottom: 8 }}>
                {questionTypeNames[previewQuestion.type]}
              </Tag>
              <div style={{ fontSize: 18, fontWeight: 500 }}>
                {previewQuestion.content}
              </div>
            </div>

            <div>
              {previewQuestion.options?.map((opt: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '14px 18px',
                    marginBottom: 12,
                    background: opt.isCorrect 
                      ? 'linear-gradient(135deg, #f6ffed 0%, #efffec 100%)' 
                      : '#ffffff',
                    border: opt.isCorrect 
                      ? '2px solid #52c41a' 
                      : '1px solid #e8e8e8',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    <strong style={{ marginRight: 12, color: '#1890ff' }}>
                      {String.fromCharCode(65 + index)}.
                    </strong>
                    {opt.content}
                  </span>
                  {opt.isCorrect && (
                    <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
