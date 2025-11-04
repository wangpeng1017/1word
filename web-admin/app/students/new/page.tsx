'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, message, Space, Alert } from 'antd'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  grade: string
}

export default function CreateStudentPage() {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string>('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const router = useRouter()
  const [form] = Form.useForm()

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
    setServerError('')
    try {
      // 构造干净的负载，避免空字符串/空格
      const payload = {
        name: (values.name || '').trim(),
        studentNo: (values.studentNo || '').trim(),
        password: values.password,
        phone: values.phone ? String(values.phone).trim() : undefined,
        email: values.email ? String(values.email).trim() : undefined,
        grade: values.grade ? String(values.grade).trim() : undefined,
        classId: values.classId || undefined,
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({ success: false, error: '服务器返回格式异常' }))
      if (res.ok && data.success) {
        message.success('学生创建成功')
        setTimeout(() => router.push('/dashboard'), 800)
      } else {
        const errMsg = data?.error || `创建失败（${res.status}）`
        setServerError(errMsg)
        message.error(errMsg)
        // 将常见后端错误映射到表单字段
        if (/学号已存在/.test(errMsg)) {
          form.setFields([{ name: 'studentNo', errors: ['学号已存在'] }])
        }
        if (/邮箱|手机号/.test(errMsg)) {
          const field = /邮箱/.test(errMsg) ? 'email' : 'phone'
          form.setFields([{ name: field as any, errors: [errMsg] }])
        }
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
        {serverError && (
          <Alert type="error" showIcon className="mb-4" message={serverError} onClose={() => setServerError('')} closable />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
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
            <Button type="primary" htmlType="submit" loading={loading} block disabled={loading}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
