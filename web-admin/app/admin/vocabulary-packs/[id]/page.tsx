'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Space, Tag, message, Spin, Row, Col, Statistic, Modal, Table, AutoComplete, Input } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'

interface Vocabulary {
  id: string
  word: string
  primary_meaning: string
  difficulty: string
  is_high_frequency: boolean
}

interface PackDay {
  id: string
  dayNumber: number
  title: string | null
  wordCount: number
  day_words: { id: string; vocabularyId: string; orderIndex: number; vocabulary: Vocabulary }[]
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
  const [allVocabularies, setAllVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabs, setSelectedVocabs] = useState<Vocabulary[]>([])
  const [saving, setSaving] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: React.ReactNode }[]>([])

  useEffect(() => {
    fetchPack()
    fetchAllVocabularies()
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

  const fetchAllVocabularies = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/vocabularies?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setAllVocabularies(result.data?.vocabularies || [])
      }
    } catch (error) {
      console.error('加载词汇失败')
    }
  }

  const openDayEditor = (day: PackDay) => {
    setSelectedDay(day)
    setSelectedVocabs(day.day_words.map(w => w.vocabulary))
    setSearchValue('')
    setSearchOptions([])
    setModalVisible(true)
  }

  const handleSaveDay = async () => {
    if (!selectedDay) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vocabulary-packs/${packId}/days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dayNumber: selectedDay.dayNumber, vocabularyIds: selectedVocabs.map(v => v.id) })
      })
      const result = await res.json()
      if (result.success) {
        message.success('保存成功')
        setModalVisible(false)
        fetchPack()
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 获取已被其他天使用的词汇ID
  const usedVocabIds = new Set<string>()
  pack?.pack_days.forEach(day => {
    if (day.dayNumber !== selectedDay?.dayNumber) {
      day.day_words.forEach(w => usedVocabIds.add(w.vocabularyId))
    }
  })

  // 搜索词汇
  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (!value.trim()) {
      setSearchOptions([])
      return
    }
    const search = value.toLowerCase()
    const selectedIds = new Set(selectedVocabs.map(v => v.id))
    const results = allVocabularies
      .filter(v => !usedVocabIds.has(v.id) && !selectedIds.has(v.id))
      .filter(v => v.word.toLowerCase().includes(search) || v.primary_meaning.toLowerCase().includes(search))
      .slice(0, 50)
    setSearchOptions(results.map(v => ({
      value: v.id,
      label: <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{v.word} - {v.primary_meaning}</span></div>,
      vocab: v
    })))
  }

  // 添加词汇
  const handleAddVocab = (vocabId: string, option: any) => {
    if (option.vocab) {
      setSelectedVocabs(prev => [...prev, option.vocab])
      setSearchValue('')
      setSearchOptions([])
    }
  }

  // 删除词汇
  const handleRemoveVocab = (vocabId: string) => {
    setSelectedVocabs(prev => prev.filter(v => v.id !== vocabId))
  }

  // 已选词汇表格列
  const selectedColumns: ColumnsType<Vocabulary> = [
    { title: '#', width: 50, render: (_, __, index) => index + 1 },
    { title: '词汇', dataIndex: 'word', width: 120 },
    { title: '释义', dataIndex: 'primary_meaning' },
    { title: '难度', dataIndex: 'difficulty', width: 80 },
    { title: '高频', dataIndex: 'is_high_frequency', width: 60, render: (v) => v ? '✓' : '' },
    { title: '操作', width: 80, render: (_, record) => <Button size="small" danger onClick={() => handleRemoveVocab(record.id)}>删除</Button> }
  ]

  const dayColumns: ColumnsType<PackDay> = [
    { title: '天数', dataIndex: 'dayNumber', key: 'dayNumber', width: 80, render: (n) => `Day ${n}` },
    { title: '标题', dataIndex: 'title', key: 'title', render: (t) => t || '-' },
    { title: '词汇数', dataIndex: 'wordCount', key: 'wordCount', width: 100 },
    {
      title: '词汇预览', key: 'preview',
      render: (_, record) => (
        <span style={{ color: '#666', fontSize: 12 }}>
          {record.day_words.slice(0, 5).map(w => w.vocabulary.word).join(', ')}
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
      <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/vocabulary-packs')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

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
        width={800}
        okText="保存"
      >
        <div style={{ marginBottom: 16 }}>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="搜索并添加词汇..."
            value={searchValue}
            options={searchOptions}
            onSearch={handleSearch}
            onSelect={handleAddVocab}
          />
        </div>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>已选词汇 ({selectedVocabs.length} 词)</span>
          <Button size="small" onClick={() => setSelectedVocabs([])}>清空</Button>
        </div>
        <Table
          columns={selectedColumns}
          dataSource={selectedVocabs}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Modal>
    </div>
  )
}
