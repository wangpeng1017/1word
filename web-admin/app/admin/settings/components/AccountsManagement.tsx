'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Tag, App, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface Account {
    id: string
    name: string
    email?: string
    phone?: string
    role: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export default function AccountsManagement() {
    const { message, modal } = App.useApp()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadAccounts()
    }, [])

    const loadAccounts = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/accounts', {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (result.success) {
                setAccounts(result.data)
            } else {
                message.error(result.error || '加载账号列表失败')
            }
        } catch (error) {
            message.error('加载账号列表失败')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setEditingAccount(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: Account) => {
        setEditingAccount(record)
        form.setFieldsValue({
            name: record.name,
            email: record.email,
            phone: record.phone,
            is_active: record.is_active,
        })
        setModalVisible(true)
    }

    const handleDelete = async (record: Account) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/accounts/${record.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (result.success) {
                message.success('账号删除成功')
                loadAccounts()
            } else {
                message.error(result.error || '删除失败')
            }
        } catch (error) {
            message.error('删除失败')
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setSubmitting(true)

            const token = localStorage.getItem('token')
            const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts'
            const method = editingAccount ? 'PUT' : 'POST'

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
                message.success(editingAccount ? '账号更新成功' : '账号创建成功')
                setModalVisible(false)
                form.resetFields()
                loadAccounts()
            } else {
                message.error(result.error || '操作失败')
            }
        } catch (error: any) {
            if (error.errorFields) {
                return
            }
            message.error('操作失败')
        } finally {
            setSubmitting(false)
        }
    }

    const columns: ColumnsType<Account> = [
        {
            title: '用户名',
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            render: (text) => text || '-',
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text) => text || '-',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 120,
            render: (role) => {
                const roleMap: Record<string, { text: string; color: string }> = {
                    TEACHER: { text: '主管理员', color: 'red' },
                    ADMIN: { text: '管理员', color: 'blue' },
                }
                const config = roleMap[role] || { text: role, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (text) => new Date(text).toLocaleString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    {record.role === 'ADMIN' && (
                        <Popconfirm
                            title="确认删除"
                            description="确定要删除该账号吗？此操作不可恢复。"
                            onConfirm={() => handleDelete(record)}
                            okText="确认"
                            cancelText="取消"
                        >
                            <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                删除
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                        <UserAddOutlined style={{ marginRight: 8 }} />
                        账号管理
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                        管理系统管理员账号，支持新增、编辑和删除操作
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    新增账号
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={accounts}
                rowKey="id"
                loading={loading}
                pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ x: 1200 }}
            />

            <Modal
                title={
                    <Space>
                        {editingAccount ? <EditOutlined /> : <PlusOutlined />}
                        <span>{editingAccount ? '编辑账号' : '新增账号'}</span>
                    </Space>
                }
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => {
                    setModalVisible(false)
                    form.resetFields()
                }}
                confirmLoading={submitting}
                okText="确定"
                cancelText="取消"
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        label="用户名"
                        name="name"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input placeholder="请输入用户名" />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <Input placeholder="请输入邮箱（选填）" />
                    </Form.Item>

                    <Form.Item
                        label="手机号"
                        name="phone"
                        rules={[
                            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                        ]}
                    >
                        <Input placeholder="请输入手机号（选填）" />
                    </Form.Item>

                    {!editingAccount && (
                        <Form.Item
                            label="密码"
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码' },
                                { min: 6, message: '密码长度不能少于6位' },
                            ]}
                        >
                            <Input.Password placeholder="请输入密码（至少6位）" />
                        </Form.Item>
                    )}

                    {editingAccount && (
                        <>
                            <Form.Item
                                label="新密码"
                                name="password"
                                rules={[
                                    { min: 6, message: '密码长度不能少于6位' },
                                ]}
                            >
                                <Input.Password placeholder="留空则不修改密码" />
                            </Form.Item>

                            <Form.Item
                                label="账号状态"
                                name="is_active"
                                rules={[{ required: true, message: '请选择账号状态' }]}
                            >
                                <Select>
                                    <Select.Option value={true}>启用</Select.Option>
                                    <Select.Option value={false}>禁用</Select.Option>
                                </Select>
                            </Form.Item>
                        </>
                    )}

                    <div style={{
                        background: '#f0f5ff',
                        padding: 12,
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#666',
                        lineHeight: 1.6,
                    }}>
                        <p style={{ margin: 0 }}><strong>提示：</strong></p>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                            <li>邮箱或手机号至少填写一项</li>
                            <li>新增账号默认角色为「管理员」</li>
                            <li>主管理员账号不可删除</li>
                        </ul>
                    </div>
                </Form>
            </Modal>
        </>
    )
}
