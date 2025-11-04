'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Space, message, Card, Modal, Form, Input } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'

export default function ClassesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data || [])
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (result.success) {
        message.success('创建成功')
        setModalVisible(false)
        form.resetFields()
        loadData()
      } else {
        message.error(result.error || '创建失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const columns = [
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    {
      title: '学生数',
      dataIndex: 'students',
      key: 'students',
      render: (students: any[]) => students?.length || 0,
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建班级
        </Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal
        title="创建班级"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="班级名称" name="name" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="例如: 高一(1)班" />
          </Form.Item>
          <Form.Item label="年级" name="grade" rules={[{ required: true, message: '请输入年级' }]}>
            <Input placeholder="例如: 高一" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
