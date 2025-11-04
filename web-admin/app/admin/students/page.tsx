'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Input, Space, message, Card, Modal, Form, Select, Upload } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { UploadProps } from 'antd'

export default function StudentsPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const handleImport = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const result = await response.json()
      if (result.success) {
        message.success(`成功导入${result.data?.count || 0}个学生`)
        setImportModalVisible(false)
        loadData()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch (error) {
      message.error('导入失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/students-template.xlsx'
    link.download = '学生导入模板.xlsx'
    link.click()
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => router.push(`/admin/students/${record.id}`)}>{text}</a>
      ),
    },
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
        <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
          批量导入
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
      <Modal
        title="批量导入学生"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
            下载导入模板
          </Button>
          <Upload.Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽Excel文件到此区域</p>
            <p className="ant-upload-hint">
              支持 .xlsx 和 .xls 格式，请使用模板格式
            </p>
          </Upload.Dragger>
        </Space>
      </Modal>
    </Card>
  )
}
