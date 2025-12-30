'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Select,
  Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import BatchGenerateDialog from '@/components/BatchGenerateDialog'

interface PlanClass {
  id: string
  class_id: string
  pack_id: string
  status: 'ACTIVE' | 'COMPLETED'
  start_date: string
  created_at: string
  updated_at: string
  classes: { name: string }
  vocabulary_packs: { id: string; name: string; totalDays: number; totalWords: number }
}

const STATUS_CONFIG = {
  ACTIVE: { label: '进行中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
}

export default function StudyPlansPage() {
  const [data, setData] = useState<PlanClass[]>([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [vocabularies, setVocabularies] = useState<any[]>([])
  const [filters, setFilters] = useState<{ classId?: string; status?: string }>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchOpen, setBatchOpen] = useState(false)

  useEffect(() => {
    fetchData()
    fetchClasses()
    fetchVocabularies()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const qs = new URLSearchParams()
      if (filters.classId) qs.append('classId', filters.classId)
      if (filters.status) qs.append('status', filters.status)

      const response = await fetch(`/api/plan-classes?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await response.json()
      if (result.success) {
        setData(result.data.planClasses || [])
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/classes?limit=5000', {
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await fetch('/api/vocabularies?limit=5000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setVocabularies(result.data?.vocabularies || [])
      }
    } catch (error) {
      console.error('加载词汇列表失败:', error)
    }
  }

  const handleDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/plan-classes?ids=${ids.join(',')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        setSelectedRowKeys([])
        fetchData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/plan-classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })

      const result = await response.json()
      if (result.success) {
        message.success('状态更新成功')
        fetchData()
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns: ColumnsType<PlanClass> = [
    {
      title: '班级',
      key: 'class',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.classes?.name}</div>
        </div>
      ),
    },
    {
      title: '词汇库',
      key: 'pack',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.vocabulary_packs?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.vocabulary_packs?.totalDays}天 / {record.vocabulary_packs?.totalWords}词
          </div>
        </div>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '当前进度',
      key: 'progress',
      width: 120,
      render: (_, record) => {
        const startDate = dayjs(record.start_date)
        const today = dayjs()
        const dayNumber = today.diff(startDate, 'day') + 1
        const totalDays = record.vocabulary_packs?.totalDays || 0
        const progress = Math.min(dayNumber, totalDays)
        return (
          <div>
            <Tag color={dayNumber > totalDays ? 'green' : 'blue'}>
              第 {progress} / {totalDays} 天
            </Tag>
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: keyof typeof STATUS_CONFIG) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 140,
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_, record) => (
        <Space>
          <Select
            size="small"
            value={record.status}
            style={{ width: 90 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            options={[
              { label: '进行中', value: 'ACTIVE' },
              { label: '已完成', value: 'COMPLETED' },
            ]}
          />
          <Popconfirm
            title="确认删除该班级计划"
            okText="确认"
            okType="danger"
            cancelText="取消"
            onConfirm={() => handleDelete([record.id])}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2>班级学习计划</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="计划总数" value={data.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={data.filter(d => d.status === 'ACTIVE').length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={data.filter(d => d.status === 'COMPLETED').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="涉及班级"
              value={new Set(data.map(d => d.class_id)).size}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBatchOpen(true)}
            style={{ color: '#fff' }}
          >
            新建班级计划
          </Button>
          <Select
            placeholder="选择班级"
            allowClear
            style={{ width: 180 }}
            value={filters.classId}
            onChange={(val) => setFilters({ ...filters, classId: val || undefined })}
          >
            {classes.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val || undefined })}
            options={[
              { label: '进行中', value: 'ACTIVE' },
              { label: '已完成', value: 'COMPLETED' },
            ]}
          />
          <Button type="primary" onClick={fetchData}>查询</Button>
          <Button onClick={() => { setFilters({}); fetchData() }}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title="确认批量删除"
              description={`确定要删除选中的 ${selectedRowKeys.length} 个班级计划吗？`}
              okText="确认删除"
              okType="danger"
              cancelText="取消"
              onConfirm={() => handleDelete(selectedRowKeys.map(String))}
            >
              <Button danger>批量删除 ({selectedRowKeys.length})</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <BatchGenerateDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        classes={classes}
        vocabularies={vocabularies}
        onCompleted={async () => {
          setBatchOpen(false)
          await fetchData()
        }}
      />
    </div>
  )
}
