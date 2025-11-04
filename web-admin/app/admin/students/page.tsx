'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Input, Space, message, Card, Modal, Form, Select } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'

export default function StudentsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadClasses()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data?.students || [])
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (result.success) {
        message.success('添加成功')
        setModalVisible(false)
        loadData()
      } else {
        message.error(result.error || '添加失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      render: (cls: any) => cls?.name || '未分配',
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加学生
        </Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal
        title="添加学生"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="学号" name="studentNo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="年级" name="grade">
            <Input placeholder="例如: 高一" />
          </Form.Item>
          <Form.Item label="班级" name="classId">
            <Select placeholder="选择班级" allowClear>
              {classes.map((cls: any) => (
                <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="密码" name="password" initialValue="123456">
            <Input.Password placeholder="默认: 123456" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
