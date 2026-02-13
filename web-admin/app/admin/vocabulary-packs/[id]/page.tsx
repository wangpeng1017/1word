'use client'

// vocabulary-packs/[id]/page.tsx
// @input: 词汇包ID、所有词汇列表(vocabularies API)、每日词汇配置
// @output: 更新词汇包每天的单词配置
// @pos: 管理后台-词汇包每日单词配置页面，支持Transfer穿梭框和批量粘贴添加
// ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md

import { useState, useEffect } from 'react'
import { Card, Button, Tag, message, Spin, Row, Col, Statistic, Modal, Table, Input, InputNumber, Divider } from 'antd'
import { ArrowLeftOutlined, PlusCircleOutlined, ClearOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input

interface PackDay {
  id: string
  dayNumber: number
  title: string | null
  wordCount: number
  day_words: { id: string; vocabularyId: string; orderIndex: number; vocabulary: any }[]
}

interface VocabularyPack {
  id: string
  name: string
  description: string | null
  totalDays: number
  totalWords: number
  isActive: boolean
  pack_days: PackDay[]
}

export default function VocabularyPackDetailPage() {
  const router = useRouter()
  const params = useParams()
  const packId = params.id as string

  const [pack, setPack] = useState<VocabularyPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<PackDay | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  // Left List (Review/Select Pool)
  const [leftVocabs, setLeftVocabs] = useState<any[]>([])
  const [leftTotal, setLeftTotal] = useState(0)
  const [leftPage, setLeftPage] = useState(1)
  const [leftLoading, setLeftLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  // Right List (Selected)
  // Store full objects for display, extract IDs for save
  const [selectedVocabs, setSelectedVocabs] = useState<any[]>([])

  // Expand Days
  const [expandModalVisible, setExpandModalVisible] = useState(false)
  const [expandDays, setExpandDays] = useState<number | null>(null)

  // Batch Add
  const [batchInput, setBatchInput] = useState('')
  const [batchResult, setBatchResult] = useState<{ found: number; added: number; skipped: number; notFound: string[] } | null>(null)
  const [loadingVocabs, setLoadingVocabs] = useState(false) // reused for batch loading

  useEffect(() => {
    fetchPack()
  }, [packId])

  const fetchPack = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vocabulary-packs/${packId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setPack(result.data)
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 扩展天数
  const handleExpandDays = async () => {
    if (!expandDays || !pack || expandDays <= pack.totalDays) {
      message.warning(`请输入大于 ${pack?.totalDays} 的天数`)
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabulary-packs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: packId, totalDays: expandDays })
      })
      const result = await res.json()
      if (result.success) {
        message.success(`已扩展到 ${expandDays} 天`)
        setExpandModalVisible(false)
        setExpandDays(null)
        fetchPack()
      } else {
        message.error(result.error)
      }
    } catch {
      message.error('扩展失败')
    }
  }

  // Load Left Side (Server Pagination)
  const fetchLeftVocabs = async (page = 1, search = '') => {
    setLeftLoading(true)
    try {
      const token = localStorage.getItem('token')
      // Note: Backend API must support `search` and `page/limit`
      const res = await fetch(`/api/vocabularies?page=${page}&limit=10&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setLeftVocabs(result.data.vocabularies)
        setLeftTotal(result.data.pagination.total)
        setLeftPage(page)
      }
    } catch (e) { message.error('加载词汇失败') }
    finally { setLeftLoading(false) }
  }

  const openDayEditor = (day: PackDay) => {
    setSelectedDay(day)
    // Initialize Selected from Day Words
    const initialSelected = day.day_words.map(dw => ({
      id: dw.vocabularyId,
      word: dw.vocabulary.word,
      primaryMeaning: dw.vocabulary.primaryMeaning || dw.vocabulary.primary_meaning,
      difficulty: dw.vocabulary.difficulty,
      isHighFrequency: dw.vocabulary.isHighFrequency || dw.vocabulary.is_high_frequency
    }))
    setSelectedVocabs(initialSelected)

    // Reset Left
    setKeyword('')
    setLeftPage(1)
    setBatchInput('')
    setBatchResult(null)
    setModalVisible(true)
    fetchLeftVocabs(1, '')
  }

  const handleSaveDay = async () => {
    if (!selectedDay) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vocabulary-packs/${packId}/days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dayNumber: selectedDay.dayNumber,
          vocabularyIds: selectedVocabs.map(v => v.id)
        })
      })
      const result = await res.json()
      if (result.success) {
        message.success('保存成功')
        setModalVisible(false)
        fetchPack()
      } else { message.error(result.error) }
    } catch { message.error('保存失败') }
    finally { setSaving(false) }
  }

  // Add from Left to Right
  const handleAdd = (record: any) => {
    if (selectedVocabs.find(v => v.id === record.id)) return
    setSelectedVocabs([...selectedVocabs, record])
  }

  const handleRemove = (id: string) => {
    setSelectedVocabs(selectedVocabs.filter(v => v.id !== id))
  }

  // Batch Add Logic
  const handleBatchAdd = async () => {
    if (!batchInput.trim()) return message.warning('请输入单词')
    const words = batchInput.split(/[,\n;，；\s]+/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z][a-z-']*$/.test(w))
    if (!words.length) return message.warning('无效输入')

    // 1. Filter out already selected to avoid redundant API calls (optional but good)
    const currentWordSet = new Set(selectedVocabs.map(v => v.word.toLowerCase()))
    const newWords = words.filter(w => !currentWordSet.has(w))

    if (!newWords.length) return message.info('所有单词已在列表中')

    setLoadingVocabs(true) // Reuse state for batch loading
    try {
      const token = localStorage.getItem('token')
      // Call new API for batch lookup
      const res = await fetch(`/api/vocabularies?words=${newWords.join(',')}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        const foundVocabs = result.data.vocabularies
        const foundSet = new Set(foundVocabs.map((v: any) => v.word.toLowerCase()))

        // Add to selected
        const toAdd = foundVocabs.filter((v: any) => !currentWordSet.has(v.word.toLowerCase()))
        setSelectedVocabs(prev => [...prev, ...toAdd])

        setBatchResult({
          found: words.length,
          added: toAdd.length,
          skipped: words.length - newWords.length, // skipped because already selected
          notFound: newWords.filter(w => !foundSet.has(w))
        })
        setBatchInput('')
      }
    } finally { setLoadingVocabs(false) }
  }

  // Columns
  const leftColumns = [
    {
      title: '单词', dataIndex: 'word', width: 120, render: (t: string, r: any) => (
        <>
          <div style={{ fontWeight: 'bold' }}>{t}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{r.primaryMeaning}</div>
        </>
      )
    },
    {
      title: '操作', width: 60, render: (_: any, r: any) => {
        const isSelected = selectedVocabs.some(v => v.id === r.id)
        return <Button size="small" type={isSelected ? 'default' : 'primary'} disabled={isSelected} onClick={() => handleAdd(r)}>{isSelected ? '已选' : '添加'}</Button>
      }
    }
  ]

  const rightColumns = [
    {
      title: '已选单词', dataIndex: 'word', render: (t: string, r: any) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t} <span style={{ color: '#999', fontSize: 12 }}> {r.primaryMeaning}</span></span>
          <Button size="small" danger type="text" onClick={() => handleRemove(r.id)}>移除</Button>
        </div>
      )
    }
  ]

  const dayColumns: ColumnsType<PackDay> = [
    { title: '天数', dataIndex: 'dayNumber', key: 'dayNumber', width: 80, render: (n) => `Day ${n}` },
    { title: '标题', dataIndex: 'title', key: 'title', render: (t) => t || `Day ${t}` },
    { title: '词汇数', dataIndex: 'wordCount', key: 'wordCount', width: 100 },
    {
      title: '词汇预览', key: 'preview',
      render: (_, record) => (
        <span style={{ color: '#666', fontSize: 12 }}>
          {record.day_words.slice(0, 5).map(w => w.vocabulary?.word || '').join(', ')}
          {record.day_words.length > 5 ? '...' : ''}
        </span>
      )
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openDayEditor(record)}>配置词汇</Button>
      )
    }
  ]

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  if (!pack) return <div>词汇库不存在</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/vocabulary-packs')}>
          返回列表
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setExpandDays(pack.totalDays + 1); setExpandModalVisible(true) }}>
          扩展天数
        </Button>
      </div>

      <Card title={pack.name} extra={<Tag color={pack.isActive ? 'green' : 'default'}>{pack.isActive ? '启用' : '禁用'}</Tag>}>
        <p style={{ color: '#666', marginBottom: 16 }}>{pack.description || '暂无描述'}</p>
        <Row gutter={16}>
          <Col span={6}><Statistic title="总天数" value={pack.totalDays} suffix="天" /></Col>
          <Col span={6}><Statistic title="总词汇" value={pack.totalWords} suffix="词" /></Col>
          <Col span={6}><Statistic title="平均每天" value={pack.totalWords > 0 ? Math.round(pack.totalWords / pack.totalDays) : 0} suffix="词" /></Col>
          <Col span={6}><Statistic title="已配置天数" value={pack.pack_days.filter(d => d.wordCount > 0).length} suffix={`/ ${pack.totalDays}`} /></Col>
        </Row>
      </Card>

      <Card title="每日词汇配置" style={{ marginTop: 16 }}>
        <Table columns={dayColumns} dataSource={pack.pack_days} rowKey="id" pagination={false} />
      </Card>

      <Modal
        title={`配置 Day ${selectedDay?.dayNumber} 词汇`}
        open={modalVisible}
        onOk={handleSaveDay}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        width={950}
        okText="保存"
        styles={{ body: { padding: '20px 24px' } }}
      >
        {/* 批量添加区域 */}
        <div style={{ marginBottom: 20, padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <div style={{ marginBottom: 12, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <PlusCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            批量添加单词
          </div>
          <TextArea
            placeholder="粘贴单词列表，支持以下格式：&#10;• 逗号分隔: abandon, ability, abnormal&#10;• 换行分隔: 每行一个单词&#10;• 混合分隔: 逗号、空格、换行均可"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            rows={3}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="primary" onClick={handleBatchAdd} icon={<PlusCircleOutlined />} loading={loadingVocabs}>
              识别并添加
            </Button>
            <Button onClick={() => setBatchInput('')} icon={<ClearOutlined />}>
              清空输入
            </Button>
            {batchResult && (
              <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>
                共找到 {batchResult.found} 个，成功添加 {batchResult.added} 个
                {batchResult.skipped > 0 && `，跳过 ${batchResult.skipped} 个`}
                {batchResult.notFound.length > 0 && `，${batchResult.notFound.length} 个未匹配`}
              </span>
            )}
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={24}>
          <Col span={12}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>待选词汇库</div>
            <Input.Search placeholder="搜索单词..." onSearch={val => { setKeyword(val); fetchLeftVocabs(1, val) }} style={{ marginBottom: 8 }} />
            <Table
              size="small"
              columns={leftColumns}
              dataSource={leftVocabs}
              rowKey="id"
              loading={leftLoading}
              pagination={{
                current: leftPage,
                total: leftTotal,
                pageSize: 10,
                onChange: (p) => fetchLeftVocabs(p, keyword),
                showSizeChanger: false
              }}
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>已选 ({selectedVocabs.length})</span>
              <Button size="small" onClick={() => setSelectedVocabs([])}>清空</Button>
            </div>
            <Table
              size="small"
              columns={rightColumns}
              dataSource={selectedVocabs}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ y: 300 }}
            />
          </Col>
        </Row>
      </Modal>

      {/* 扩展天数弹窗 */}
      <Modal
        title="扩展天数"
        open={expandModalVisible}
        onOk={handleExpandDays}
        onCancel={() => { setExpandModalVisible(false); setExpandDays(null) }}
        okText="确认扩展"
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          当前 <strong>{pack.totalDays}</strong> 天，扩展后会自动创建空Day（无新词），可在配置中添加单词。
        </p>
        <InputNumber
          min={pack.totalDays + 1}
          max={200}
          value={expandDays}
          onChange={(v) => setExpandDays(v)}
          addonAfter="天"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  )
}
