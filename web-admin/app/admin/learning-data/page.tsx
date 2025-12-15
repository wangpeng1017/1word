'use client'

import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, message, Select, DatePicker } from 'antd'
import { ReloadOutlined, FilterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface LearningRecord {
    id: string
    studentId: string
    studentName: string
    className: string
    taskDate: string
    totalWords: number
    completedWords: number
    interruptedWords: number
    completionRate: number
    startedAt: string | null
    completedAt: string | null
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED'
}

// 状态配置
const STATUS_CONFIG = {
    PENDING: { label: '待开始', color: 'default' },
    IN_PROGRESS: { label: '进行中', color: 'processing' },
    COMPLETED: { label: '已完成', color: 'success' },
    INTERRUPTED: { label: '已中断', color: 'error' },
}

export default function LearningDataPage() {
    const [data, setData] = useState<LearningRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })
    const [filters, setFilters] = useState({
        status: undefined as string | undefined,
        dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
        classId: undefined as string | undefined,
        studentId: undefined as string | undefined,
    })
    const [classes, setClasses] = useState<{ id: string; name: string; grade: string }[]>([])
    const [students, setStudents] = useState<{ id: string; name: string; classId: string }[]>([])
    const [allStudents, setAllStudents] = useState<{ id: string; name: string; classId: string }[]>([])

    useEffect(() => {
        fetchData()
    }, [pagination.current, pagination.pageSize, filters])

    useEffect(() => {
        fetchClasses()
        fetchStudents()
    }, [])

    // 班级变化时过滤学生列表
    useEffect(() => {
        if (filters.classId) {
            setStudents(allStudents.filter(s => s.classId === filters.classId))
        } else {
            setStudents(allStudents)
        }
    }, [filters.classId, allStudents])

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/classes?limit=1000', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const result = await res.json()
            if (result.success) {
                setClasses(result.data || [])
            }
        } catch { }
    }

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/students?limit=1000', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const result = await res.json()
            if (result.success) {
                const list = (result.data?.students || []).map((s: any) => ({
                    id: s.id,
                    name: s.user?.name || '未知',
                    classId: s.class_id
                }))
                setAllStudents(list)
                setStudents(list)
            }
        } catch { }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: String(pagination.current),
                limit: String(pagination.pageSize),
            })

            if (filters.status) {
                params.append('status', filters.status)
            }
            if (filters.dateRange) {
                params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
                params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
            }
            if (filters.classId) {
                params.append('classId', filters.classId)
            }
            if (filters.studentId) {
                params.append('studentId', filters.studentId)
            }

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
            width: 140,
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
            title: '中断词数',
            dataIndex: 'interruptedWords',
            key: 'interruptedWords',
            width: 90,
            render: (count: number) => count > 0 ? (
                <Tag color="error">{count}</Tag>
            ) : '-',
        },
        {
            title: '开始时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 160,
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: '结束时间',
            dataIndex: 'completedAt',
            key: 'completedAt',
            width: 160,
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            fixed: 'right',
            render: (status: keyof typeof STATUS_CONFIG) => {
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
                return <Tag color={config.color}>{config.label}</Tag>
            },
        },
    ]

    return (
        <Card>
            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Select
                        placeholder="选择班级"
                        style={{ width: 140 }}
                        allowClear
                        value={filters.classId}
                        onChange={(value) => {
                            setFilters(prev => ({ ...prev, classId: value, studentId: undefined }))
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                        options={classes.map(c => ({ label: `${c.name} (${c.grade})`, value: c.id }))}
                    />
                    <Select
                        placeholder="选择学生"
                        style={{ width: 140 }}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        value={filters.studentId}
                        onChange={(value) => {
                            setFilters(prev => ({ ...prev, studentId: value }))
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                        options={students.map(s => ({ label: s.name, value: s.id }))}
                    />
                    <Select
                        placeholder="状态筛选"
                        style={{ width: 120 }}
                        allowClear
                        value={filters.status}
                        onChange={(value) => {
                            setFilters(prev => ({ ...prev, status: value }))
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                        options={[
                            { label: '待开始', value: 'PENDING' },
                            { label: '进行中', value: 'IN_PROGRESS' },
                            { label: '已完成', value: 'COMPLETED' },
                            { label: '已中断', value: 'INTERRUPTED' },
                        ]}
                    />
                    <RangePicker
                        value={filters.dateRange}
                        onChange={(dates) => {
                            setFilters(prev => ({
                                ...prev,
                                dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined
                            }))
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                    />
                    <span style={{ color: '#666', fontSize: 12 }}>
                        <FilterOutlined /> 最新的任务排在最上面
                    </span>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1000 }}
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
