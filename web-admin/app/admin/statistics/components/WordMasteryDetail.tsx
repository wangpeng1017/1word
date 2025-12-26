'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Select, Space, Button, Tag, DatePicker, Progress, message } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'

const { RangePicker } = DatePicker

interface WordMasteryItem {
    vocabularyId: string
    word: string
    meaning: string
    phonetic: string | null
    difficulty: string
    totalWrongCount: number
    recentAccuracy: number | null
    practiceStudentCount: number
}

interface ClassInfo {
    id: string
    name: string
}

interface Student {
    id: string
    user: { name: string }
}

interface WordMasteryDetailProps {
    classId?: string
}

const difficultyColors: Record<string, string> = {
    EASY: 'green',
    MEDIUM: 'orange',
    HARD: 'red',
}

const difficultyLabels: Record<string, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
}

export default function WordMasteryDetail({ classId: propClassId }: WordMasteryDetailProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<WordMasteryItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedClass, setSelectedClass] = useState<string | undefined>(propClassId)
    const [selectedStudent, setSelectedStudent] = useState<string | undefined>()
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
    const [sortBy, setSortBy] = useState<'wrongCount' | 'recentAccuracy'>('wrongCount')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
                sortBy,
                sortOrder,
            })

            if (selectedClass) params.append('classId', selectedClass)
            if (selectedStudent) params.append('studentId', selectedStudent)
            if (dateRange) {
                params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
                params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
            }

            const res = await fetch(`/api/statistics/word-mastery-detail?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()

            if (result.success) {
                setData(result.data.words)
                setTotal(result.data.pagination.total)
            } else {
                message.error('加载数据失败')
            }
        } catch (error) {
            message.error('加载数据失败')
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, selectedClass, selectedStudent, dateRange, sortBy, sortOrder])

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
            '单词': item.word,
            '音标': item.phonetic || '-',
            '释义': item.meaning,
            '难度': difficultyLabels[item.difficulty] || item.difficulty,
            '累计错误次数': item.totalWrongCount,
            '正确率': item.recentAccuracy !== null ? `${item.recentAccuracy}%` : '-',
            '练习人数': item.practiceStudentCount,
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '单词掌握数据')
        XLSX.writeFile(wb, `单词掌握数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
        message.success('导出成功')
    }

    const columns: ColumnsType<WordMasteryItem> = [
        {
            title: '单词',
            dataIndex: 'word',
            key: 'word',
            width: 150,
            render: (word: string, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{word}</div>
                    {record.phonetic && (
                        <div style={{ fontSize: 12, color: '#999' }}>{record.phonetic}</div>
                    )}
                </div>
            ),
        },
        {
            title: '释义',
            dataIndex: 'meaning',
            key: 'meaning',
            ellipsis: true,
        },
        {
            title: '难度',
            dataIndex: 'difficulty',
            key: 'difficulty',
            width: 80,
            render: (difficulty: string) => (
                <Tag color={difficultyColors[difficulty]}>
                    {difficultyLabels[difficulty] || difficulty}
                </Tag>
            ),
        },
        {
            title: '累计错误次数',
            dataIndex: 'totalWrongCount',
            key: 'totalWrongCount',
            width: 130,
            sorter: true,
            render: (count: number) => {
                const color = count > 5 ? '#ff4d4f' : count > 2 ? '#faad14' : '#52c41a'
                return (
                    <Tag color={color} style={{ fontWeight: 600 }}>
                        {count} 次
                    </Tag>
                )
            },
        },
        {
            title: '正确率',
            key: 'recentAccuracy',
            width: 120,
            sorter: true,
            render: (_, record) => {
                if (record.recentAccuracy === null) {
                    return <span style={{ color: '#999' }}>暂无数据</span>
                }
                const accuracy = record.recentAccuracy
                const color = accuracy >= 80 ? '#52c41a' : accuracy >= 60 ? '#faad14' : '#ff4d4f'
                return (
                    <Progress
                        percent={accuracy}
                        size="small"
                        strokeColor={color}
                        format={() => `${accuracy}%`}
                    />
                )
            },
        },
        {
            title: '练习人数',
            dataIndex: 'practiceStudentCount',
            key: 'practiceStudentCount',
            width: 100,
            render: (count: number) => `${count} 人`,
        },
    ]

    return (
        <Card
            title="单词掌握详情"
            extra={
                <Space>
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
                    <Select
                        value={sortBy}
                        onChange={(val) => {
                            setSortBy(val)
                            setPage(1)
                        }}
                        style={{ width: 140 }}
                    >
                        <Select.Option value="wrongCount">按错误次数</Select.Option>
                        <Select.Option value="recentAccuracy">按正确率</Select.Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        刷新
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        导出Excel
                    </Button>
                </Space>
            }
        >
            <Table
                columns={columns}
                dataSource={data}
                rowKey="vocabularyId"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 个单词`,
                    onChange: (p, ps) => {
                        setPage(p)
                        setPageSize(ps)
                    },
                }}
                size="small"
            />
        </Card>
    )
}
