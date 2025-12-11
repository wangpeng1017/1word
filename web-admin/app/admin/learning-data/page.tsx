'use client'

import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

interface LearningRecord {
    id: string
    studentId: string
    studentName: string
    className: string
    taskDate: string
    totalWords: number
    completedWords: number
    completionRate: number
    correctCount: number
    wrongCount: number
    accuracy: number
    totalTime: number
    startedAt: string
    completedAt: string | null
    isCompleted: boolean
}

// 格式化时长（秒 -> 分秒）
function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}秒`
    return `${mins}分${secs}秒`
}

export default function LearningDataPage() {
    const [data, setData] = useState<LearningRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    useEffect(() => {
        fetchData()
    }, [pagination.current, pagination.pageSize])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: String(pagination.current),
                limit: String(pagination.pageSize),
            })

            const response = await fetch(`/api/learning-data?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (result.success) {
                setData(result.data.records || [])
                setPagination(prev => ({
                    ...prev,
                    total: result.data.pagination.total,
                }))
            } else {
                message.error(result.error || '获取数据失败')
            }
        } catch (error) {
            message.error('获取数据失败')
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnsType<LearningRecord> = [
        {
            title: '班级',
            dataIndex: 'className',
            key: 'className',
            width: 120,
            render: (text) => text || '-',
        },
        {
            title: '学生姓名',
            dataIndex: 'studentName',
            key: 'studentName',
            width: 100,
        },
        {
            title: '任务日期',
            dataIndex: 'taskDate',
            key: 'taskDate',
            width: 110,
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
        },
        {
            title: '完成率',
            key: 'completionRate',
            width: 120,
            render: (_, record) => {
                const rate = record.completionRate
                const color = rate >= 100 ? 'green' : rate >= 50 ? 'orange' : 'red'
                return (
                    <Space>
                        <Tag color={color}>{rate}%</Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                            {record.completedWords}/{record.totalWords}
                        </span>
                    </Space>
                )
            },
        },
        {
            title: '正确率',
            dataIndex: 'accuracy',
            key: 'accuracy',
            width: 80,
            render: (accuracy: number) => {
                const color = accuracy >= 80 ? 'green' : accuracy >= 60 ? 'orange' : 'red'
                return <Tag color={color}>{accuracy}%</Tag>
            },
        },
        {
            title: '答题时长',
            dataIndex: 'totalTime',
            key: 'totalTime',
            width: 100,
            render: (seconds: number) => formatDuration(seconds),
        },
        {
            title: '开始时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 160,
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: '结束时间',
            dataIndex: 'completedAt',
            key: 'completedAt',
            width: 160,
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: '状态',
            dataIndex: 'isCompleted',
            key: 'isCompleted',
            width: 80,
            render: (isCompleted: boolean) => (
                <Tag color={isCompleted ? 'green' : 'processing'}>
                    {isCompleted ? '已完成' : '进行中'}
                </Tag>
            ),
        },
    ]

    return (
        <Card>
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <span style={{ color: '#666', fontSize: 12 }}>
                        最新完成的任务排在最上面
                    </span>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1100 }}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page, pageSize) => {
                        setPagination({ ...pagination, current: page, pageSize })
                    },
                }}
            />
        </Card>
    )
}
