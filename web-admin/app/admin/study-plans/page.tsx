'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Segmented,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

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
  const [generateModalVisible, setGenerateModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StudyPlan | null>(null)
  const [filters, setFilters] = useState<{ studentName?: string; classId?: string; vocabularyId?: string; status?: string }>({})
  const [form] = Form.useForm()
  const [generateForm] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  // 视图模式：按计划(明细) 或 按班级汇总
  const [viewMode, setViewMode] = useState<'plan' | 'class'>('class')

  // 加载数据
  useEffect(() => {
    fetchData()
    fetchStudents()
    fetchClasses()
    fetchVocabularies()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const qs = new URLSearchParams({
        page: String(pagination.current),
        limit: String(pagination.pageSize),
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
        setPagination({
          ...pagination,
          total: result.data.pagination?.total || 0,
        })
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

  // 批量生成班级学习计划
  const handleGenerate = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        classIds: values.classIds,
        vocabularyIds: values.vocabularyIds,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
      }

      const response = await fetch('/api/plan-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success) {
        message.success(result.message || '班级学习计划生成成功')
        setGenerateModalVisible(false)
        generateForm.resetFields()
        // 新增计划后回到第1页并刷新（配合服务端按创建时间倒序，保证能看到最新）
        setPagination((p) => ({ ...p, current: 1 }))
        fetchData()
      } else {
        message.error(result.message || '生成失败')
      }
    } catch (error) {
      message.error('生成失败')
    }
  }

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

  // 班级维度数据（含统计）
  type ClassRow = {
    key: string
    className: string
    students: string
    planCount: number
    pendingCount: number
    inProgressCount: number
    masteredCount: number
  }
  const classRows: ClassRow[] = useMemo(() => {
    type Agg = {
      students: Set<string>
      plan: number
      pending: number
      inProgress: number
      completed: number
      mastered: number
    }
    const map = new Map<string, Agg>()
    data.forEach((item) => {
      const clsName = (item.student as any).class?.name || item.student?.classes?.name || '-'
      const stuName = item.student?.user?.name || '-'
      if (!map.has(clsName)) {
        map.set(clsName, {
          students: new Set<string>(),
          plan: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          mastered: 0,
        })
      }
      const agg = map.get(clsName)!
      agg.students.add(stuName)
      agg.plan += 1
      switch (item.status) {
        case 'PENDING':
          agg.pending += 1
          break
        case 'IN_PROGRESS':
          agg.inProgress += 1
          break
        case 'COMPLETED':
          agg.completed += 1
          break
        case 'MASTERED':
          agg.mastered += 1
          break
      }
    })
    return Array.from(map.entries()).map(([clsName, agg], idx) => ({
      key: `${clsName}-${idx}`,
      className: clsName,
      students: Array.from(agg.students).join('，'),
      planCount: agg.plan,
      pendingCount: agg.pending,
      inProgressCount: agg.inProgress,
      masteredCount: agg.mastered,
    }))
  }, [data])

  const classColumns: ColumnsType<ClassRow> = [
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '学生', dataIndex: 'students', key: 'students' },
    { title: '计划数', dataIndex: 'planCount', key: 'planCount', align: 'center' as const },
    { title: '待学习', dataIndex: 'pendingCount', key: 'pendingCount', align: 'center' as const },
    { title: '学习中', dataIndex: 'inProgressCount', key: 'inProgressCount', align: 'center' as const },
    { title: '已掌握', dataIndex: 'masteredCount', key: 'masteredCount', align: 'center' as const },
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
          <Segmented
            options={[
              { label: '按班级汇总', value: 'class' },
              { label: '按计划明细', value: 'plan' },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as any)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setGenerateModalVisible(true)}
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
          <Button type="primary" onClick={fetchData}>查询</Button>
          <Button onClick={() => { setFilters({}); setPagination({ ...pagination, current: 1 }); fetchData() }}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
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
        columns={viewMode === 'class' ? (classColumns as any) : columns}
        dataSource={viewMode === 'class' ? (classRows as any) : data}
        rowKey={viewMode === 'class' ? 'key' : 'id'}
        loading={loading}
        scroll={{ x: 1200 }}
        rowSelection={viewMode === 'class' ? undefined : { selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize })
          },
        }}
      />

      {/* 批量生成对话框 */}
      <Modal
        title="批量生成班级学习计划"
        open={generateModalVisible}
        onOk={() => generateForm.submit()}
        onCancel={() => {
          setGenerateModalVisible(false)
          generateForm.resetFields()
        }}
        width={600}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerate}
        >
          <Form.Item
            label="选择班级"
            name="classIds"
            rules={[{ required: true, message: '请选择至少一个班级' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择班级（可多选）"
              showSearch
              optionFilterProp="children"
            >
              {classes.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选择词汇"
            name="vocabularyIds"
            rules={[{ required: true, message: '请选择至少一个词汇' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择词汇（可多选）"
              showSearch
              optionFilterProp="children"
            >
              {vocabularies.map((v) => (
                <Select.Option key={v.id} value={v.id}>
                  {v.word} - {v.primaryMeaning}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="计划开始日期"
            name="startDate"
            rules={[{ required: true, message: '请选择开始日期' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="计划结束日期" name="endDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

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
