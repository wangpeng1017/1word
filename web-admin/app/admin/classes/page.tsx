'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Space, message, Card, Modal, Form, Input } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'

export default function ClassesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

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

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      grade: record.grade,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // 确保能解析 JSON，不管状态码是什么
      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('JSON 解析错误:', jsonError)
        Modal.error({
          title: '删除失败',
          content: '服务器响应异常，请稍后重试',
          okText: '我知道了',
        })
        return
      }
      
      if (result.success) {
        message.success('删除成功')
        loadData()
      } else {
        // 使用 Modal 弹窗显示错误信息
        Modal.error({
          title: '无法删除班级',
          content: result.error || '删除失败',
          okText: '我知道了',
        })
      }
    } catch (error) {
      console.error('删除班级错误:', error)
      Modal.error({
        title: '删除失败',
        content: '网络请求失败，请稍后重试',
        okText: '我知道了',
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')
      
      const url = editingRecord 
        ? `/api/classes/${editingRecord.id}`
        : '/api/classes'
      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (result.success) {
        message.success(editingRecord ? '更新成功' : '创建成功')
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
        loadData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const columns = [
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'name', key: 'name' },
    {
      title: '学生数',
      dataIndex: '_count',
      key: 'studentCount',
      render: (count: any) => count?.students || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建班级
        </Button>
        {selectedRowKeys.length > 0 && (
          <Button danger onClick={async () => {
            const token = localStorage.getItem('token')
            try {
              await Promise.all(selectedRowKeys.map((id) => fetch(`/api/classes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })))
              message.success('批量删除成功')
              setSelectedRowKeys([])
              loadData()
            } catch {
              message.error('批量删除失败')
            }
          }}>
            批量删除 ({selectedRowKeys.length})
          </Button>
        )}
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} />
      <Modal
        title={editingRecord ? '编辑班级' : '创建班级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="年级" name="grade" rules={[{ required: true, message: '请输入年级' }]}>
            <Input placeholder="例如: 高一" />
          </Form.Item>
          <Form.Item label="班级" name="name" rules={[{ required: true, message: '请输入班级' }]}>
            <Input placeholder="例如: 高一(1)班" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
