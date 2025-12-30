/**
 * @file 单词掌握数据页面
 * @desc 展示单词掌握情况统计，支持按班级/学生筛选、导出Excel
 * @input 依赖: /api/word-mastery, /api/classes, /api/students
 * @output 导出: 单词掌握数据管理页面组件
 * @pos 后台管理 - 学习数据分析模块
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
'use client'

import { useState, useEffect } from 'react'
import { Table, Card, Button, Space, message, Select, Progress, Tooltip } from 'antd'
import { ReloadOutlined, DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'

interface WordMasteryRecord {
    vocabularyId: string
    word: string
    meaning: string
    phonetic: string | null
    totalWrongCount: number
    practiceCount: number
    studentCount: number
    avgConsecutiveCorrect: number
    masteredCount: number
    difficultCount: number
    recentAccuracy: number | null
}

interface ClassInfo {
    id: string
    name: string
}

interface Student {
    id: string
    user: { name: string }
}

export default function WordMasteryPage() {
    const [data, setData] = useState<WordMasteryRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedClass, setSelectedClass] = useState<string | undefined>()
    const [selectedStudent, setSelectedStudent] = useState<string | undefined>()
    const [sortBy, setSortBy] = useState<string>('wrongCount')
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    useEffect(() => {
        loadClasses()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedClass, selectedStudent, sortBy, pagination.current, pagination.pageSize])

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

    const loadStudents = async (classId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/students?classId=${classId}`, {
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

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: String(pagination.current),
                limit: String(pagination.pageSize),
                sortBy,
                sortOrder: 'desc',
            })

            if (selectedClass) params.append('classId', selectedClass)
            if (selectedStudent) params.append('studentId', selectedStudent)

            const response = await fetch(`/api/word-mastery?${params}`, {
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

    const handleClassChange = (classId: string | undefined) => {
        setSelectedClass(classId)
        setSelectedStudent(undefined)
        if (classId) {
            loadStudents(classId)
        } else {
            setStudents([])
        }
    }

    const handleExportExcel = async () => {
        message.loading({ content: '正在导出...', key: 'export' })

        try {
            const token = localStorage.getItem('token')
            // 获取所有筛选条件下的数据（不分页）
            const params = new URLSearchParams({
                limit: '10000',  // 获取所有数据
                sortBy,
                sortOrder: 'desc',
            })

            if (selectedClass) params.append('classId', selectedClass)
            if (selectedStudent) params.append('studentId', selectedStudent)

            const response = await fetch(`/api/word-mastery?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()

            if (!result.success || !result.data.records?.length) {
                message.warning({ content: '没有数据可导出', key: 'export' })
                return
            }

            const exportData = result.data.records.map((item: WordMasteryRecord, index: number) => ({
                '序号': index + 1,
                '单词': item.word,
                '释义': item.meaning,
                '音标': item.phonetic || '-',
                '累计错误次数': item.totalWrongCount,
                '最近3次正确率': item.recentAccuracy !== null ? `${item.recentAccuracy}%` : '暂无数据',
                '练习人数': item.studentCount,
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, '单词掌握数据')
            XLSX.writeFile(wb, `单词掌握数据_${new Date().toISOString().split('T')[0]}.xlsx`)
            message.success({ content: `导出成功，共 ${exportData.length} 条数据`, key: 'export' })
        } catch (error) {
            message.error({ content: '导出失败', key: 'export' })
        }
    }

    const columns: ColumnsType<WordMasteryRecord> = [
        {
            title: '单词',
            dataIndex: 'word',
            key: 'word',
            width: 150,
            render: (word: string, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{word}</div>
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
            width: 200,
            ellipsis: true,
        },
        {
            title: (
                <span>
                    累计错误次数
                    <Tooltip title="所有学生答错该单词的总次数">
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                    </Tooltip>
                </span>
            ),
            dataIndex: 'totalWrongCount',
            key: 'totalWrongCount',
            width: 130,
            sorter: true,
            render: (count: number) => (
                <span style={{ color: count > 5 ? '#ff4d4f' : count > 2 ? '#faad14' : '#52c41a' }}>
                    {count}
                </span>
            ),
        },
        {
            title: (
                <span>
                    最近3次正确率
                    <Tooltip title="该单词最近3次被答题的正确率">
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                    </Tooltip>
                </span>
            ),
            dataIndex: 'recentAccuracy',
            key: 'recentAccuracy',
            width: 150,
            render: (accuracy: number | null) => {
                if (accuracy === null) {
                    return <span style={{ color: '#999' }}>暂无数据</span>
                }
                const color = accuracy >= 80 ? '#52c41a' : accuracy >= 50 ? '#faad14' : '#ff4d4f'
                return (
                    <Progress
                        percent={accuracy}
                        size="small"
                        strokeColor={color}
                        format={(percent) => `${percent}%`}
                    />
                )
            },
        },
        {
            title: '练习人数',
            dataIndex: 'studentCount',
            key: 'studentCount',
            width: 100,
        },
    ]

    return (
        <Card>
            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        placeholder="选择班级"
                        allowClear
                        style={{ width: 150 }}
                        value={selectedClass}
                        onChange={handleClassChange}
                        options={classes.map(c => ({ label: c.name, value: c.id }))}
                    />
                    <Select
                        placeholder="选择学生"
                        allowClear
                        style={{ width: 150 }}
                        value={selectedStudent}
                        onChange={setSelectedStudent}
                        disabled={!selectedClass}
                        options={students.map(s => ({ label: s.user.name, value: s.id }))}
                    />
                    <Select
                        placeholder="排序方式"
                        style={{ width: 150 }}
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { label: '按错误次数', value: 'wrongCount' },
                            { label: '按单词', value: 'word' },
                            { label: '按正确率', value: 'accuracy' },
                        ]}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                        导出Excel
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="vocabularyId"
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
