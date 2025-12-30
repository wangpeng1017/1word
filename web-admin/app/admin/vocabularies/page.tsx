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
  Image,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd'
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
  DeleteOutlined,
  LoadingOutlined,
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

interface WordImage {
  id: string
  imageUrl: string
  description?: string
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
  meanings?: WordMeaning[]
  images?: WordImage[]
}

export default function VocabulariesPage() {
  const router = useRouter()
  const [data, setData] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Vocabulary | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [highFreqFilter, setHighFreqFilter] = useState<boolean | null>(null)
  const [importing, setImporting] = useState(false)
  const [form] = Form.useForm()
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  // R开头优先排序
  const [rFirst, setRFirst] = useState(true)

  // 分页状态
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  // 防抖搜索
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
      setPagination(prev => ({ ...prev, page: 1 })) // 搜索时重置到第一页
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    loadData()
  }, [pagination.page, pagination.limit, highFreqFilter, debouncedSearch, rFirst])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        includeMeanings: 'true',
        includeImages: 'true',
        includeAudios: 'true',
        rFirst: String(rFirst),
      })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (highFreqFilter !== null) params.append('isHighFrequency', String(highFreqFilter))

      const response = await fetch(`/api/vocabularies?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data?.vocabularies || [])
        setPagination(prev => ({ ...prev, total: result.data?.pagination?.total || 0 }))
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
    setImageFileList([])
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

        // 设置图片列表
        if (image?.imageUrl) {
          setImageFileList([{
            uid: '-1',
            name: 'image',
            status: 'done',
            url: image.imageUrl,
          }])
        } else {
          setImageFileList([])
        }
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

  // 图片上传处理
  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        const imageUrl = result.data.url
        form.setFieldValue('imageUrl', imageUrl)
        setImageFileList([{
          uid: '-1',
          name: file.name,
          status: 'done',
          url: imageUrl,
        }])
        message.success('图片上传成功')
      } else {
        message.error(result.error || '上传失败')
      }
    } catch (error) {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false // 阻止默认上传行为
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
      title: '音频',
      key: 'audios',
      width: 140,
      render: (_: any, record: Vocabulary) => {
        const usAudio = record.audios?.find(a => a.accent === 'US')
        const ukAudio = record.audios?.find(a => a.accent === 'UK')
        if (!usAudio && !ukAudio) {
          return <span style={{ color: '#999', fontSize: 12 }}>-</span>
        }
        return (
          <Space direction="vertical" size={4}>
            {usAudio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>美式</Tag>
                <AudioPlayer audioUrl={usAudio.audioUrl} accent="US" size="small" showAccent={false} />
              </div>
            )}
            {ukAudio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>英式</Tag>
                <AudioPlayer audioUrl={ukAudio.audioUrl} accent="UK" size="small" showAccent={false} />
              </div>
            )}
          </Space>
        )
      },
    },
    {
      title: '实物图片',
      key: 'images',
      width: 80,
      render: (_: any, record: Vocabulary) => (
        record.images && record.images.length > 0 ? (
          <Image
            src={record.images[0].imageUrl}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{ mask: '查看' }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaXoOWbvjwvdGV4dD48L3N2Zz4="
          />
        ) : (
          <span style={{ color: '#999', fontSize: 12 }}>-</span>
        )
      ),
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
          <Button
            type={rFirst ? 'primary' : 'default'}
            onClick={() => setRFirst(!rFirst)}
          >
            {rFirst ? 'R开头优先 ✓' : 'R开头优先'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>

            添加词汇
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, limit: pageSize }))
            },
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
                        <Option value="n.">n. 名词</Option>
                        <Option value="v.">v. 动词</Option>
                        <Option value="adj.">adj. 形容词</Option>
                        <Option value="adv.">adv. 副词</Option>
                        <Option value="prep.">prep. 介词</Option>
                        <Option value="pron.">pron. 代词</Option>
                        <Option value="conj.">conj. 连词</Option>
                        <Option value="interj.">interj. 感叹词</Option>
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

          <Form.Item label="实物图片" name="imageUrl">
            <Input.Group compact>
              <Upload
                listType="picture-card"
                fileList={imageFileList}
                beforeUpload={handleImageUpload}
                onRemove={() => {
                  setImageFileList([])
                  form.setFieldValue('imageUrl', '')
                }}
                maxCount={1}
                accept="image/*"
              >
                {imageFileList.length < 1 && (
                  <div>
                    {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                )}
              </Upload>
            </Input.Group>
          </Form.Item>

          <Form.Item label="图片描述" name="imageDescription">
            <Input placeholder="图片描述文字（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
