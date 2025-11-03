'use client'

import { useState } from 'react'
import { Button, Form, Input, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        message.success('登录成功！')
        // 保存token
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.data.user))
        // 跳转到后台
        router.push('/dashboard')
      } else {
        message.error(data.error || '登录失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            教师管理后台
          </h1>
          <p className="text-gray-600">智能词汇复习助手</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱或手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱或手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>测试账号：admin@vocab.com</p>
          <p>密码：admin123456</p>
        </div>
      </Card>
    </div>
  )
}
