'use client'

import { useEffect, useState } from 'react'
import { Table, Select, DatePicker, Button, Space, Tag, Modal, App, Card } from 'antd'
import { FileTextOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface OperationLog {
    id: string
    userId: string
    userName: string
    action: string
    actionName: string
    module: string
    moduleName: string
    target?: string
    targetId?: string
    detail?: any
    ip?: string
    userAgent?: string
    createdAt: string
}

interface LogsData {
    list: OperationLog[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export default function OperationLogs() {
    const { message } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [logsData, setLogsData] = useState<LogsData>({
        list: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    })
    const [filters, setFilters] = useState({
        userId: undefined as string | undefined,
        action: undefined as string | undefined,
        module: undefined as string | undefined,
        dateRange: undefined as [Dayjs, Dayjs] | undefined,
    })
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null)

    useEffect(() => {
        loadLogs(1, logsData.pageSize)
    }, [])

    const loadLogs = async (page: number, pageSize: number) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            if (filters.userId) params.append('userId', filters.userId)
            if (filters.action) params.append('action', filters.action)
            if (filters.module) params.append('module', filters.module)
            if (filters.dateRange) {
                params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
                params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
            }

            const response = await fetch(`/api/logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (result.success) {
                setLogsData(result.data)
            } else {
                message.error(result.error || '加载操作日志失败')
            }
        } catch (error) {
            message.error('加载操作日志失败')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        loadLogs(1, logsData.pageSize)
    }

    const handleReset = () => {
        setFilters({
            userId: undefined,
            action: undefined,
            module: undefined,
            dateRange: undefined,
        })
        setTimeout(() => {
            loadLogs(1, logsData.pageSize)
        }, 0)
    }

    const handleViewDetail = (record: OperationLog) => {
        setSelectedLog(record)
        setDetailModalVisible(true)
    }

    const columns: ColumnsType<OperationLog> = [
        {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (text) => new Date(text).toLocaleString('zh-CN'),
        },
        {
            title: '操作人',
            dataIndex: 'userName',
            key: 'userName',
            width: 120,
        },
        {
            title: '操作类型',
            dataIndex: 'actionName',
            key: 'actionName',
            width: 100,
            render: (text, record) => {
                const colorMap: Record<string, string> = {
                    CREATE: 'success',
                    UPDATE: 'processing',
                    DELETE: 'error',
                    LOGIN: 'default',
                    LOGOUT: 'default',
                }
                return <Tag color={colorMap[record.action] || 'default'}>{text}</Tag>
            },
        },
        {
            title: '模块',
            dataIndex: 'moduleName',
            key: 'moduleName',
            width: 120,
        },
        {
            title: '操作对象',
            dataIndex: 'target',
            key: 'target',
            ellipsis: true,
            render: (text) => text || '-',
        },
        {
            title: 'IP 地址',
            dataIndex: 'ip',
            key: 'ip',
            width: 150,
            render: (text) => text || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                >
                    详情
                </Button>
            ),
        },
    ]

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    操作日志
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                    记录系统内所有账号的操作历史，支持按条件筛选查询
                </p>
            </div>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        placeholder="操作类型"
                        style={{ width: 120 }}
                        allowClear
                        value={filters.action}
                        onChange={(value) => setFilters({ ...filters, action: value })}
                    >
                        <Select.Option value="CREATE">新增</Select.Option>
                        <Select.Option value="UPDATE">修改</Select.Option>
                        <Select.Option value="DELETE">删除</Select.Option>
                        <Select.Option value="LOGIN">登录</Select.Option>
                        <Select.Option value="LOGOUT">退出登录</Select.Option>
                    </Select>

                    <Select
                        placeholder="模块"
                        style={{ width: 120 }}
                        allowClear
                        value={filters.module}
                        onChange={(value) => setFilters({ ...filters, module: value })}
                    >
                        <Select.Option value="accounts">账号管理</Select.Option>
                        <Select.Option value="students">学生管理</Select.Option>
                        <Select.Option value="classes">班级管理</Select.Option>
                        <Select.Option value="vocabularies">词汇管理</Select.Option>
                        <Select.Option value="questions">题目管理</Select.Option>
                        <Select.Option value="settings">系统设置</Select.Option>
                        <Select.Option value="auth">认证</Select.Option>
                    </Select>

                    <RangePicker
                        placeholder={['开始日期', '结束日期']}
                        value={filters.dateRange}
                        onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] | undefined })}
                    />

                    <Button type="primary" onClick={handleSearch}>
                        查询
                    </Button>

                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                        重置
                    </Button>
                </Space>
            </Card>

            <Table
                columns={columns}
                dataSource={logsData.list}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: logsData.page,
                    pageSize: logsData.pageSize,
                    total: logsData.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page, pageSize) => loadLogs(page, pageSize),
                }}
                scroll={{ x: 1200 }}
            />

            <Modal
                title="操作详情"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={700}
            >
                {selectedLog && (
                    <div style={{ lineHeight: 2 }}>
                        <p><strong>操作时间：</strong>{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</p>
                        <p><strong>操作人：</strong>{selectedLog.userName}</p>
                        <p><strong>操作类型：</strong>{selectedLog.actionName}</p>
                        <p><strong>模块：</strong>{selectedLog.moduleName}</p>
                        <p><strong>操作对象：</strong>{selectedLog.target || '-'}</p>
                        <p><strong>IP 地址：</strong>{selectedLog.ip || '-'}</p>
                        <p><strong>浏览器信息：</strong></p>
                        <div style={{
                            background: '#f5f5f5',
                            padding: 8,
                            borderRadius: 4,
                            fontSize: 12,
                            wordBreak: 'break-all',
                        }}>
                            {selectedLog.userAgent || '-'}
                        </div>
                        {selectedLog.detail && (
                            <>
                                <p style={{ marginTop: 16 }}><strong>操作详情：</strong></p>
                                <pre style={{
                                    background: '#f5f5f5',
                                    padding: 12,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    maxHeight: 300,
                                    overflow: 'auto',
                                }}>
                                    {JSON.stringify(selectedLog.detail, null, 2)}
                                </pre>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </>
    )
}
