'use client'

import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, message, Select, DatePicker, Input } from 'antd'
import { ReloadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import PdfExport from '@/components/PdfExport'

const { RangePicker } = DatePicker

interface WrongQuestion {
    id: string
    studentId: string
    studentName: string
    className: string
    word: string
    meaning: string
    questionType: string
    questionContent: string
    wrongAnswer: string
    correctAnswer: string
    wrongAt: string
}

interface Student {
    id: string
    user: { name: string }
}

interface ClassInfo {
    id: string
    name: string
}

const questionTypeMap: Record<string, string> = {
    ENGLISH_TO_CHINESE: '英选汉',
    CHINESE_TO_ENGLISH: '汉选英',
    LISTENING: '听音选词',
    FILL_IN_BLANK: '选词填空',
}

export default function WrongQuestionsPage() {
    const [data, setData] = useState<WrongQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [filters, setFilters] = useState<{
        studentId?: string
        classId?: string
        dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
    }>({})
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    useEffect(() => {
        loadStudents()
        loadClasses()
    }, [])

    useEffect(() => {
        fetchData()
    }, [pagination.current, pagination.pageSize])

    const loadStudents = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/students?limit=1000', {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()
            if (result.success) {
                setStudents(result.data?.students || [])
            }
        } catch (error) {
            console.error('加载学生失败:', error)
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
            console.error('加载班级失败:', error)
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: String(pagination.current),
                limit: String(pagination.pageSize),
            })

            if (filters.studentId) params.append('studentId', filters.studentId)
            if (filters.classId) params.append('classId', filters.classId)
            if (filters.dateRange?.[0]) params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
            if (filters.dateRange?.[1]) params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))

            const response = await fetch(`/api/wrong-questions?${params}`, {
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

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }))
        fetchData()
    }

    const handleReset = () => {
        setFilters({})
        setPagination(prev => ({ ...prev, current: 1 }))
        fetchData()
    }

    const handleExportExcel = async () => {
        try {
            message.loading({ content: '正在导出...', key: 'export' })

            // 获取所有数据
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({ limit: '10000' })
            if (filters.studentId) params.append('studentId', filters.studentId)
            if (filters.classId) params.append('classId', filters.classId)
            if (filters.dateRange?.[0]) params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
            if (filters.dateRange?.[1]) params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))

            const response = await fetch(`/api/wrong-questions?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (!result.success) {
                message.error({ content: '导出失败', key: 'export' })
                return
            }

            const exportData = result.data.records.map((r: WrongQuestion) => ({
                '班级': r.className,
                '学生姓名': r.studentName,
                '错误单词': r.word,
                '释义': r.meaning,
                '题型': questionTypeMap[r.questionType] || r.questionType,
                '错误答案': r.wrongAnswer,
                '正确答案': r.correctAnswer,
                '错误时间': dayjs(r.wrongAt).format('YYYY-MM-DD HH:mm:ss'),
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, '错题明细')
            XLSX.writeFile(wb, `错题明细_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)

            message.success({ content: '导出成功', key: 'export' })
        } catch (error) {
            message.error({ content: '导出失败', key: 'export' })
        }
    }

    const columns: ColumnsType<WrongQuestion> = [
        {
            title: '班级',
            dataIndex: 'className',
            key: 'className',
            width: 100,
        },
        {
            title: '学生姓名',
            dataIndex: 'studentName',
            key: 'studentName',
            width: 90,
        },
        {
            title: '错误单词',
            dataIndex: 'word',
            key: 'word',
            width: 120,
            render: (word: string, record) => (
                <Space direction="vertical" size={0}>
                    <span style={{ fontWeight: 'bold' }}>{word}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>{record.meaning}</span>
                </Space>
            ),
        },
        {
            title: '题型',
            dataIndex: 'questionType',
            key: 'questionType',
            width: 90,
            render: (type: string) => (
                <Tag>{questionTypeMap[type] || type}</Tag>
            ),
        },
        {
            title: '错误答案',
            dataIndex: 'wrongAnswer',
            key: 'wrongAnswer',
            width: 150,
            render: (answer: string) => (
                <span style={{ color: '#ff4d4f' }}>{answer || '-'}</span>
            ),
        },
        {
            title: '正确答案',
            dataIndex: 'correctAnswer',
            key: 'correctAnswer',
            width: 150,
            render: (answer: string) => (
                <span style={{ color: '#52c41a' }}>{answer || '-'}</span>
            ),
        },
        {
            title: '错误时间',
            dataIndex: 'wrongAt',
            key: 'wrongAt',
            width: 160,
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
    ]

    return (
        <Card title="错题明细">
            {/* 筛选区域 */}
            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        placeholder="选择班级"
                        allowClear
                        showSearch
                        style={{ width: 150 }}
                        value={filters.classId}
                        onChange={(val) => setFilters({ ...filters, classId: val })}
                        optionFilterProp="children"
                    >
                        {classes.map((c) => (
                            <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="选择学生"
                        allowClear
                        showSearch
                        style={{ width: 150 }}
                        value={filters.studentId}
                        onChange={(val) => setFilters({ ...filters, studentId: val })}
                        optionFilterProp="children"
                    >
                        {students.map((s: any) => (
                            <Select.Option key={s.id} value={s.id}>{s.user?.name}</Select.Option>
                        ))}
                    </Select>
                    <RangePicker
                        value={filters.dateRange}
                        onChange={(dates) => setFilters({ ...filters, dateRange: dates as any })}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        查询
                    </Button>
                    <Button onClick={handleReset}>重置</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExcel} style={{ color: '#fff' }}>
                        导出Excel
                    </Button>
                    <PdfExport
                        title="错题明细"
                        data={data.map(item => ({
                            word: item.word,
                            meaning: item.meaning,
                            wrongAnswer: item.wrongAnswer,
                            correctAnswer: item.correctAnswer,
                            wrongAt: dayjs(item.wrongAt).format('YYYY-MM-DD HH:mm'),
                        }))}
                    />
                </Space>
            </div>

            {/* 表格 */}
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
