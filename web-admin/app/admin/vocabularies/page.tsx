'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Tag,
  Modal,
  Form,
  Select,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  UploadOutlined,
  SoundOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import AudioPlayer from '../../components/AudioPlayer'

const { TextArea } = Input
const { Option } = Select

interface WordAudio {
  id: string
  audioUrl: string
  accent: 'US' | 'UK'
  duration: number | null
}

interface WordMeaning {
  id: string
  partOfSpeech: string
  meaning: string
  orderIndex: number
  examples: string[]
}

interface Vocabulary {
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
  createdAt: string
  audios?: WordAudio[]
  meanings?: WordMeaning[] // 新增: 多词性多释义
}

export default function VocabulariesPage() {
  const router = useRouter()
  const [data, setData] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Vocabulary | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [highFreqFilter, setHighFreqFilter] = useState<boolean | null>(null)
  const [importing, setImporting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      // 加载音频和多词性释义
      const response = await fetch('/api/vocabularies?includeAudios=true&includeMeanings=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data?.vocabularies || [])
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = async (record: Vocabulary) => {
    setEditingRecord(record)
    
    // 加载完整数据包括音频和图片
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/vocabularies/${record.id}?includeAudios=true&includeImages=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      
      if (result.success) {
        const fullRecord = result.data
        const usAudio = fullRecord.audios?.find((a: any) => a.accent === 'US')
        const ukAudio = fullRecord.audios?.find((a: any) => a.accent === 'UK')
        const image = fullRecord.images?.[0]
        
        // 准备 meanings 数据
        const meanings = fullRecord.meanings && fullRecord.meanings.length > 0
          ? fullRecord.meanings.map((m: WordMeaning) => ({
              partOfSpeech: m.partOfSpeech,
              meaning: m.meaning,
            }))
          : [] // 如果没有 meanings，用户可手动添加
        
        form.setFieldsValue({
          word: fullRecord.word,
          meanings,
          phoneticUS: fullRecord.phoneticUS || '',
          phoneticUK: fullRecord.phoneticUK || '',
          phonetic: fullRecord.phonetic || '',
          difficulty: fullRecord.difficulty || 'MEDIUM',
          isHighFrequency: fullRecord.isHighFrequency || false,
          audioUrlUS: usAudio?.audioUrl || '',
          audioUrlUK: ukAudio?.audioUrl || '',
          imageUrl: image?.imageUrl || '',
          imageDescription: image?.description || '',
        })
      }
    } catch (error) {
      // 如果加载失败，使用基本数据
      const meanings = record.meanings && record.meanings.length > 0
        ? record.meanings.map((m: WordMeaning) => ({
            partOfSpeech: m.partOfSpeech,
            meaning: m.meaning,
          }))
        : []
      
      form.setFieldsValue({
        ...record,
        meanings,
      })
    }
    
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/vocabularies/${id}`, {
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')

      const url = editingRecord
        ? `/api/vocabularies/${editingRecord.id}`
        : '/api/vocabularies'
      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingRecord ? '更新成功' : '添加成功')
        setModalVisible(false)
        loadData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    window.open(`/api/vocabularies/export?token=${token}`, '_blank')
    message.success('导出已开始')
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/vocabularies/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        message.success(result.message || '导入成功')
        loadData()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch (error) {
      message.error('导入失败')
    } finally {
      setImporting(false)
    }
    return false
  }

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token')
    window.open(`/api/vocabularies/import?token=${token}`, '_blank')
    message.success('模板下载已开始')
  }

  const handleBatchDelete = async () => {
    try {
      const token = localStorage.getItem('token')
      await Promise.all(
        selectedRowKeys.map((id) =>
          fetch(`/api/vocabularies/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      )
      message.success('批量删除成功')
      setSelectedRowKeys([])
      loadData()
    } catch (error) {
      message.error('批量删除失败')
    }
  }

  const columns: ColumnsType<Vocabulary> = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 150,
      fixed: 'left',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.word.toLowerCase().includes((value as string).toLowerCase()),
      render: (word: string) => (
        <span style={{ fontWeight: 500, fontSize: 15 }}>{word}</span>
      ),
    },
    {
      title: '释义',
      key: 'meanings',
      width: 300,
      render: (_, record: Vocabulary) => {
        // 优先展示多词性释义，否则备用主要释义
        if (record.meanings && record.meanings.length > 0) {
          return (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {record.meanings.map((m, idx) => (
                <div key={m.id || idx} style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <Tag 
                    color="blue" 
                    style={{ 
                      fontSize: 10, 
                      padding: '0 4px',
                      marginRight: 6,
                      minWidth: 30,
                      textAlign: 'center'
                    }}
                  >
                    {m.partOfSpeech}
                  </Tag>
                  <span title={m.meaning}>
                    {m.meaning.length > 40 ? m.meaning.substring(0, 40) + '...' : m.meaning}
                  </span>
                </div>
              ))}
            </Space>
          )
        }
        // 备用：显示主要释义
        return (
          <span title={record.primaryMeaning} style={{ fontSize: 13 }}>
            {record.primaryMeaning}
          </span>
        )
      },
    },
    {
      title: '音标',
      key: 'phonetic',
      width: 200,
      render: (_, record: Vocabulary) => (
        <Space direction="vertical" size={2} style={{ fontSize: 13, lineHeight: 1.4 }}>
          {record.phoneticUS && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', marginRight: 6 }}>美</Tag>
              <span style={{ fontFamily: 'Arial, sans-serif' }}>{record.phoneticUS}</span>
            </div>
          )}
          {record.phoneticUK && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <Tag color="green" style={{ fontSize: 10, padding: '0 4px', marginRight: 6 }}>英</Tag>
              <span style={{ fontFamily: 'Arial, sans-serif' }}>{record.phoneticUK}</span>
            </div>
          )}
          {!record.phoneticUS && !record.phoneticUK && record.phonetic && (
            <span style={{ fontFamily: 'Arial, sans-serif' }}>{record.phonetic}</span>
          )}
          {!record.phoneticUS && !record.phoneticUK && !record.phonetic && (
            <span style={{ color: '#999' }}>-</span>
          )}
        </Space>
      ),
    },
    {
      title: '发音',
      key: 'audio',
      width: 180,
      render: (_, record: Vocabulary) => {
        const usAudio = record.audios?.find((a) => a.accent === 'US')
        const ukAudio = record.audios?.find((a) => a.accent === 'UK')
        
        return (
          <Space size="small">
            {usAudio && (
              <AudioPlayer
                audioUrl={usAudio.audioUrl}
                accent="US"
                word={record.word}
                size="small"
                showAccent={true}
              />
            )}
            {ukAudio && (
              <AudioPlayer
                audioUrl={ukAudio.audioUrl}
                accent="UK"
                word={record.word}
                size="small"
                showAccent={true}
              />
            )}
            {!usAudio && !ukAudio && (
              <span style={{ color: '#999', fontSize: 12 }}>暂无音频</span>
            )}
          </Space>
        )
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: string) => {
        const colorMap: Record<string, string> = {
          EASY: 'green',
          MEDIUM: 'orange',
          HARD: 'red',
        }
        const textMap: Record<string, string> = {
          EASY: '简单',
          MEDIUM: '中等',
          HARD: '困难',
        }
        return <Tag color={colorMap[difficulty]}>{textMap[difficulty] || difficulty}</Tag>
      },
    },
    {
      title: '高频词',
      dataIndex: 'isHighFrequency',
      key: 'isHighFrequency',
      width: 100,
      render: (isHigh: boolean) => (
        <Tag color={isHigh ? 'red' : 'default'}>{isHigh ? '是' : '否'}</Tag>
      ),
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
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin/questions?vocabularyId=${record.id}&word=${encodeURIComponent(record.word)}`)}
          >
            题目
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索单词"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="难度筛选"
            allowClear
            style={{ width: 120 }}
            value={difficultyFilter || undefined}
            onChange={setDifficultyFilter}
          >
            <Select.Option value="EASY">简单</Select.Option>
            <Select.Option value="MEDIUM">中等</Select.Option>
            <Select.Option value="HARD">困难</Select.Option>
          </Select>
          <Select
            placeholder="高频词"
            allowClear
            style={{ width: 120 }}
            value={highFreqFilter === null ? undefined : highFreqFilter}
            onChange={setHighFreqFilter}
          >
            <Select.Option value={true}>高频词</Select.Option>
            <Select.Option value={false}>非高频</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加词汇
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载模板
          </Button>
          <Button 
            icon={<UploadOutlined />} 
            loading={importing}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.xlsx,.xls'
              input.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }
              input.click()
            }}
          >
            批量导入
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={data.filter((item) => {
            if (difficultyFilter && item.difficulty !== difficultyFilter) return false
            if (highFreqFilter !== null && item.isHighFrequency !== highFreqFilter) return false
            return true
          })}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑词汇' : '添加词汇'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="单词"
            name="word"
            rules={[{ required: true, message: '请输入单词' }]}
          >
            <Input placeholder="例如: hello" />
          </Form.Item>

          <Form.List name="meanings">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontWeight: 500 }}>词性与释义</label>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                    添加释义
                  </Button>
                </div>
                {fields.length === 0 && (
                  <Button type="dashed" onClick={() => add()} block style={{ marginBottom: 8 }}>
                    <PlusOutlined /> 添加第一个释义
                  </Button>
                )}
                {fields.map((field, index) => (
                  <Card 
                    key={field.key} 
                    size="small" 
                    style={{ marginBottom: 8 }}
                    title={`释义 ${index + 1}`}
                    extra={
                      <Button 
                        type="link" 
                        danger 
                        size="small" 
                        onClick={() => remove(field.name)}
                        icon={<MinusCircleOutlined />}
                      >
                        删除
                      </Button>
                    }
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'partOfSpeech']}
                      rules={[{ required: true, message: '请选择词性' }]}
                      label="词性"
                    >
                      <Select placeholder="选择词性">
                        <Option value="n.">名词on. </Option>
                        <Option value="v.">动词on. </Option>
                        <Option value="adj.">形容词on.adj. </Option>
                        <Option value="adv.">副词on.adv. </Option>
                        <Option value="prep.">介词on.prep. </Option>
                        <Option value="pron.">代词on.pron. </Option>
                        <Option value="conj.">连词on.conj. </Option>
                        <Option value="interj.">感叹词on.interj. </Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'meaning']}
                      rules={[{ required: true, message: '请输入释义' }]}
                      label="释义"
                    >
                      <TextArea rows={2} placeholder="输入该词性下的释义" />
                    </Form.Item>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              label="美式音标"
              name="phoneticUS"
              style={{ flex: 1, marginBottom: 12 }}
            >
              <Input placeholder="例如: /həˈloʊ/" />
            </Form.Item>
            <Form.Item
              label="英式音标"
              name="phoneticUK"
              style={{ flex: 1, marginBottom: 12, marginLeft: 8 }}
            >
              <Input placeholder="例如: /həˈləʊ/" />
            </Form.Item>
          </Space.Compact>
          
          <Form.Item label="通用音标" name="phonetic">
            <Input placeholder="如果不区分英美，可填写通用音标" />
          </Form.Item>

          <Form.Item
            label="难度"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度' }]}
            initialValue="MEDIUM"
          >
            <Select>
              <Option value="EASY">简单</Option>
              <Option value="MEDIUM">中等</Option>
              <Option value="HARD">困难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="高考高频词"
            name="isHighFrequency"
            valuePropName="checked"
            initialValue={false}
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item label="美式音频URL" name="audioUrlUS">
            <Input 
              placeholder="美式发音音频链接（可选）" 
              addonAfter={
                <Button 
                  type="link" 
                  size="small" 
                  icon={<UploadOutlined />}
                  onClick={() => message.info('请先上传音频文件到Vercel Blob，然后粘贴URL')}
                >
                  上传
                </Button>
              }
            />
          </Form.Item>

          <Form.Item label="英式音频URL" name="audioUrlUK">
            <Input 
              placeholder="英式发音音频链接（可选）" 
              addonAfter={
                <Button 
                  type="link" 
                  size="small" 
                  icon={<UploadOutlined />}
                  onClick={() => message.info('请先上传音频文件到Vercel Blob，然后粘贴URL')}
                >
                  上传
                </Button>
              }
            />
          </Form.Item>

          <Form.Item label="图片URL" name="imageUrl">
            <Input 
              placeholder="词汇图片链接（可选）" 
              addonAfter={
                <Button 
                  type="link" 
                  size="small" 
                  icon={<UploadOutlined />}
                  onClick={() => message.info('请先上传图片文件到Vercel Blob，然后粘贴URL')}
                >
                  上传
                </Button>
              }
            />
          </Form.Item>

          <Form.Item label="图片描述" name="imageDescription">
            <Input placeholder="图片描述文字（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
