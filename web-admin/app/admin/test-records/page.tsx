'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Modal,
  Card,
  Statistic,
  Select,
  DatePicker,
  Row,
  Col,
  Descriptions,
} from 'antd'
import {
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface TestRecord {
  id: string
  testId: string
  studentId: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
  score: number
  accuracy: number
  totalTime: number
  startedAt: string
  completedAt?: string
  isCompleted: boolean
  answers: any[]
  createdAt: string
  proficiency_tests: {
    id: string
    name: string
    totalWords: number
    passScore: number
  }
  students: {
    id: string
    student_no: string
    user: {
      name: string
    }
  }
}

export default function TestRecordsPage() {
  const [data, setData] = useState<TestRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [tests, setTests] = useState<any[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  useEffect(() => {
    loadTests()
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [currentPage, pageSize, selectedTestId, dateRange])

  const loadTests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/proficiency-tests', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setTests(result.data || [])
      }
    } catch (error) {
      console.error('加载测试列表失败:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const offset = (currentPage - 1) * pageSize

      let url = `/api/test-records?limit=${pageSize}&offset=${offset}`
      if (selectedTestId) {
        url += `&testId=${selectedTestId}`
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        let records = result.data?.records || []

        // 前端过滤日期范围
        if (dateRange) {
          const [start, end] = dateRange
          records = records.filter((r: TestRecord) => {
            const recordDate = dayjs(r.createdAt)
            return recordDate.isAfter(start.startOf('day')) && recordDate.isBefore(end.endOf('day'))
          })
        }

        setData(records)
        setTotal(result.data?.total || 0)
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (record: TestRecord) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/test-records/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()

      if (result.success) {
        const detailRecord = result.data

        Modal.info({
          title: `测试详情 - ${record.students.user.name}`,
          width: 800,
          content: (
            <div style={{ marginTop: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="测试名称" span={2}>
                  {record.proficiency_tests.name}
                </Descriptions.Item>
                <Descriptions.Item label="学生姓名">
                  {record.students.user.name}
                </Descriptions.Item>
                <Descriptions.Item label="学号">
                  {record.students.student_no}
                </Descriptions.Item>
                <Descriptions.Item label="总题数">
                  {record.totalQuestions}
                </Descriptions.Item>
                <Descriptions.Item label="正确数">
                  <span style={{ color: '#52c41a' }}>{record.correctCount}</span>
                </Descriptions.Item>
                <Descriptions.Item label="错误数">
                  <span style={{ color: '#ff4d4f' }}>{record.wrongCount}</span>
                </Descriptions.Item>
                <Descriptions.Item label="得分">
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: record.score >= record.proficiency_tests.passScore ? '#52c41a' : '#ff4d4f' }}>
                    {record.score}分
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="正确率">
                  {(record.accuracy * 100).toFixed(1)}%
                </Descriptions.Item>
                <Descriptions.Item label="用时">
                  {Math.floor(record.totalTime / 60)}分{record.totalTime % 60}秒
                </Descriptions.Item>
                <Descriptions.Item label="开始时间" span={2}>
                  {new Date(record.startedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="完成时间" span={2}>
                  {record.completedAt ? new Date(record.completedAt).toLocaleString('zh-CN') : '未完成'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 16 }}>
                <h4>答题详情：</h4>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {detailRecord.answers.map((answer: any, index: number) => (
                    <div key={index} style={{
                      padding: 8,
                      marginBottom: 8,
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      backgroundColor: answer.isCorrect ? '#f6ffed' : '#fff2f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{index + 1}. {answer.vocabulary?.word}</strong>
                          <span style={{ marginLeft: 8, color: '#666' }}>
                            {answer.vocabulary?.primary_meaning}
                          </span>
                        </div>
                        <div>
                          {answer.isCorrect ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
                          ) : (
                            <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        学生答案：{answer.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        })
      } else {
        message.error('加载详情失败')
      }
    } catch (error) {
      message.error('加载详情失败')
    }
  }

  const columns: ColumnsType<TestRecord> = [
    {
      title: '测试名称',
      key: 'testName',
      width: 200,
      render: (_, record) => record.proficiency_tests.name,
    },
    {
      title: '学生姓名',
      key: 'studentName',
      width: 120,
      render: (_, record) => record.students.user.name,
    },
    {
      title: '学号',
      key: 'studentNo',
      width: 120,
      render: (_, record) => record.students.student_no,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'center',
      render: (score: number, record) => {
        const isPassed = score >= record.proficiency_tests.passScore
        return (
          <span style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: isPassed ? '#52c41a' : '#ff4d4f'
          }}>
            {score}
          </span>
        )
      },
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: '正确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 100,
      align: 'center',
      render: (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`,
      sorter: (a, b) => a.accuracy - b.accuracy,
    },
    {
      title: '正确/错误',
      key: 'correctWrong',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          <span style={{ color: '#52c41a' }}>{record.correctCount}</span>
          {' / '}
          <span style={{ color: '#ff4d4f' }}>{record.wrongCount}</span>
        </span>
      ),
    },
    {
      title: '用时',
      dataIndex: 'totalTime',
      key: 'totalTime',
      width: 100,
      align: 'center',
      render: (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      },
    },
    {
      title: '状态',
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      width: 100,
      align: 'center',
      render: (isCompleted: boolean) => (
        <Tag color={isCompleted ? 'success' : 'warning'}>
          {isCompleted ? '已完成' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '测试时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  const stats = {
    total: data.length,
    completed: data.filter(r => r.isCompleted).length,
    avgScore: data.length > 0 ? (data.reduce((sum, r) => sum + r.score, 0) / data.length).toFixed(1) : 0,
    passRate: data.length > 0 ? ((data.filter(r => r.score >= r.proficiency_tests.passScore).length / data.length) * 100).toFixed(1) : 0,
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总测试次数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成" value={stats.completed} />
          </Col>
          <Col span={6}>
            <Statistic title="平均分" value={stats.avgScore} suffix="分" />
          </Col>
          <Col span={6}>
            <Statistic title="通过率" value={stats.passRate} suffix="%" />
          </Col>
        </Row>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 200 }}
            placeholder="选择测试"
            allowClear
            value={selectedTestId}
            onChange={setSelectedTestId}
            options={tests.map(t => ({
              label: t.name,
              value: t.id,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
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
          scroll={{ x: 1400 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </Card>
    </div>
  )
}
