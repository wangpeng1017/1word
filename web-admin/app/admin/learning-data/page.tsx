'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Select, DatePicker, Space, Button, Tag, message } from 'antd'
import { ReloadOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, PauseCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'

const { RangePicker } = DatePicker

interface LearningSession {
    id: string
    studentId: string
    studentName: string
    studentNo: string
    className: string
    taskDate: string
    totalWords: number
    completedWords: number
    completionRate: string
    correctCount: number
    wrongCount: number
    accuracy: string
    totalTimeSeconds: number
    startedAt: string
    completedAt: string | null
    isCompleted: boolean
}

interface ClassInfo {
    id: string
    name: string
}

interface Student {
    id: string
    user: { name: string }
}

/**
 * 格式化秒数为 HH:mm:ss
 */
function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}

export default function LearningDataPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<LearningSession[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedClass, setSelectedClass] = useState<string | undefined>()
    const [selectedStudent, setSelectedStudent] = useState<string | undefined>()
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

    // 加载班级列表
    const loadClasses = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/classes', {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()
            if (result.success) {
                setClasses(result.data || [])
            }
        } catch (error) {
            console.error('加载班级失败:', error)
        }
    }, [])

    // 加载学生列表
    const loadStudents = useCallback(async (classId: string) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/students?classId=${classId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()
            if (result.success) {
                setStudents(result.data || [])
            }
        } catch (error) {
            console.error('加载学生失败:', error)
        }
    }, [])

    // 加载数据
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            if (selectedClass) params.append('classId', selectedClass)
            if (selectedStudent) params.append('studentId', selectedStudent)
            if (dateRange) {
                params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
                params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
            }

            const res = await fetch(`/api/statistics/learning-sessions?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()

            if (result.success) {
                setData(result.data.sessions)
                setTotal(result.data.pagination.total)
            } else {
                message.error('加载数据失败')
            }
        } catch (error) {
            message.error('加载数据失败')
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, selectedClass, selectedStudent, dateRange])

    useEffect(() => {
        loadClasses()
    }, [loadClasses])

    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass)
        } else {
            setStudents([])
            setSelectedStudent(undefined)
        }
    }, [selectedClass, loadStudents])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 导出 Excel
    const handleExport = () => {
        if (data.length === 0) {
            message.warning('没有数据可导出')
            return
        }

        const exportData = data.map((item) => ({
            '班级': item.className,
            '学生姓名': item.studentName,
            '学号': item.studentNo,
            '学习日期': item.taskDate,
            '总词数': item.totalWords,
            '已完成': item.completedWords,
            '完成率': `${item.completionRate}%`,
            '正确数': item.correctCount,
            '错误数': item.wrongCount,
            '正确率': `${item.accuracy}%`,
            '答题时长': formatDuration(item.totalTimeSeconds),
            '开始时间': dayjs(item.startedAt).format('YYYY-MM-DD HH:mm:ss'),
            '结束时间': item.completedAt ? dayjs(item.completedAt).format('YYYY-MM-DD HH:mm:ss') : '-',
            '完成状态': item.status === 'COMPLETED' ? '已完成' : item.status === 'IN_PROGRESS' ? '进行中' : '已中断',
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '学习数据')
        XLSX.writeFile(wb, `学习数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
        message.success('导出成功')
    }

    const columns: ColumnsType<LearningSession> = [
        {
            title: '班级',
            dataIndex: 'className',
            key: 'className',
            width: 100,
        },
        {
            title: '学生',
            dataIndex: 'studentName',
            key: 'studentName',
            width: 100,
        },
        {
            title: '学号',
            dataIndex: 'studentNo',
            key: 'studentNo',
            width: 100,
        },
        {
            title: '日期',
            dataIndex: 'taskDate',
            key: 'taskDate',
            width: 110,
        },
        {
            title: '完成率',
            key: 'completionRate',
            width: 100,
            render: (_, record) => {
                const rate = parseFloat(record.completionRate)
                const color = rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {record.completedWords}/{record.totalWords} ({record.completionRate}%)
                    </span>
                )
            },
        },
        {
            title: '正确率',
            key: 'accuracy',
            width: 100,
            render: (_, record) => {
                const accuracy = parseFloat(record.accuracy)
                const color = accuracy >= 80 ? '#52c41a' : accuracy >= 60 ? '#faad14' : '#ff4d4f'
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {record.accuracy}%
                    </span>
                )
            },
        },
        {
            title: '答题时长',
            dataIndex: 'totalTimeSeconds',
            key: 'totalTimeSeconds',
            width: 100,
            render: (seconds: number) => formatDuration(seconds),
        },
        {
            title: '开始时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 160,
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '结束时间',
            dataIndex: 'completedAt',
            key: 'completedAt',
            width: 160,
            render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            title: '状态',
            dataIndex: 'isCompleted',
            key: 'isCompleted',
            width: 80,
            render: (isCompleted: boolean) => (
                isCompleted
                    ? <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>
                    : <Tag icon={<CloseCircleOutlined />} color="default">未完成</Tag>
            ),
        },
    ]

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>学习数据</h1>
            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Select
                        placeholder="选择班级"
                        allowClear
                        style={{ width: 150 }}
                        value={selectedClass}
                        onChange={(val) => {
                            setSelectedClass(val)
                            setSelectedStudent(undefined)
                            setPage(1)
                        }}
                    >
                        {classes.map((cls) => (
                            <Select.Option key={cls.id} value={cls.id}>
                                {cls.name}
                            </Select.Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="选择学生"
                        allowClear
                        style={{ width: 120 }}
                        value={selectedStudent}
                        onChange={(val) => {
                            setSelectedStudent(val)
                            setPage(1)
                        }}
                        disabled={!selectedClass}
                    >
                        {students.map((s) => (
                            <Select.Option key={s.id} value={s.id}>
                                {s.user.name}
                            </Select.Option>
                        ))}
                    </Select>
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            setDateRange(dates as [Dayjs, Dayjs] | null)
                            setPage(1)
                        }}
                        format="YYYY-MM-DD"
                        placeholder={['开始日期', '结束日期']}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        刷新
                    </Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                        导出Excel
                    </Button>
                </Space>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `共 ${t} 条记录`,
                        onChange: (p, ps) => {
                            setPage(p)
                            setPageSize(ps)
                        },
                    }}
                    scroll={{ x: 1200 }}
                    size="small"
                />
            </Card>
        </div>
    )
}
