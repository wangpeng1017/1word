"use client"

import { useMemo, useState } from 'react'
import { Modal, Form, Select, DatePicker, Button, Space, Tabs, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { PlanClassesResponse, PlanItem } from '@/types/plan-classes'

interface Props {
  open: boolean
  onClose: () => void
  classes: any[]
  vocabularies: any[]
  onCompleted?: (res: PlanClassesResponse) => void
}

export default function BatchGenerateDialog({ open, onClose, classes, vocabularies, onCompleted }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlanClassesResponse | null>(null)
  const [isPreviewed, setIsPreviewed] = useState(false)

  const columns: ColumnsType<PlanItem> = useMemo(() => ([
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '班级ID', dataIndex: 'classId', key: 'classId' },
    {
      title: '单词', dataIndex: 'word', key: 'word', render: (w, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{w}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{r.primaryMeaning}</span>
        </Space>
      )
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', render: (s?: string) => {
        const colorMap: any = { PENDING: 'default', IN_PROGRESS: 'processing', COMPLETED: 'success', MASTERED: 'purple', INVALID: 'error' }
        const textMap: any = { PENDING: '待学习', IN_PROGRESS: '学习中', COMPLETED: '已完成', MASTERED: '已掌握', INVALID: '无效' }
        return s ? <Tag color={colorMap[s]}>{textMap[s]}</Tag> : '-'
      }
    },
    { title: '下次复习', dataIndex: 'nextReviewAt', key: 'nextReviewAt', render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' },
  ]), [])

  const doPreview = async () => {
    try {
      const token = localStorage.getItem('token')
      const values = await form.validateFields()
      setLoading(true)
      const payload = {
        classIds: values.classIds,
        vocabularyIds: values.vocabularyIds,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        preview: true,
      }
      const res = await fetch('/api/plan-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data as PlanClassesResponse)
        setIsPreviewed(true)
        message.success('预估完成，可以直接点击"确定生成"按钮')
      } else {
        message.error(json.error || '预估失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const doGenerate = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const values = await form.validateFields()

      const payload = {
        classIds: values.classIds,
        vocabularyIds: values.vocabularyIds,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        preview: false,
        overwrite: false, // 始终跳过已存在的计划
      }
      const res = await fetch('/api/plan-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data as PlanClassesResponse)
        message.success(json.message || '生成成功')
        onCompleted?.(json.data as PlanClassesResponse)
      } else {
        message.error(json.error || '生成失败')
      }
    } catch (error) {
      message.error('生成失败')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    form.resetFields()
    setResult(null)
    setIsPreviewed(false)
  }

  return (
    <Modal
      title="批量生成班级学习计划"
      open={open}
      onCancel={() => { resetAll(); onClose() }}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Form form={form} layout="vertical">
          <Form.Item label="选择班级" name="classIds" rules={[{ required: true, message: '请选择至少一个班级' }]}>
            <Select mode="multiple" placeholder="请选择班级（可多选）" showSearch optionFilterProp="children" disabled={loading || isPreviewed}>
              {classes.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name} ({c.grade}) - {c._count?.students || 0}人
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="选择词汇" name="vocabularyIds" rules={[{ required: true, message: '请选择至少一个词汇' }]}>
            <Select mode="multiple" placeholder="请选择词汇（可多选）" showSearch optionFilterProp="children" disabled={loading || isPreviewed}>
              {vocabularies.map((v: any) => (
                <Select.Option key={v.id} value={v.id}>
                  {v.word} - {v.primaryMeaning}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space size={12} wrap>
            <Form.Item label="计划开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]} initialValue={dayjs()}>
              <DatePicker disabled={loading || isPreviewed} />
            </Form.Item>
            <Form.Item label="计划结束日期" name="endDate">
              <DatePicker disabled={loading || isPreviewed} />
            </Form.Item>
          </Space>

          <Space>
            <Button onClick={doPreview} loading={loading} disabled={isPreviewed}>
              预估
            </Button>
            <Button
              type="primary"
              onClick={doGenerate}
              loading={loading}
              style={isPreviewed ? { animation: 'pulse 1.5s ease-in-out infinite', color: '#fff' } : { color: '#fff' }}
            >
              确定生成
            </Button>
            {isPreviewed && (
              <Button onClick={resetAll} disabled={loading}>
                重新配置
              </Button>
            )}
          </Space>
        </Form>

        {result && (
          <Tabs
            defaultActiveKey={result.invalidCount > 0 ? 'invalid' : (result.createdCount > 0 ? 'created' : 'duplicates')}
            items={[
              {
                key: 'created',
                label: `新增 (${result.createdCount})`,
                children: <Table rowKey={(r) => `${r.studentId}-${r.vocabularyId}`} dataSource={result.created} columns={columns} size="small" pagination={{ pageSize: 10 }} />,
              },
              {
                key: 'duplicates',
                label: `已跳过 (${result.duplicateCount})`,
                children: <Table rowKey={(r) => `${r.studentId}-${r.vocabularyId}`} dataSource={result.duplicates} columns={columns} size="small" pagination={{ pageSize: 10 }} />,
              },
              {
                key: 'invalid',
                label: <span style={{ color: '#ff4d4f' }}>单词无题目 ({result.invalidCount})</span>,
                children: (
                  <>
                    {result.invalidCount > 0 && (
                      <div style={{ marginBottom: 16, color: '#ff4d4f', background: '#fff2f0', padding: '8px 12px', borderRadius: 4, border: '1px solid #ffccc7' }}>
                        以下单词因缺失题目无法生成任务，请先在题目管理中补充题目。
                      </div>
                    )}
                    <Table rowKey={(r) => `${r.studentId}-${r.vocabularyId}`} dataSource={result.invalid} columns={columns} size="small" pagination={{ pageSize: 10 }} />
                  </>
                ),
              },
            ]}
          />
        )}
      </Space>
    </Modal>
  )
}