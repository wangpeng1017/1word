'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Steps, Alert, Spin } from 'antd'
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      
      if (data.success) {
        setInitialized(data.data.initialized)
        if (data.data.initialized) {
          // 已初始化，3秒后跳转到登录页
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }
      }
    } catch (err) {
      setError('检查初始化状态失败')
    } finally {
      setChecking(false)
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        setInitialized(true)
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || '初始化失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="w-full max-w-2xl">
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">检查系统状态...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="w-full max-w-2xl">
          <div className="text-center py-8">
            <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              系统已初始化
            </h2>
            <p className="text-gray-600 mb-4">
              正在跳转到登录页面...
            </p>
            <Alert
              message="默认管理员账号"
              description={
                <div className="text-left">
                  <p>邮箱: admin@vocab.com</p>
                  <p>密码: admin123456</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            智能词汇复习助手
          </h1>
          <p className="text-gray-600">系统初始化设置</p>
        </div>

        <Steps
          current={success ? 2 : 0}
          items={[
            {
              title: '开始设置',
              description: '初始化数据库',
            },
            {
              title: '创建管理员',
              description: '设置默认账号',
            },
            {
              title: '完成',
              description: '开始使用',
            },
          ]}
          className="mb-8"
        />

        {error && (
          <Alert
            message="初始化失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            className="mb-4"
          />
        )}

        {success ? (
          <Alert
            message="初始化成功！"
            description={
              <div>
                <p className="mb-2">默认管理员账号已创建：</p>
                <p>邮箱: admin@vocab.com</p>
                <p>密码: admin123456</p>
                <p className="mt-2 text-sm text-gray-500">
                  3秒后自动跳转到登录页面...
                </p>
              </div>
            }
            type="success"
            showIcon
          />
        ) : (
          <div className="space-y-4">
            <Alert
              message="首次使用提示"
              description="点击下方按钮初始化数据库并创建默认管理员账号"
              type="info"
              showIcon
            />
            
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleSetup}
              icon={loading ? <LoadingOutlined /> : undefined}
            >
              {loading ? '初始化中...' : '开始初始化'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
