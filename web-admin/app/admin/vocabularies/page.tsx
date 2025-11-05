'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Popconfirm,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'

const { TextArea } = Input
const { Option } = Select

interface Vocabulary {
  id: string
  word: string
  partOfSpeech: string[]
  primaryMeaning: string
  secondaryMeaning?: string
  phonetic?: string
  isHighFrequency: boolean
  difficulty: string
  createdAt: string
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
      const response = await fetch('/api/vocabularies', {
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

  const handleEdit = (record: Vocabulary) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      partOfSpeech: record.partOfSpeech || [],
    })
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
    },
    {
      title: '词性',
      dataIndex: 'partOfSpeech',
      key: 'partOfSpeech',
      width: 120,
      render: (pos: string[]) => (
        <>
          {pos?.map((p, i) => (
            <Tag key={i} color="blue">
              {p}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '核心释义',
      dataIndex: 'primaryMeaning',
      key: 'primaryMeaning',
      width: 200,
      ellipsis: true,
    },
    {
      title: '音标',
      dataIndex: 'phonetic',
      key: 'phonetic',
      width: 150,
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
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin/vocabularies/${record.id}`)}
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
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
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
          scroll={{ x: 1000 }}
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

          <Form.Item
            label="词性"
            name="partOfSpeech"
            rules={[{ required: true, message: '请选择词性' }]}
          >
            <Select mode="multiple" placeholder="选择词性">
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
            label="核心释义"
            name="primaryMeaning"
            rules={[{ required: true, message: '请输入核心释义' }]}
          >
            <TextArea rows={2} placeholder="例如: 你好；问候" />
          </Form.Item>

          <Form.Item label="延伸释义" name="secondaryMeaning">
            <TextArea rows={2} placeholder="其他释义（可选）" />
          </Form.Item>

          <Form.Item label="音标" name="phonetic">
            <Input placeholder="例如: /həˈloʊ/" />
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
        </Form>
      </Modal>
    </div>
  )
}
