'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Input, Space, message, Card, Modal, Form, Select, Upload, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { UploadProps } from 'antd'

export default function StudentsPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    loadData(1, 20)
    loadClasses()
  }, [])

  const loadData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/students?page=${page}&limit=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data?.students || [])
        const p = result.data?.pagination
        setPagination({ current: p?.page || 1, pageSize: p?.limit || 20, total: p?.total || 0 })
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

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.user?.name,
      studentNo: record.studentNo,
      phone: record.user?.phone,
      classId: record.class?.id,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        message.success(result.message || '删除成功')
        loadData(pagination.current, pagination.pageSize)
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleResetPassword = async (record: any) => {
    if (!record.user?.phone) {
      message.error('该学生没有设置手机号，无法重置密码')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/students/${record.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        message.success(result.message || '密码已重置')
      } else {
        message.error(result.error || '重置失败')
      }
    } catch (error) {
      message.error('重置密码失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的学生')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const results = await Promise.all(
        selectedRowKeys.map(async (id) => {
          const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          return response.json()
        })
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        message.success(`成功删除/停用 ${successCount} 个学生${failCount > 0 ? `，${failCount} 个失败` : ''}`)
      } else {
        message.error('批量删除失败')
      }

      setSelectedRowKeys([])
      loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('批量删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const token = localStorage.getItem('token')

      const url = editingRecord
        ? `/api/students/${editingRecord.id}`
        : '/api/students'
      const method = editingRecord ? 'PUT' : 'POST'

      // 如果是新增，添加默认密码
      if (!editingRecord) {
        values.password = values.password || '123456'
      }

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
        message.success(editingRecord ? '更新成功' : '添加成功')
        setModalVisible(false)
        setEditingRecord(null)
        loadData(pagination.current, pagination.pageSize)
      } else {
        message.error(result.error || '操作失败')
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
        loadData(pagination.current, pagination.pageSize)
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
      dataIndex: ['user', 'name'],
      key: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => router.push(`/admin/students/${record.id}`)}>
          {record.user?.name || '未命名'}
        </a>
      ),
    },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    {
      title: '电话号码',
      dataIndex: ['user', 'phone'],
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '班级',
      dataIndex: ['class', 'name'],
      key: 'class',
      render: (text: string, record: any) => record.class?.name || '未分配',
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
          <Popconfirm
            title="重置密码"
            description={`确定要将 ${record.user?.name || '该学生'} 的密码重置为手机号吗？`}
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleResetPassword(record)}
          >
            <Button
              type="link"
              icon={<KeyOutlined />}
              disabled={!record.user?.phone}
            >
              重置密码
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加学生
        </Button>
        <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
          批量导入
        </Button>
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title="确认批量删除"
            description={`确定要删除选中的 ${selectedRowKeys.length} 个学生吗？有学习记录的学生将被停用而非删除。`}
            okText="确认删除"
            okType="danger"
            cancelText="取消"
            onConfirm={handleBatchDelete}
          >
            <Button danger>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['20', '50', '100'],
          onChange: (page, pageSize) => loadData(page, pageSize),
        }}
      />
      <Modal
        title={editingRecord ? '编辑学生' : '添加学生'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="学号" name="studentNo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="电话号码"
            name="phone"
            rules={[
              {
                pattern: /^1\d{10}$/,
                message: '请输入11位手机号码'
              }
            ]}
          >
            <Input placeholder="11位手机号码" maxLength={11} />
          </Form.Item>
          <Form.Item label="班级" name="classId">
            <Select placeholder="选择班级" allowClear>
              {classes.map((cls: any) => (
                <Select.Option key={cls.id} value={cls.id}>{cls.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {!editingRecord && (
            <Form.Item label="密码" name="password" initialValue="123456">
              <Input.Password placeholder="默认: 123456" />
            </Form.Item>
          )}
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
