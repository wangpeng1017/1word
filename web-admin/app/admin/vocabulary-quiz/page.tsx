'use client'

/**
 * @file page.tsx
 * @desc 词汇量测试题目管理页面 - 参考现有questions页面风格
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input

interface QuizQuestion {
    id: string
    questionNo: number
    word?: string
    questionText?: string
    questionType: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    optionE: string
    correctOption: string
    difficulty: number
    isActive: boolean
    createdAt: string
}

const questionTypeMap: Record<string, { label: string; color: string }> = {
    ENGLISH_TO_CHINESE: { label: '英译汉', color: 'blue' },
    CHINESE_TO_ENGLISH: { label: '汉译英', color: 'green' },
    CONFUSABLE_WORDS: { label: '形近词', color: 'purple' },
}

const difficultyMap: Record<number, { label: string; color: string }> = {
    1: { label: '简单', color: 'green' },
    2: { label: '中等', color: 'orange' },
    3: { label: '困难', color: 'red' },
}

export default function VocabularyQuizPage() {
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
    const [form] = Form.useForm()
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [searchWord, setSearchWord] = useState('')
    const [filterType, setFilterType] = useState('')

    useEffect(() => {
        fetchQuestions()
    }, [pagination.current, pagination.pageSize, searchWord, filterType])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: pagination.current.toString(),
                limit: pagination.pageSize.toString(),
            })

            if (searchWord) {
                params.append('search', searchWord)
            }
            if (filterType) {
                params.append('questionType', filterType)
            }

            const response = await fetch(`/api/vocabulary-quiz-questions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await response.json()
            if (data.success) {
                setQuestions(data.data.questions)
                setPagination({
                    ...pagination,
                    total: data.data.pagination.total,
                })
            }
        } catch (error) {
            message.error('获取题目列表失败')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingQuestion(null)
        form.resetFields()
        form.setFieldsValue({
            questionType: 'ENGLISH_TO_CHINESE',
            optionD: '以上都不对',
            optionE: '不认识',
            difficulty: 1,
        })
        setModalVisible(true)
    }

    const handleEdit = (record: QuizQuestion) => {
        setEditingQuestion(record)
        form.setFieldsValue({
            word: record.word,
            questionText: record.questionText,
            questionType: record.questionType,
            optionA: record.optionA,
            optionB: record.optionB,
            optionC: record.optionC,
            optionD: record.optionD,
            optionE: record.optionE,
            correctOption: record.correctOption,
            difficulty: record.difficulty,
            isActive: record.isActive,
        })
        setModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/vocabulary-quiz-questions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await response.json()
            if (data.success) {
                message.success('删除成功')
                fetchQuestions()
            } else {
                message.error(data.message || '删除失败')
            }
        } catch (error) {
            message.error('删除失败')
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            const token = localStorage.getItem('token')

            const url = editingQuestion
                ? `/api/vocabulary-quiz-questions/${editingQuestion.id}`
                : '/api/vocabulary-quiz-questions'
            const method = editingQuestion ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            })

            const data = await response.json()
            if (data.success) {
                message.success(editingQuestion ? '更新成功' : '创建成功')
                setModalVisible(false)
                fetchQuestions()
            } else {
                message.error(data.message || '操作失败')
            }
        } catch (error) {
            console.error('Submit error:', error)
        }
    }

    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) return

        try {
            const token = localStorage.getItem('token')
            for (const id of selectedRowKeys) {
                await fetch(`/api/vocabulary-quiz-questions/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                })
            }
            message.success(`成功删除 ${selectedRowKeys.length} 道题目`)
            setSelectedRowKeys([])
            fetchQuestions()
        } catch (error) {
            message.error('批量删除失败')
        }
    }

    const columns: ColumnsType<QuizQuestion> = [
        {
            title: '题号',
            dataIndex: 'questionNo',
            key: 'questionNo',
            width: 70,
            sorter: (a, b) => a.questionNo - b.questionNo,
        },
        {
            title: '题型',
            dataIndex: 'questionType',
            key: 'questionType',
            width: 90,
            render: (type: string) => {
                const typeInfo = questionTypeMap[type]
                return <Tag color={typeInfo?.color}>{typeInfo?.label || type}</Tag>
            },
        },
        {
            title: '单词/题目',
            key: 'content',
            width: 200,
            render: (_, record) => (
                <div>
                    {record.word && <div style={{ fontWeight: 500 }}>{record.word}</div>}
                    {record.questionText && (
                        <div style={{ fontSize: 12, color: '#666' }}>{record.questionText}</div>
                    )}
                </div>
            ),
        },
        {
            title: '选项',
            key: 'options',
            render: (_, record) => (
                <div style={{ fontSize: 12 }}>
                    <div>A. {record.optionA} {record.correctOption === 'A' && <Tag color="green" size="small">✓</Tag>}</div>
                    <div>B. {record.optionB} {record.correctOption === 'B' && <Tag color="green" size="small">✓</Tag>}</div>
                    <div>C. {record.optionC} {record.correctOption === 'C' && <Tag color="green" size="small">✓</Tag>}</div>
                    <div>D. {record.optionD} {record.correctOption === 'D' && <Tag color="green" size="small">✓</Tag>}</div>
                </div>
            ),
        },
        {
            title: '难度',
            dataIndex: 'difficulty',
            key: 'difficulty',
            width: 80,
            render: (difficulty: number) => {
                const info = difficultyMap[difficulty]
                return <Tag color={info?.color}>{info?.label}</Tag>
            },
        },
        {
            title: '状态',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 70,
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'default'}>{isActive ? '启用' : '禁用'}</Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定删除这道题目吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>词汇量测试题目管理</h2>
                    <Space>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            新增题目
                        </Button>
                        {selectedRowKeys.length > 0 && (
                            <Popconfirm
                                title={`确定删除选中的 ${selectedRowKeys.length} 道题目吗？`}
                                onConfirm={handleBatchDelete}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button danger>批量删除 ({selectedRowKeys.length})</Button>
                            </Popconfirm>
                        )}
                    </Space>
                </div>

                {/* 筛选区域 */}
                <Space size="middle" style={{ marginBottom: 16 }}>
                    <span>筛选：</span>
                    <Input.Search
                        placeholder="搜索单词或题目"
                        allowClear
                        style={{ width: 200 }}
                        onSearch={(value) => {
                            setSearchWord(value)
                            setPagination({ ...pagination, current: 1 })
                        }}
                    />
                    <Select
                        style={{ width: 120 }}
                        placeholder="题型"
                        allowClear
                        options={[
                            { label: '全部题型', value: '' },
                            ...Object.entries(questionTypeMap).map(([key, { label }]) => ({
                                label,
                                value: key,
                            })),
                        ]}
                        value={filterType || undefined}
                        onChange={(value) => {
                            setFilterType(value || '')
                            setPagination({ ...pagination, current: 1 })
                        }}
                    />
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={questions}
                rowKey="id"
                loading={loading}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 道题目`,
                    onChange: (page, pageSize) => {
                        setPagination({ ...pagination, current: page, pageSize: pageSize || 20 })
                    },
                }}
            />

            <Modal
                title={editingQuestion ? '编辑题目' : '新增题目'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
                width={700}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="questionType"
                        label="题型"
                        rules={[{ required: true, message: '请选择题型' }]}
                    >
                        <Select>
                            {Object.entries(questionTypeMap).map(([key, { label }]) => (
                                <Select.Option key={key} value={key}>
                                    {label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="word" label="单词（英译汉题型必填）">
                        <Input placeholder="如：deliberate" />
                    </Form.Item>

                    <Form.Item name="questionText" label="题目文本（汉译英题型必填）">
                        <Input placeholder='如：以下哪个单词是"深思熟虑的"的含义' />
                    </Form.Item>

                    <Form.Item
                        name="optionA"
                        label="选项A"
                        rules={[{ required: true, message: '请输入选项A' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="optionB"
                        label="选项B"
                        rules={[{ required: true, message: '请输入选项B' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="optionC"
                        label="选项C"
                        rules={[{ required: true, message: '请输入选项C' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item name="optionD" label="选项D">
                        <Input />
                    </Form.Item>

                    <Form.Item name="optionE" label="选项E">
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="correctOption"
                        label="正确答案"
                        rules={[{ required: true, message: '请选择正确答案' }]}
                    >
                        <Select>
                            <Select.Option value="A">A</Select.Option>
                            <Select.Option value="B">B</Select.Option>
                            <Select.Option value="C">C</Select.Option>
                            <Select.Option value="D">D</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="difficulty" label="难度">
                        <Select>
                            <Select.Option value={1}>简单</Select.Option>
                            <Select.Option value={2}>中等</Select.Option>
                            <Select.Option value={3}>困难</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
