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
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import BatchGenerateDialog from '@/components/BatchGenerateDialog'

// 班级分组模式的数据结构
interface GroupedStudyPlan {
  id: string
  classId: string
  className: string
  grade: string
  students: { id: string; name: string }[]
  vocabularies: { id: string; word: string; primaryMeaning: string }[]
  reviewCount: number
  dayLabel: string
  nextReviewAt: string | null
  createdAt: string
  planIds: string[]
}

// 可展开的 Tag 列表组件
function ExpandableTags({ items, labelKey, max = 5 }: { items: any[]; labelKey: string; max?: number }) {
  const [expanded, setExpanded] = useState(false)
  const display = expanded ? items : items.slice(0, max)
  const hasMore = items.length > max

  return (
    <Space size={[4, 4]} wrap>
      {display.map((item, idx) => (
        <Tag key={item.id || idx}>{item[labelKey]}</Tag>
      ))}
      {hasMore && !expanded && (
        <Tag style={{ cursor: 'pointer' }} onClick={() => setExpanded(true)}>
          +{items.length - max} 更多
        </Tag>
      )}
      {hasMore && expanded && (
        <Tag style={{ cursor: 'pointer' }} onClick={() => setExpanded(false)}>
          收起
        </Tag>
      )}
    </Space>
  )
}

export default function StudyPlansPage() {
  const [data, setData] = useState<GroupedStudyPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [classes, setClasses] = useState<any[]>([])
  const [vocabularies, setVocabularies] = useState<any[]>([])
  const [filters, setFilters] = useState<{ studentName?: string; classId?: string; nextReviewRange?: [dayjs.Dayjs, dayjs.Dayjs] | null; createdRange?: [dayjs.Dayjs, dayjs.Dayjs] | null }>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchOpen, setBatchOpen] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingGroup, setEditingGroup] = useState<GroupedStudyPlan | null>(null)
  const [editForm] = Form.useForm()

  // 加载数据
  useEffect(() => {
    fetchData()
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
        groupBy: 'class',
      })
      if (filters.studentName) qs.append('studentName', filters.studentName)
      if (filters.classId) qs.append('classId', filters.classId)
      if (filters.nextReviewRange?.[0]) qs.append('nextReviewStart', filters.nextReviewRange[0].format('YYYY-MM-DD'))
      if (filters.nextReviewRange?.[1]) qs.append('nextReviewEnd', filters.nextReviewRange[1].format('YYYY-MM-DD'))
      if (filters.createdRange?.[0]) qs.append('createdStart', filters.createdRange[0].format('YYYY-MM-DD'))
      if (filters.createdRange?.[1]) qs.append('createdEnd', filters.createdRange[1].format('YYYY-MM-DD'))

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

  // 批量更新计划（整组）
  const handleBatchUpdate = async (values: any) => {
    if (!editingGroup) return
    try {
      const token = localStorage.getItem('token')
      // 批量更新所有计划的下次复习时间
      for (const planId of editingGroup.planIds) {
        await fetch('/api/study-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            planId,
            nextReviewAt: values.nextReviewAt ? dayjs(values.nextReviewAt).format('YYYY-MM-DD') : null,
          }),
        })
      }
      message.success('更新成功')
      setEditModalVisible(false)
      setEditingGroup(null)
      editForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除计划（支持批量删除整组）
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
        setSelectedRowKeys([])
        fetchData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }


  // 班级分组模式的列定义
  const columns: ColumnsType<GroupedStudyPlan> = [
    {
      title: '班级',
      key: 'class',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.className}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.grade}</div>
        </div>
      ),
    },
    {
      title: '学生',
      key: 'students',
      width: 200,
      render: (_, record) => (
        <ExpandableTags items={record.students} labelKey="name" max={5} />
      ),
    },
    {
      title: '单词',
      key: 'vocabularies',
      width: 250,
      render: (_, record) => (
        <ExpandableTags items={record.vocabularies} labelKey="word" max={5} />
      ),
    },
    {
      title: '记忆天数',
      dataIndex: 'dayLabel',
      width: 100,
      render: (dayLabel) => <Tag color="blue">{dayLabel}</Tag>,
    },
    {
      title: '下次复习',
      dataIndex: 'nextReviewAt',
      width: 110,
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 140,
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingGroup(record)
              editForm.setFieldsValue({ nextReviewAt: record.nextReviewAt ? dayjs(record.nextReviewAt) : null })
              setEditModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该组学习计划"
            description={`将删除 ${record.planIds.length} 条学习计划`}
            okText="确认删除"
            okType="danger"
            cancelText="取消"
            onConfirm={() => handleDelete(record.planIds)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 统计数据
  const totalPlans = data.reduce((sum, g) => sum + g.planIds.length, 0)
  const totalStudents = new Set(data.flatMap(g => g.students.map(s => s.id))).size
  const totalVocabs = new Set(data.flatMap(g => g.vocabularies.map(v => v.id))).size

  return (
    <div>
      <h2>学习计划管理</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="计划组数" value={data.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总计划数" value={totalPlans} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="学生数" value={totalStudents} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="单词数" value={totalVocabs} valueStyle={{ color: '#722ed1' }} />
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
            style={{ color: '#fff' }}
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
          <DatePicker.RangePicker
            placeholder={['下次复习开始', '下次复习结束']}
            style={{ width: 240 }}
            value={filters.nextReviewRange}
            onChange={(dates) => setFilters({ ...filters, nextReviewRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
          />
          <DatePicker.RangePicker
            placeholder={['创建时间开始', '创建时间结束']}
            style={{ width: 240 }}
            value={filters.createdRange}
            onChange={(dates) => setFilters({ ...filters, createdRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
          />
          <Button type="primary" onClick={() => { setPagination((p) => ({ ...p, current: 1 })); fetchData({ page: 1, pageSize: pagination.pageSize }) }}>查询</Button>
          <Button onClick={() => { setFilters({}); setPagination({ ...pagination, current: 1 }); fetchData({ page: 1, pageSize: pagination.pageSize }) }}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={() => {
                const allPlanIds = data.filter(g => selectedRowKeys.includes(g.id)).flatMap(g => g.planIds)
                Modal.confirm({
                  title: '确认批量删除',
                  content: `确定要删除选中的 ${selectedRowKeys.length} 组（共 ${allPlanIds.length} 条）学习计划吗？`,
                  onOk: () => handleDelete(allPlanIds),
                })
              }}
            >
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
        title={`编辑学习计划 - ${editingGroup?.className} ${editingGroup?.dayLabel}`}
        open={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => { setEditModalVisible(false); setEditingGroup(null); editForm.resetFields() }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleBatchUpdate}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            将批量更新 {editingGroup?.planIds.length} 条学习计划
          </p>
          <Form.Item label="下次复习时间" name="nextReviewAt">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
