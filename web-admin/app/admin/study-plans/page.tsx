'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Input,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import BatchGenerateDialog from '@/components/BatchGenerateDialog'

interface Student {
  id: string
  user: {
    name: string
    email: string | null
  }
  class: {
    name: string
  } | null
}

interface Vocabulary {
  word: string
  primaryMeaning: string
  difficulty: string
  isHighFrequency: boolean
}

interface StudyPlan {
  id: string
  studentId: string
  vocabularyId: string
  status: string
  reviewCount: number
  lastReviewAt: string | null
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
  student: Student
  vocabulary: Vocabulary
}

export default function StudyPlansPage() {
  const [data, setData] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [vocabularies, setVocabularies] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
const [editingRecord, setEditingRecord] = useState<StudyPlan | null>(null)
  const [filters, setFilters] = useState<{ studentName?: string; classId?: string; vocabularyId?: string; status?: string }>({})
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchOpen, setBatchOpen] = useState(false)

  // 加载数据
  useEffect(() => {
    fetchData()
    fetchStudents()
    fetchClasses()
    fetchVocabularies()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async (override?: { page?: number; pageSize?: number }) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const page = override?.page ?? pagination.current
      const limit = override?.pageSize ?? pagination.pageSize
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (filters.studentName) qs.append('studentName', filters.studentName)
      if (filters.classId) qs.append('classId', filters.classId)
      if (filters.vocabularyId) qs.append('vocabularyId', filters.vocabularyId)
      if (filters.status) qs.append('status', filters.status)

      const response = await fetch(
        `/api/study-plans?${qs.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()
      if (result.success) {
        setData(result.data.studyPlans || [])
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: result.data.pagination?.total || 0,
        }))
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setStudents(result.data?.students || [])
      }
    } catch (error) {
      console.error('加载学生列表失败:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/classes?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setClasses(result.data || [])
      }
    } catch (error) {
      console.error('加载班级列表失败:', error)
    }
  }

  const fetchVocabularies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vocabularies?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setVocabularies(result.data?.vocabularies || [])
      }
    } catch (error) {
      console.error('加载词汇列表失败:', error)
    }
  }

// 批量生成班级学习计划交互改由 BatchGenerateDialog 负责

  // 更新计划
  const handleUpdate = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/study-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: editingRecord?.id,
          ...values,
        }),
      })

      const result = await response.json()
      if (result.success) {
        message.success(result.message || '更新成功')
        setModalVisible(false)
        setEditingRecord(null)
        form.resetFields()
        fetchData()
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除计划
  const handleDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/study-plans?ids=${ids.join(',')}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 明细模式下的列（调整为 班级 在前，学生 在后）
  const columns: ColumnsType<StudyPlan> = [
    {
      title: '班级',
      key: 'class',
      render: (_, record) => (record.student as any).class?.name || record.student?.classes?.name || '-',
    },
    {
      title: '学生',
      key: 'student',
      render: (_, record) => record.student.user.name,
    },
    {
      title: '单词',
      key: 'word',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{record.vocabulary.word}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.vocabulary.primaryMeaning}
          </span>
        </Space>
      ),
    },
    {
      title: '难度',
      dataIndex: ['vocabulary', 'difficulty'],
      render: (difficulty) => {
        const colorMap: any = {
          EASY: 'green',
          MEDIUM: 'orange',
          HARD: 'red',
        }
        const textMap: any = {
          EASY: '简单',
          MEDIUM: '中等',
          HARD: '困难',
        }
        return <Tag color={colorMap[difficulty]}>{textMap[difficulty]}</Tag>
      },
    },
    {
      title: '高频词',
      dataIndex: ['vocabulary', 'isHighFrequency'],
      render: (isHigh) => (isHigh ? <Tag color="red">是</Tag> : <span>否</span>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const colorMap: any = {
          PENDING: 'default',
          IN_PROGRESS: 'processing',
          COMPLETED: 'success',
          MASTERED: 'purple',
        }
        const textMap: any = {
          PENDING: '待学习',
          IN_PROGRESS: '学习中',
          COMPLETED: '已完成',
          MASTERED: '已掌握',
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    {
      title: '复习次数',
      dataIndex: 'reviewCount',
    },
    {
      title: '下次复习',
      dataIndex: 'nextReviewAt',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record)
              form.setFieldsValue({
                status: record.status,
                nextReviewAt: record.nextReviewAt
                  ? dayjs(record.nextReviewAt)
                  : null,
              })
              setModalVisible(true)
            }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]


  // 统计数据
  const stats = {
    total: data.length,
    pending: data.filter((d) => d.status === 'PENDING').length,
    inProgress: data.filter((d) => d.status === 'IN_PROGRESS').length,
    completed: data.filter((d) => d.status === 'COMPLETED').length,
    mastered: data.filter((d) => d.status === 'MASTERED').length,
  }

  return (
    <div>
      <h2>学习计划管理</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总计划数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待学习"
              value={stats.pending}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="学习中"
              value={stats.inProgress}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已掌握"
              value={stats.mastered}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
onClick={() => setBatchOpen(true)}
          >
            批量生成计划
          </Button>
          <Input
            placeholder="学生姓名"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 180 }}
            value={filters.studentName}
            onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
          />
          <Select
            placeholder="选择班级"
            allowClear
            style={{ width: 180 }}
            value={filters.classId}
            onChange={(val) => setFilters({ ...filters, classId: val || undefined })}
          >
            {classes.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 160 }}
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val || undefined })}
          >
            <Select.Option value="PENDING">待学习</Select.Option>
            <Select.Option value="IN_PROGRESS">学习中</Select.Option>
            <Select.Option value="COMPLETED">已完成</Select.Option>
            <Select.Option value="MASTERED">已掌握</Select.Option>
          </Select>
          <Select
            showSearch
            placeholder="选择词汇"
            allowClear
            style={{ width: 220 }}
            value={filters.vocabularyId}
            onChange={(val) => setFilters({ ...filters, vocabularyId: val || undefined })}
            optionFilterProp="children"
          >
            {vocabularies.map((v) => (
              <Select.Option key={v.id} value={v.id}>
                {v.word} - {v.primaryMeaning}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => { setPagination((p)=>({ ...p, current: 1 })); fetchData({ page: 1, pageSize: pagination.pageSize }) }}>查询</Button>
          <Button onClick={() => { setFilters({}); setPagination({ ...pagination, current: 1 }); fetchData({ page: 1, pageSize: pagination.pageSize }) }}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={async () => {
              await handleDelete(selectedRowKeys as string[])
              setSelectedRowKeys([])
            }}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize })
          },
        }}
      />

<BatchGenerateDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        classes={classes}
        vocabularies={vocabularies}
        onCompleted={async () => {
          setBatchOpen(false)
          setPagination((p) => ({ ...p, current: 1 }))
          await fetchData({ page: 1, pageSize: pagination.pageSize })
        }}
      />

      {/* 编辑对话框 */}
      <Modal
        title="编辑学习计划"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="状态" name="status">
            <Select>
              <Select.Option value="PENDING">待学习</Select.Option>
              <Select.Option value="IN_PROGRESS">学习中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="MASTERED">已掌握</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="下次复习时间" name="nextReviewAt">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
