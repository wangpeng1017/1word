'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, message } from 'antd'
import {
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    vocabularies: 0,
    students: 0,
    classes: 0,
    todayStudy: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // 并行请求所有统计数据
      const [vocabRes, studentsRes, classesRes] = await Promise.all([
        fetch('/api/vocabularies', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/students', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const vocabData = await vocabRes.json()
      const studentsData = await studentsRes.json()
      const classesData = await classesRes.json()

      setStats({
        vocabularies: vocabData.data?.length || 0,
        students: studentsData.data?.students?.length || 0,
        classes: classesData.data?.length || 0,
        todayStudy: 0, // TODO: 实际API
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>控制台</h1>
        <p style={{ color: '#6B7280' }}>欢迎使用智能词汇复习助手管理后台</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="词汇总数"
              value={stats.vocabularies}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="学生总数"
              value={stats.students}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="班级数量"
              value={stats.classes}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日学习"
              value={stats.todayStudy}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快速操作" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              onClick={() => router.push('/admin/vocabularies')}
            >
              添加词汇
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              icon={<PlusOutlined />}
              block
              onClick={() => router.push('/admin/students')}
            >
              添加学生
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              icon={<PlusOutlined />}
              block
              onClick={() => router.push('/admin/classes')}
            >
              创建班级
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              block
              onClick={() => router.push('/admin/statistics')}
            >
              查看学习数据
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="系统状态">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div>
              <div style={{ color: '#6B7280', marginBottom: 8 }}>数据库状态</div>
              <div style={{ color: '#10B981', fontWeight: 500 }}>● 正常</div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <div style={{ color: '#6B7280', marginBottom: 8 }}>API服务</div>
              <div style={{ color: '#10B981', fontWeight: 500 }}>● 运行中</div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <div style={{ color: '#6B7280', marginBottom: 8 }}>当前版本</div>
              <div style={{ fontWeight: 500 }}>v0.2.0</div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
