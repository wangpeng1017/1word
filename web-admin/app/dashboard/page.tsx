'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Space, Table } from 'antd'
import {
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('userInfo')

    if (!token || !user) {
      router.push('/login')
      return
    }

    setUserInfo(JSON.parse(user))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              智能词汇复习助手 - 管理后台
            </h1>
            <Space>
              <span className="text-gray-600">
                欢迎，{userInfo?.name || '教师'}
              </span>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="词汇总数"
                value={0}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="学生总数"
                value={0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="班级数量"
                value={0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日学习"
                value={0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 功能入口 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="快速操作" className="h-full">
              <Space direction="vertical" size="middle" className="w-full">
                <Button type="primary" block size="large">
                  添加词汇
                </Button>
                <Button block size="large">
                  添加学生
                </Button>
                <Button block size="large">
                  创建班级
                </Button>
                <Button block size="large">
                  查看学习数据
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="系统状态" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded">
                  <span className="text-gray-700">数据库状态</span>
                  <span className="text-green-600 font-semibold">正常</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded">
                  <span className="text-gray-700">API服务</span>
                  <span className="text-blue-600 font-semibold">运行中</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded">
                  <span className="text-gray-700">当前版本</span>
                  <span className="text-purple-600 font-semibold">v0.1.0 MVP</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 提示信息 */}
        <Card className="mt-8" title="🎉 欢迎使用">
          <div className="space-y-2 text-gray-600">
            <p>✅ 后端API已部署成功</p>
            <p>✅ 数据库连接正常</p>
            <p>🚧 前端管理界面开发中...</p>
            <p>📱 微信小程序已完成登录和首页</p>
            <p className="mt-4 text-sm">
              <strong>下一步：</strong>
              <br />
              1. 运行数据库初始化脚本创建测试数据
              <br />
              2. 在微信开发者工具中测试小程序
              <br />
              3. 继续开发词库管理、学生管理等功能
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
