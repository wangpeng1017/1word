'use client'

import { useState, useEffect } from 'react'
import { Table as AntTable, Card, Tag, Button, Space, message, Select, DatePicker, Input } from 'antd'
import { ReloadOutlined, DownloadOutlined, SearchOutlined, FileWordOutlined, PrinterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

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

    const handleExportWord = async () => {
        try {
            message.loading({ content: '正在导出Word...', key: 'exportWord' })

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

            if (!result.success || !result.data.records.length) {
                message.error({ content: '没有数据可导出', key: 'exportWord' })
                return
            }

            const records: WrongQuestion[] = result.data.records

            // 创建表格行
            const tableRows = [
                // 表头
                new TableRow({
                    children: ['班级', '学生', '单词', '释义', '题型', '错误答案', '正确答案', '时间'].map(text =>
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text, bold: true, size: 20 })],
                                alignment: AlignmentType.CENTER,
                            })],
                            shading: { fill: 'E6E6E6' },
                        })
                    ),
                }),
                // 数据行
                ...records.map(r =>
                    new TableRow({
                        children: [
                            r.className || '-',
                            r.studentName || '-',
                            r.word || '-',
                            r.meaning || '-',
                            questionTypeMap[r.questionType] || r.questionType || '-',
                            r.wrongAnswer || '-',
                            r.correctAnswer || '-',
                            dayjs(r.wrongAt).format('MM-DD HH:mm'),
                        ].map(text =>
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text, size: 18 })],
                                })],
                            })
                        ),
                    })
                ),
            ]

            // 创建文档
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: '错题明细', bold: true, size: 32 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 },
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: `导出时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}  共 ${records.length} 条`, size: 20, color: '666666' })],
                            spacing: { after: 200 },
                        }),
                        new DocxTable({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: tableRows,
                        }),
                    ],
                }],
            })

            // 导出文件
            const blob = await Packer.toBlob(doc)
            saveAs(blob, `错题明细_${dayjs().format('YYYYMMDD_HHmmss')}.docx`)

            message.success({ content: '导出Word成功', key: 'exportWord' })
        } catch (error) {
            console.error('导出Word失败:', error)
            message.error({ content: '导出Word失败', key: 'exportWord' })
        }
    }

    const handlePrint = async () => {
        try {
            message.loading({ content: '正在准备打印...', key: 'print' })

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

            if (!result.success || !result.data.records.length) {
                message.error({ content: '没有数据可打印', key: 'print' })
                return
            }

            const records: WrongQuestion[] = result.data.records

            // 创建打印内容
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>错题明细</title>
                    <style>
                        body { font-family: "Microsoft YaHei", sans-serif; padding: 20px; }
                        h1 { text-align: center; margin-bottom: 10px; }
                        .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
                        th { background-color: #f0f0f0; font-weight: bold; }
                        .wrong { color: #ff4d4f; }
                        .correct { color: #52c41a; }
                        @media print {
                            body { padding: 0; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>
                    <h1>错题明细</h1>
                    <div class="info">导出时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')} | 共 ${records.length} 条</div>
                    <table>
                        <thead>
                            <tr>
                                <th>班级</th>
                                <th>学生</th>
                                <th>单词</th>
                                <th>释义</th>
                                <th>题型</th>
                                <th>错误答案</th>
                                <th>正确答案</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.className || '-'}</td>
                                    <td>${r.studentName || '-'}</td>
                                    <td>${r.word || '-'}</td>
                                    <td>${r.meaning || '-'}</td>
                                    <td>${questionTypeMap[r.questionType] || r.questionType || '-'}</td>
                                    <td class="wrong">${r.wrongAnswer || '-'}</td>
                                    <td class="correct">${r.correctAnswer || '-'}</td>
                                    <td>${dayjs(r.wrongAt).format('MM-DD HH:mm')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `

            // 创建打印窗口
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(printContent)
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => {
                    printWindow.print()
                    printWindow.close()
                }, 250)
            }

            message.success({ content: '打印窗口已打开', key: 'print' })
        } catch (error) {
            console.error('打印失败:', error)
            message.error({ content: '打印失败', key: 'print' })
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
                    <Button icon={<FileWordOutlined />} onClick={handleExportWord}>
                        导出Word
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                        打印
                    </Button>
                </Space>
            </div>

            {/* 表格 */}
            <AntTable
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
