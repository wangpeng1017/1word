'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Tag, message, Spin, Row, Col, Statistic, Modal, Table, Transfer, Input } from 'antd'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import type { TransferProps } from 'antd'

interface Vocabulary {
  id: string
  word: string
  primaryMeaning: string
  difficulty: string
  isHighFrequency: boolean
}

interface TransferItem {
  key: string
  word: string
  primaryMeaning: string
  difficulty: string
  isHighFrequency: boolean
}

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

  // Transfer 相关状态
  const [allVocabularies, setAllVocabularies] = useState<TransferItem[]>([])
  const [targetKeys, setTargetKeys] = useState<string[]>([])
  const [loadingVocabs, setLoadingVocabs] = useState(false)
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')

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

  // 加载所有词汇
  const fetchAllVocabularies = async () => {
    setLoadingVocabs(true)
    try {
      const token = localStorage.getItem('token')
      // 分页加载所有词汇
      let allVocabs: any[] = []
      let page = 1
      const limit = 200
      let hasMore = true

      while (hasMore) {
        const res = await fetch(`/api/vocabularies?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()
        if (result.success) {
          const vocabs = result.data?.vocabularies || []
          allVocabs = [...allVocabs, ...vocabs]
          hasMore = vocabs.length === limit
          page++
        } else {
          hasMore = false
        }
      }

      // 转换为 Transfer 需要的格式
      const items: TransferItem[] = allVocabs.map((v: any) => ({
        key: v.id,
        word: v.word,
        primaryMeaning: v.primaryMeaning || v.primary_meaning || '',
        difficulty: v.difficulty || 'MEDIUM',
        isHighFrequency: v.isHighFrequency ?? v.is_high_frequency ?? false,
      }))

      setAllVocabularies(items)
    } catch (error) {
      message.error('加载词汇失败')
    } finally {
      setLoadingVocabs(false)
    }
  }

  // 获取已被其他天使用的词汇ID
  const getUsedVocabIds = () => {
    const usedIds = new Set<string>()
    pack?.pack_days.forEach(day => {
      if (day.dayNumber !== selectedDay?.dayNumber) {
        day.day_words.forEach(w => usedIds.add(w.vocabularyId))
      }
    })
    return usedIds
  }

  const openDayEditor = async (day: PackDay) => {
    setSelectedDay(day)
    // 设置已选词汇
    const selectedIds = day.day_words.map(w => w.vocabularyId)
    setTargetKeys(selectedIds)
    setLeftSearch('')
    setRightSearch('')
    setModalVisible(true)

    // 加载所有词汇
    if (allVocabularies.length === 0) {
      await fetchAllVocabularies()
    }
  }

  const handleSaveDay = async () => {
    if (!selectedDay) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/vocabulary-packs/${packId}/days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dayNumber: selectedDay.dayNumber, vocabularyIds: targetKeys })
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

  // Transfer 变化处理
  const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as string[])
  }

  // 过滤已被其他天使用的词汇
  const usedVocabIds = getUsedVocabIds()
  const availableVocabularies = allVocabularies.filter(v => !usedVocabIds.has(v.key))

  // 搜索过滤
  const filterOption = (inputValue: string, item: TransferItem) => {
    const search = inputValue.toLowerCase()
    return item.word.toLowerCase().includes(search) ||
           item.primaryMeaning.toLowerCase().includes(search)
  }

  // 自定义渲染项
  const renderItem = (item: TransferItem) => {
    return (
      <span title={`${item.word} - ${item.primaryMeaning}`}>
        <strong>{item.word}</strong>
        <span style={{ color: '#666', marginLeft: 8 }}>{item.primaryMeaning}</span>
        {item.isHighFrequency && <Tag color="orange" style={{ marginLeft: 4 }}>高频</Tag>}
      </span>
    )
  }

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
        width={900}
        okText="保存"
        styles={{ body: { padding: '24px 0' } }}
      >
        {loadingVocabs ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#666' }}>正在加载词汇列表...</p>
          </div>
        ) : (
          <Transfer
            dataSource={availableVocabularies}
            titles={[`可选词汇 (${availableVocabularies.length - targetKeys.length})`, `已选词汇 (${targetKeys.length})`]}
            targetKeys={targetKeys}
            onChange={handleTransferChange}
            render={renderItem}
            showSearch
            filterOption={filterOption}
            listStyle={{
              width: 380,
              height: 450,
            }}
            locale={{
              itemUnit: '词',
              itemsUnit: '词',
              searchPlaceholder: '搜索单词或释义...',
              notFoundContent: '无匹配词汇',
            }}
            oneWay={false}
            showSelectAll={true}
          />
        )}
        <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
          提示：点击词汇选中后，使用中间的箭头按钮移动；或双击词汇直接移动
        </div>
      </Modal>
    </div>
  )
}
