'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, message, Space } from 'antd'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  grade: string
}

export default function CreateStudentPage() {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const router = useRouter()

  useEffect(() => {
    // 拉取班级下拉（可选）
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('/api/classes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setClasses(data.data || [])
      })
      .catch(() => {})
  }, [])

  const onFinish = async (values: any) => {
    const token = localStorage.getItem('token')
    if (!token) {
      message.error('登录已过期，请重新登录')
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.success) {
        message.success('学生创建成功')
        router.push('/dashboard')
      } else {
        message.error(data.error || '创建失败')
      }
    } catch (e) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">添加学生</h2>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="学生姓名" />
          </Form.Item>

          <Form.Item label="学号" name="studentNo" rules={[{ required: true, message: '请输入学号' }]}>
            <Input placeholder="如：2024001" />
          </Form.Item>

          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入初始密码' }]}>
            <Input.Password placeholder="初始密码（学生可后续修改）" />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item label="手机号" name="phone" style={{ flex: 1 }}>
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" style={{ flex: 1 }}>
              <Input placeholder="可选" />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item label="年级" name="grade" style={{ flex: 1 }}>
              <Input placeholder="如：初一/高一（可选）" />
            </Form.Item>
            <Form.Item label="班级" name="classId" style={{ flex: 1 }}>
              <Select allowClear placeholder="可选">
                {classes.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}（{c.grade}）
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
