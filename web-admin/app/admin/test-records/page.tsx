'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Modal,
  Card,
  Statistic,
  DatePicker,
  Row,
  Col,
  Descriptions,
  Input,
  Tooltip,
  Progress,
} from 'antd'
import {
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  BookOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface QuizRecord {
  id: string
  studentId: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
  unknownCount: number
  estimatedVocab: number
  accuracy: number
  totalTime: number
  startedAt: string
  completedAt?: string
  isCompleted: boolean
  createdAt: string
  students: {
    id: string
    student_no: string
    user: {
      name: string
    }
    classes: {
      name: string
    }
  }
}

interface QuizAnswer {
  id: string
  userAnswer: string
  isCorrect: boolean
  timeSpent?: number
  question: {
    id: string
    questionNo: number
    word?: string
    questionText?: string
    questionType: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    optionE: string
    correctOption: string
  }
}

export default function TestRecordsPage() {
  const [data, setData] = useState<QuizRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const offset = (currentPage - 1) * pageSize

      let url = `/api/test-records?limit=${pageSize}&offset=${offset}`
      if (searchText.trim()) {
        url += `&search=${encodeURIComponent(searchText.trim())}`
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
          records = records.filter((r: QuizRecord) => {
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
  }, [currentPage, pageSize, searchText, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleViewDetails = async (record: QuizRecord) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/test-records/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()

      if (result.success) {
        const detail = result.data
        const answers: QuizAnswer[] = detail.answers || []

        Modal.info({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOutlined style={{ color: '#4F46E5' }} />
              <span>词汇量测试详情 — {record.students.user.name}</span>
            </div>
          ),
          width: 860,
          content: (
            <div style={{ marginTop: 16 }}>
              {/* 基本信息 */}
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="学生姓名">
                  {record.students.user.name}
                </Descriptions.Item>
                <Descriptions.Item label="学号">
                  {record.students.student_no}
                </Descriptions.Item>
                <Descriptions.Item label="班级">
                  {record.students.classes?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="估算词汇量">
                  <span style={{ fontSize: 20, fontWeight: 'bold', color: '#4F46E5' }}>
                    {record.estimatedVocab}
                  </span>
                  <span style={{ color: '#999', marginLeft: 4 }}>词</span>
                </Descriptions.Item>
                <Descriptions.Item label="正确率">
                  <span style={{
                    fontWeight: 'bold',
                    color: record.accuracy >= 80 ? '#52c41a' : record.accuracy >= 60 ? '#faad14' : '#ff4d4f'
                  }}>
                    {record.accuracy.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="用时">
                  {Math.floor(record.totalTime / 60)}分{record.totalTime % 60}秒
                </Descriptions.Item>
                <Descriptions.Item label="总题数">{record.totalQuestions}</Descriptions.Item>
                <Descriptions.Item label="正确">
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{record.correctCount}</span>
                </Descriptions.Item>
                <Descriptions.Item label="错误 / 不认识">
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{record.wrongCount}</span>
                  {' / '}
                  <span style={{ color: '#999', fontWeight: 'bold' }}>{record.unknownCount}</span>
                </Descriptions.Item>
                <Descriptions.Item label="开始时间" span={2}>
                  {new Date(record.startedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  {record.completedAt ? new Date(record.completedAt).toLocaleString('zh-CN') : '未完成'}
                </Descriptions.Item>
              </Descriptions>

              {/* 答题详情 */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ margin: '0 0 12px 0' }}>答题详情：</h4>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {answers.length > 0 ? answers.map((answer, index) => {
                    const q = answer.question
                    const optionMap: Record<string, string> = {
                      A: q.optionA,
                      B: q.optionB,
                      C: q.optionC,
                      D: q.optionD,
                      E: q.optionE,
                    }
                    const isUnknown = answer.userAnswer === 'E'

                    return (
                      <div key={answer.id} style={{
                        padding: '10px 12px',
                        marginBottom: 8,
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        backgroundColor: answer.isCorrect ? '#f6ffed' : isUnknown ? '#fafafa' : '#fff2f0',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ marginRight: 8 }}>
                              {q.questionNo || index + 1}. {q.word || q.questionText}
                            </strong>
                            <span style={{ color: '#888', fontSize: 12 }}>
                              [{q.questionType === 'ENGLISH_TO_CHINESE' ? '英译汉' :
                                q.questionType === 'CHINESE_TO_ENGLISH' ? '汉译英' : '形近词'}]
                            </span>
                          </div>
                          <div>
                            {answer.isCorrect ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
                            ) : isUnknown ? (
                              <Tag color="default" icon={<QuestionCircleOutlined />}>不认识</Tag>
                            ) : (
                              <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
                            )}
                          </div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                          <span>学生答案：{answer.userAnswer} ({optionMap[answer.userAnswer] || '-'})</span>
                          {!answer.isCorrect && (
                            <span style={{ marginLeft: 16, color: '#52c41a' }}>
                              正确答案：{q.correctOption} ({optionMap[q.correctOption] || '-'})
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  }) : (
                    <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无答题详情</div>
                  )}
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

  const getVocabColor = (vocab: number) => {
    if (vocab >= 1500) return '#52c41a'
    if (vocab >= 1000) return '#1890ff'
    if (vocab >= 500) return '#faad14'
    return '#ff4d4f'
  }

  const columns: ColumnsType<QuizRecord> = [
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
      title: '班级',
      key: 'className',
      width: 120,
      render: (_, record) => record.students.classes?.name || '-',
    },
    {
      title: '估算词汇量',
      dataIndex: 'estimatedVocab',
      key: 'estimatedVocab',
      width: 140,
      align: 'center',
      render: (vocab: number) => (
        <span style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: getVocabColor(vocab),
        }}>
          {vocab}
        </span>
      ),
      sorter: (a, b) => a.estimatedVocab - b.estimatedVocab,
    },
    {
      title: '正确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 140,
      align: 'center',
      render: (accuracy: number) => (
        <Tooltip title={`${accuracy.toFixed(1)}%`}>
          <Progress
            percent={Math.round(accuracy)}
            size="small"
            strokeColor={accuracy >= 80 ? '#52c41a' : accuracy >= 60 ? '#faad14' : '#ff4d4f'}
            style={{ width: 100 }}
          />
        </Tooltip>
      ),
      sorter: (a, b) => a.accuracy - b.accuracy,
    },
    {
      title: '对 / 错 / 不认识',
      key: 'stats',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <span>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{record.correctCount}</span>
          {' / '}
          <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{record.wrongCount}</span>
          {' / '}
          <span style={{ color: '#999', fontWeight: 600 }}>{record.unknownCount}</span>
        </span>
      ),
    },
    {
      title: '用时',
      dataIndex: 'totalTime',
      key: 'totalTime',
      width: 90,
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
      width: 90,
      align: 'center',
      render: (isCompleted: boolean) => (
        <Tag color={isCompleted ? 'success' : 'warning'}>
          {isCompleted ? '已完成' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '测试时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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

  // 基于当前页数据计算统计
  const stats = {
    total: total,
    completed: data.filter(r => r.isCompleted).length,
    avgVocab: data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.estimatedVocab, 0) / data.length) : 0,
    avgAccuracy: data.length > 0 ? (data.reduce((sum, r) => sum + r.accuracy, 0) / data.length).toFixed(1) : '0',
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总测试次数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成（当前页）" value={stats.completed} />
          </Col>
          <Col span={6}>
            <Statistic title="平均词汇量（当前页）" value={stats.avgVocab} suffix="词" />
          </Col>
          <Col span={6}>
            <Statistic title="平均正确率（当前页）" value={stats.avgAccuracy} suffix="%" />
          </Col>
        </Row>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            style={{ width: 220 }}
            placeholder="搜索学生姓名或学号"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => {
              setSearchText(value)
              setCurrentPage(1)
            }}
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['开始日期', '结束日期']}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('')
              setDateRange(null)
              setCurrentPage(1)
              loadData()
            }}
          >
            重置
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
