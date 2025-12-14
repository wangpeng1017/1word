'use client'

import { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Space, Tag, Statistic, Row, Col, Progress } from 'antd'
import { SearchOutlined, ReloadOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface LevelData {
  id: string
  studentId: string
  studentName: string
  studentNo: string
  className: string
  level: number
  totalPoints: number
  dailyPoints: number
  weeklyPoints: number
  monthlyPoints: number
  updatedAt: string
}

interface LevelStat {
  level: number
  count: number
}

export default function StudentLevelsPage() {
  const [data, setData] = useState<LevelData[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('level')
  const [sortOrder, setSortOrder] = useState('desc')
  const [levelStats, setLevelStats] = useState<LevelStat[]>([])

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    loadData()
  }, [page, pageSize, search, classId, sortBy, sortOrder])

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
      console.error('加载班级失败')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      })
      if (search) params.append('search', search)
      if (classId) params.append('classId', classId)

      const response = await fetch(`/api/student-levels?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data?.list || [])
        setTotal(result.data?.total || 0)
        setLevelStats(result.data?.levelStats || [])
      }
    } catch (error) {
      console.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: number) => {
    if (level >= 10) return '#f5222d'
    if (level >= 7) return '#fa8c16'
    if (level >= 4) return '#52c41a'
    return '#1890ff'
  }

  const getLevelTitle = (level: number) => {
    if (level >= 10) return '大师'
    if (level >= 7) return '专家'
    if (level >= 4) return '进阶'
    return '新手'
  }

  const columns: ColumnsType<LevelData> = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_, __, index) => {
        const rank = (page - 1) * pageSize + index + 1
        if (rank <= 3) {
          const colors = ['#ffd700', '#c0c0c0', '#cd7f32']
          return (
            <Tag color={colors[rank - 1]} style={{ fontWeight: 'bold' }}>
              {rank}
            </Tag>
          )
        }
        return rank
      },
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '学号',
      dataIndex: 'studentNo',
      key: 'studentNo',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      sorter: true,
      render: (level: number) => (
        <Space>
          <Tag color={getLevelColor(level)} style={{ fontSize: 14, padding: '4px 12px' }}>
            <StarOutlined /> Lv.{level}
          </Tag>
          <span style={{ color: '#666', fontSize: 12 }}>{getLevelTitle(level)}</span>
        </Space>
      ),
    },
    {
      title: '总积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      sorter: true,
      render: (points: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{points}</span>
      ),
    },
    {
      title: '今日积分',
      dataIndex: 'dailyPoints',
      key: 'dailyPoints',
      sorter: true,
    },
    {
      title: '本周积分',
      dataIndex: 'weeklyPoints',
      key: 'weeklyPoints',
      sorter: true,
    },
    {
      title: '本月积分',
      dataIndex: 'monthlyPoints',
      key: 'monthlyPoints',
      sorter: true,
    },
    {
      title: '升级进度',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const currentLevelPoints = (record.level - 1) * 100
        const progress = ((record.totalPoints - currentLevelPoints) / 100) * 100
        return (
          <Progress
            percent={Math.min(progress, 100)}
            size="small"
            strokeColor={getLevelColor(record.level)}
            format={() => `${Math.max(100 - (record.totalPoints - currentLevelPoints), 0)}`}
          />
        )
      },
    },
  ]

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
    if (sorter.field) {
      setSortBy(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc')
    }
  }

  // 计算统计数据
  const totalStudents = levelStats.reduce((sum, s) => sum + s.count, 0)
  const avgLevel = totalStudents > 0
    ? (levelStats.reduce((sum, s) => sum + s.level * s.count, 0) / totalStudents).toFixed(1)
    : '0'
  const maxLevel = levelStats.length > 0 ? Math.max(...levelStats.map(s => s.level)) : 0

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={totalStudents}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均等级"
              value={avgLevel}
              prefix={<StarOutlined />}
              suffix="级"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最高等级"
              value={maxLevel}
              prefix={<StarOutlined style={{ color: '#f5222d' }} />}
              suffix="级"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>等级分布</div>
            <Space wrap>
              {levelStats.slice(0, 5).map(s => (
                <Tag key={s.level} color={getLevelColor(s.level)}>
                  Lv.{s.level}: {s.count}人
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索学生姓名或学号"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="选择班级"
            value={classId || undefined}
            onChange={(value) => {
              setClassId(value || '')
              setPage(1)
            }}
            style={{ width: 150 }}
            allowClear
          >
            {classes.map((cls: any) => (
              <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
            ))}
          </Select>
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            style={{ width: 120 }}
          >
            <Select.Option value="level">按等级</Select.Option>
            <Select.Option value="totalPoints">按总积分</Select.Option>
            <Select.Option value="dailyPoints">按今日积分</Select.Option>
            <Select.Option value="weeklyPoints">按本周积分</Select.Option>
          </Select>
          <Select
            value={sortOrder}
            onChange={(value) => setSortOrder(value)}
            style={{ width: 100 }}
          >
            <Select.Option value="desc">降序</Select.Option>
            <Select.Option value="asc">升序</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}
