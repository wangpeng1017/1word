'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, DatePicker, Select, Tabs, Table, Tag, Space, message, Button } from 'antd'
import { Pie } from '@ant-design/plots'
import {
  UserOutlined,
  DownloadOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const { TabPane } = Tabs

interface OverviewData {
  overview: {
    totalStudents: number
    activeStudents: number
    totalVocabularies: number
    totalSessions: number
    completedSessions: number
    totalWords: number
    avgAccuracy: string
    totalTime: number
  }
  mastery: {
    masteredWords: number
    learningWords: number
    difficultWords: number
    masteryRate: string
  }
  dailyTrend: Array<{
    date: string
    sessions: number
    words: number
    correct: number
    wrong: number
    accuracy: string
  }>
  topWrongWords: Array<{
    word: string
    meaning: string
    difficulty: string
    count: number
  }>
  partOfSpeechDistribution?: Array<{ pos: string; count: number }>
}

interface RankingData {
  rank: number
  studentName: string
  studentNo: string
  className?: string
  [key: string]: any
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [rankings, setRankings] = useState<RankingData[]>([])
  const [rankingType, setRankingType] = useState('mastery')
  const [classFilter, setClassFilter] = useState<string | undefined>()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])

  useEffect(() => {
    loadClasses()
    loadOverview()
  }, [])

  useEffect(() => {
    loadOverview()
  }, [dateRange, classFilter])

  useEffect(() => {
    loadRankings()
  }, [rankingType, classFilter])

  const loadClasses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setClasses(result.data || [])
      }
    } catch (error) {
      console.error('加载班级失败:', error)
    }
  }

  const loadOverview = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
      }
      if (classFilter) {
        params.append('classId', classFilter)
      }

      const response = await fetch(`/api/statistics/overview?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setOverview(result.data)
      } else {
        message.error('加载统计数据失败')
      }
    } catch (error) {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadRankings = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ type: rankingType })
      if (classFilter) {
        params.append('classId', classFilter)
      }

      const response = await fetch(`/api/statistics/rankings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setRankings(result.data.rankings || [])
      }
    } catch (error) {
      console.error('加载排名数据失败:', error)
    }
  }

  const handleBatchExport = async (format: 'pdf' | 'word') => {
    if (selectedStudents.length === 0) {
      message.warning('请先选择要导出的学生')
      return
    }

    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/statistics/batch-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          format,
          period: 'week',
          classId: classFilter,
        }),
      })

      const result = await response.json()
      if (result.success) {
        message.success(`成功导出 ${result.data.successCount} 个学生的报告！`)
        // 下载ZIP文件
        window.open(result.data.downloadUrl, '_blank')
        setSelectedStudents([])
      } else {
        message.error('批量导出失败')
      }
    } catch (error) {
      message.error('批量导出失败')
    } finally {
      setExporting(false)
    }
  }

  const wrongWordsColumns: ColumnsType<any> = [
    {
      title: '排名',
      dataIndex: 'count',
      key: 'rank',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 150,
    },
    {
      title: '释义',
      dataIndex: 'meaning',
      key: 'meaning',
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
        return <Tag color={colorMap[difficulty]}>{textMap[difficulty]}</Tag>
      },
    },
    {
      title: '错误次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: (a, b) => b.count - a.count,
      render: (count: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{count}</span>
      ),
    },
  ]

  const getRankingColumns = (): ColumnsType<RankingData> => {
    const baseColumns = [
      {
        title: '排名',
        dataIndex: 'rank',
        key: 'rank',
        width: 80,
        render: (rank: number) => {
          if (rank === 1) return <TrophyOutlined style={{ color: '#FFD700', fontSize: 20 }} />
          if (rank === 2) return <TrophyOutlined style={{ color: '#C0C0C0', fontSize: 18 }} />
          if (rank === 3) return <TrophyOutlined style={{ color: '#CD7F32', fontSize: 16 }} />
          return rank
        },
      },
      {
        title: '姓名',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 120,
      },
      {
        title: '学号',
        dataIndex: 'studentNo',
        key: 'studentNo',
        width: 120,
      },
      {
        title: '班级',
        dataIndex: 'className',
        key: 'className',
        width: 120,
      },
    ]

    const typeSpecificColumns: Record<string, any[]> = {
      mastery: [
        {
          title: '已掌握',
          dataIndex: 'masteredCount',
          key: 'masteredCount',
          width: 100,
          render: (count: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{count}</span>,
        },
        {
          title: '学习中',
          dataIndex: 'totalLearning',
          key: 'totalLearning',
          width: 100,
        },
        {
          title: '掌握率',
          dataIndex: 'masteryRate',
          key: 'masteryRate',
          width: 100,
          render: (rate: string) => `${rate}%`,
        },
      ],
      accuracy: [
        {
          title: '答题数',
          dataIndex: 'totalAnswered',
          key: 'totalAnswered',
          width: 100,
        },
        {
          title: '正确数',
          dataIndex: 'totalCorrect',
          key: 'totalCorrect',
          width: 100,
        },
        {
          title: '正确率',
          dataIndex: 'accuracy',
          key: 'accuracy',
          width: 100,
          render: (accuracy: string) => (
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{accuracy}%</span>
          ),
        },
      ],
      progress: [
        {
          title: '最近正确率',
          dataIndex: 'recentAccuracy',
          key: 'recentAccuracy',
          width: 120,
          render: (rate: string) => `${rate}%`,
        },
        {
          title: '之前正确率',
          dataIndex: 'previousAccuracy',
          key: 'previousAccuracy',
          width: 120,
          render: (rate: string) => `${rate}%`,
        },
        {
          title: '进步幅度',
          dataIndex: 'improvement',
          key: 'improvement',
          width: 120,
          render: (improvement: string) => {
            const value = parseFloat(improvement)
            const color = value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#666'
            const icon = value > 0 ? <RiseOutlined /> : value < 0 ? <FallOutlined /> : null
            return (
              <span style={{ color, fontWeight: 600 }}>
                {icon} {improvement}%
              </span>
            )
          },
        },
      ],
      streak: [
        {
          title: '连续天数',
          dataIndex: 'consecutiveDays',
          key: 'consecutiveDays',
          width: 120,
          render: (days: number) => (
            <span style={{ color: '#fa8c16', fontWeight: 600 }}>
              <FireOutlined /> {days}天
            </span>
          ),
        },
        {
          title: '总学习天数',
          dataIndex: 'totalDays',
          key: 'totalDays',
          width: 120,
        },
      ],
      studyTime: [
        {
          title: '学习时长',
          dataIndex: 'totalTimeMinutes',
          key: 'totalTimeMinutes',
          width: 120,
          render: (minutes: number) => (
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{minutes}分钟</span>
          ),
        },
        {
          title: '学习天数',
          dataIndex: 'studyDays',
          key: 'studyDays',
          width: 100,
          render: (days: number) => `${days}天`,
        },
        {
          title: '平均日学习',
          dataIndex: 'avgDailyMinutes',
          key: 'avgDailyMinutes',
          width: 120,
          render: (minutes: number) => `${minutes.toFixed(0)}分钟/天`,
        },
      ],
    }

    return [...baseColumns, ...typeSpecificColumns[rankingType]] as ColumnsType<RankingData>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>学习统计</h1>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="YYYY-MM-DD"
          />
          <Select
            placeholder="选择班级"
            allowClear
            style={{ width: 200 }}
            value={classFilter}
            onChange={setClassFilter}
          >
            {classes.map((cls) => (
              <Select.Option key={cls.id} value={cls.id}>
                {cls.name}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleBatchExport('pdf')}
            loading={exporting}
            disabled={selectedStudents.length === 0}
          >
            批量PDF ({selectedStudents.length})
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleBatchExport('word')}
            loading={exporting}
            disabled={selectedStudents.length === 0}
          >
            批量Word ({selectedStudents.length})
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="学生总数"
              value={overview?.overview.totalStudents || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃学生"
              value={overview?.overview.activeStudents || 0}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${overview?.overview.totalStudents || 0}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="学习总词汇"
              value={overview?.overview.totalWords || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="平均正确率"
              value={overview?.overview.avgAccuracy || 0}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="已掌握词汇"
              value={overview?.mastery.masteredWords || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="学习中词汇"
              value={overview?.mastery.learningWords || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="难点词汇"
              value={overview?.mastery.difficultWords || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="掌握率"
              value={overview?.mastery.masteryRate || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 词性分布图 */}
      {overview?.partOfSpeechDistribution && overview.partOfSpeechDistribution.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="错题词性分布" loading={loading}>
              <Pie
                data={overview.partOfSpeechDistribution.map(item => ({
                  type: item.pos,
                  value: item.count,
                }))}
                angleField="value"
                colorField="type"
                radius={0.8}
                label={{
                  type: 'outer',
                  content: '{name} {percentage}',
                }}
                interactions={[{ type: 'element-active' }]}
                legend={{
                  position: 'bottom',
                }}
                height={300}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 排行榜和错题 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="学生排名" loading={loading}>
            <Tabs
              activeKey={rankingType}
              onChange={setRankingType}
              items={[
                {
                  key: 'mastery',
                  label: '掌握排行',
                  children: (
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedStudents,
                        onChange: (keys) => setSelectedStudents(keys as string[]),
                      }}
                      columns={getRankingColumns()}
                      dataSource={rankings}
                      rowKey="studentId"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'accuracy',
                  label: '正确率排行',
                  children: (
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedStudents,
                        onChange: (keys) => setSelectedStudents(keys as string[]),
                      }}
                      columns={getRankingColumns()}
                      dataSource={rankings}
                      rowKey="studentId"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'progress',
                  label: '进步榜',
                  children: (
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedStudents,
                        onChange: (keys) => setSelectedStudents(keys as string[]),
                      }}
                      columns={getRankingColumns()}
                      dataSource={rankings}
                      rowKey="studentId"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'streak',
                  label: '连续学习',
                  children: (
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedStudents,
                        onChange: (keys) => setSelectedStudents(keys as string[]),
                      }}
                      columns={getRankingColumns()}
                      dataSource={rankings}
                      rowKey="studentId"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ),
                },
                {
                  key: 'studyTime',
                  label: '学习时长排行',
                  children: (
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedStudents,
                        onChange: (keys) => setSelectedStudents(keys as string[]),
                      }}
                      columns={getRankingColumns()}
                      dataSource={rankings}
                      rowKey="studentId"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="高频错词 Top 20" loading={loading}>
            <Table
              columns={wrongWordsColumns}
              dataSource={overview?.topWrongWords || []}
              rowKey="word"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
