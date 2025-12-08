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
  InputNumber,
  Switch,
  Select,
  Card,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input

interface ProficiencyTest {
  id: string
  name: string
  description?: string
  vocabularyIds: string[]
  totalWords: number
  passScore: number
  duration?: number
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  _count?: {
    test_records: number
  }
}

interface Vocabulary {
  id: string
  word: string
  primary_meaning: string
}

export default function ProficiencyTestsPage() {
  const [data, setData] = useState<ProficiencyTest[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProficiencyTest | null>(null)
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadVocabularies()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/proficiency-tests', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data || [])
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadVocabularies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vocabularies', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setVocabularies(result.data?.vocabularies || [])
      }
    } catch (error) {
      console.error('加载词汇失败:', error)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      passScore: 60,
      isActive: true,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ProficiencyTest) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      vocabularyIds: record.vocabularyIds,
      passScore: record.passScore,
      duration: record.duration,
      isActive: record.isActive,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: ProficiencyTest) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除测试题库"${record.name}"吗？`,
      onOk: async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/proficiency-tests/${record.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            loadData()
          } else {
            message.error(result.message || '删除失败')
          }
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null

      const url = editingRecord
        ? `/api/proficiency-tests/${editingRecord.id}`
        : '/api/proficiency-tests'

      const method = editingRecord ? 'PUT' : 'POST'

      const body: any = {
        ...values,
      }

      if (!editingRecord) {
        body.createdBy = user?.id || ''
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingRecord ? '更新成功' : '创建成功')
        setModalVisible(false)
        loadData()
      } else {
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<ProficiencyTest> = [
    {
      title: '测试名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '词汇数',
      dataIndex: 'totalWords',
      key: 'totalWords',
      width: 100,
      align: 'center',
    },
    {
      title: '及格分',
      dataIndex: 'passScore',
      key: 'passScore',
      width: 100,
      align: 'center',
      render: (score: number) => `${score}分`,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
      render: (duration?: number) => duration ? `${duration}分钟` : '不限时',
    },
    {
      title: '测试次数',
      key: 'testCount',
      width: 100,
      align: 'center',
      render: (_, record) => record._count?.test_records || 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record._count && record._count.test_records > 0}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleViewDetails = (record: ProficiencyTest) => {
    Modal.info({
      title: `测试详情 - ${record.name}`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>描述：</strong>{record.description || '无'}</p>
          <p><strong>词汇数：</strong>{record.totalWords}</p>
          <p><strong>及格分：</strong>{record.passScore}分</p>
          <p><strong>时长：</strong>{record.duration ? `${record.duration}分钟` : '不限时'}</p>
          <p><strong>测试次数：</strong>{record._count?.test_records || 0}</p>
          <p><strong>状态：</strong>{record.isActive ? '启用' : '停用'}</p>
          <p><strong>创建时间：</strong>{new Date(record.createdAt).toLocaleString('zh-CN')}</p>
        </div>
      ),
    })
  }

  const stats = {
    total: data.length,
    active: data.filter(t => t.isActive).length,
    totalTests: data.reduce((sum, t) => sum + (t._count?.test_records || 0), 0),
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <Statistic title="测试题库总数" value={stats.total} />
          <Statistic title="启用中" value={stats.active} />
          <Statistic title="累计测试次数" value={stats.totalTests} />
        </Space>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建测试题库
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑测试题库' : '新建测试题库'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="测试名称"
            rules={[{ required: true, message: '请输入测试名称' }]}
          >
            <Input placeholder="例如：高考核心词汇测试" />
          </Form.Item>

          <Form.Item
            name="description"
            label="测试描述"
          >
            <TextArea rows={3} placeholder="简要描述测试内容和目的" />
          </Form.Item>

          <Form.Item
            name="vocabularyIds"
            label="选择词汇"
            rules={[{ required: true, message: '请选择词汇' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择要测试的词汇"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={vocabularies.map(v => ({
                label: `${v.word} - ${v.primary_meaning}`,
                value: v.id,
              }))}
              maxTagCount="responsive"
            />
          </Form.Item>

          <Form.Item
            name="passScore"
            label="及格分数"
            rules={[{ required: true, message: '请输入及格分数' }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              addonAfter="分"
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="测试时长（分钟）"
            tooltip="留空表示不限时"
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="不限时"
              addonAfter="分钟"
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
