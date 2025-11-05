'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Descriptions, Button, Space, Table, Tag, Statistic, Row, Col, Empty, message, DatePicker } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<any>(null)
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // 加载学生信息和错题
      const [studentRes, wrongRes] = await Promise.all([
        fetch(`/api/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/students/${studentId}/wrong-questions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const studentData = await studentRes.json()
      const wrongData = await wrongRes.json()

      if (studentData.success) {
        setStudent(studentData.data)
      }
      if (wrongData.success) {
        setWrongQuestions(wrongData.data?.wrongQuestions || [])
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ studentId })
      
      if (dateRange) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await fetch(`/api/export/student-report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${student?.name || '学生'}_学习报告_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        message.success('导出成功')
      } else {
        message.error('导出失败')
      }
    } catch (error) {
      console.error('导出错误:', error)
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const wrongColumns = [
    {
      title: '单词',
      dataIndex: ['vocabulary', 'word'],
      key: 'word',
    },
    {
      title: '题型',
      dataIndex: ['question', 'type'],
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          ENGLISH_TO_CHINESE: '英选汉',
          CHINESE_TO_ENGLISH: '汉选英',
          LISTENING: '听音选词',
          FILL_IN_BLANK: '选词填空',
        }
        return <Tag>{typeMap[type] || type}</Tag>
      },
    },
    {
      title: '错误答案',
      dataIndex: 'wrongAnswer',
      key: 'wrongAnswer',
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      render: (text: string) => <Tag color="success">{text}</Tag>,
    },
    {
      title: '错误时间',
      dataIndex: 'wrongAt',
      key: 'wrongAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          返回
        </Button>
        <Space>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
          />
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={handleExportReport}
          >
            导出学习报告
          </Button>
        </Space>
      </div>

      <Card title="学生信息" loading={loading} style={{ marginBottom: 16 }}>
        {student && (
          <Descriptions column={2}>
            <Descriptions.Item label="姓名">{student.name}</Descriptions.Item>
            <Descriptions.Item label="学号">{student.studentNo}</Descriptions.Item>
            <Descriptions.Item label="年级">{student.grade || '-'}</Descriptions.Item>
            <Descriptions.Item label="班级">
              {student.class?.name || '未分配'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="学习词汇" value={0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已掌握" value={0} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="错题数" value={wrongQuestions.length} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="学习天数" value={0} />
          </Card>
        </Col>
      </Row>

      <Card title={`错题记录 (${wrongQuestions.length})`}>
        {wrongQuestions.length > 0 ? (
          <Table columns={wrongColumns} dataSource={wrongQuestions} rowKey="id" />
        ) : (
          <Empty description="暂无错题" />
        )}
      </Card>
    </div>
  )
}
