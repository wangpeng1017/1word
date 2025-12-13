'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, message, Popconfirm, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

interface VocabularyPack {
  id: string
  name: string
  description: string | null
  totalDays: number
  totalWords: number
  isActive: boolean
  createdAt: string
  pack_days: { id: string; dayNumber: number; title: string; wordCount: number }[]
  _count: { plan_classes: number }
}

export default function VocabularyPacksPage() {
  const router = useRouter()
  const [data, setData] = useState<VocabularyPack[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VocabularyPack | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabulary-packs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setData(result.data.packs || [])
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabulary-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values)
      })
      const result = await res.json()
      if (result.success) {
        message.success('创建成功')
        setModalVisible(false)
        form.resetFields()
        fetchData()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleUpdate = async (values: any) => {
    if (!editingRecord) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabulary-packs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingRecord.id, ...values })
      })
      const result = await res.json()
      if (result.success) {
        message.success('更新成功')
        setModalVisible(false)
        setEditingRecord(null)
        form.resetFields()
        fetchData()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vocabulary-packs?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleActive = async (record: VocabularyPack) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabulary-packs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: record.id, isActive: !record.isActive })
      })
      const result = await res.json()
      if (result.success) {
        message.success(record.isActive ? '已禁用' : '已启用')
        fetchData()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<VocabularyPack> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '天数', dataIndex: 'totalDays', key: 'totalDays', width: 80 },
    { title: '总词数', dataIndex: 'totalWords', key: 'totalWords', width: 100 },
    {
      title: '状态', dataIndex: 'isActive', key: 'isActive', width: 80,
      render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? '启用' : '禁用'}</Tag>
    },
    {
      title: '已使用', key: 'usage', width: 80,
      render: (_, record) => record._count.plan_classes > 0 ? `${record._count.plan_classes}次` : '-'
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SettingOutlined />}
            onClick={() => router.push(`/admin/vocabulary-packs/${record.id}`)}>
            配置
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditingRecord(record); form.setFieldsValue(record); setModalVisible(true) }}>
            编辑
          </Button>
          <Switch size="small" checked={record.isActive} onChange={() => handleToggleActive(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2>词汇库管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} style={{ color: '#fff' }}
            onClick={() => { setEditingRecord(null); form.resetFields(); setModalVisible(true) }}>
            新建词汇库
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1000 }} pagination={{ pageSize: 20 }} />

      <Modal
        title={editingRecord ? '编辑词汇库' : '新建词汇库'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => { setModalVisible(false); setEditingRecord(null); form.resetFields() }}
      >
        <Form form={form} layout="vertical" onFinish={editingRecord ? handleUpdate : handleCreate}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：高考核心词汇10天班" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="词汇库描述" rows={2} />
          </Form.Item>
          {!editingRecord && (
            <Form.Item label="天数" name="totalDays" rules={[{ required: true, message: '请输入天数' }]}>
              <InputNumber min={1} max={100} placeholder="如：10" style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
