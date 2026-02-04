// ... imports unchanged
// Keep interfaces

// Transfer 相关状态 REMOVE
// Replace with:
const [leftVocabs, setLeftVocabs] = useState<any[]>([])
const [leftTotal, setLeftTotal] = useState(0)
const [leftPage, setLeftPage] = useState(1)
const [leftLoading, setLeftLoading] = useState(false)
const [keyword, setKeyword] = useState('')

// Right side (Selected)
const [selectedVocabs, setSelectedVocabs] = useState<any[]>([]) // Full objects

// ... existing batch states

// ... fetchPack unchanged

// Load Left Side (Server Pagination)
const fetchLeftVocabs = async (page = 1, search = '') => {
  setLeftLoading(true)
  try {
    const token = localStorage.getItem('token')
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

// ... render ...
return (
  <div>
    {/* ... header ... */}
    <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/vocabulary-packs')} style={{ marginBottom: 16 }}>返回列表</Button>
    {/* ... Card info ... */}
    <Card title={pack.name} extra={<Tag>{pack.isActive ? '启用' : '禁用'}</Tag>}><Row gutter={16}>...</Row></Card>

    <Card title="每日词汇配置" style={{ marginTop: 16 }}>
      <Table columns={dayColumns} dataSource={pack.pack_days} rowKey="id" pagination={false} />
    </Card>

    <Modal title={`配置 Day ${selectedDay?.dayNumber} 词汇`} open={modalVisible} onOk={handleSaveDay} onCancel={() => setModalVisible(false)} width={1000}>
      {/* Batch Input Area */}
      <div style={{ marginBottom: 20, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <div style={{ marginBottom: 8 }}>批量添加 (粘贴单词，自动识别)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea rows={2} value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder="apple, banana..." />
          <Button type="primary" onClick={handleBatchAdd} loading={loadingVocabs}>识别并添加</Button>
        </div>
        {batchResult && (
          <div style={{ fontSize: 12, marginTop: 8, color: batchResult.notFound.length ? 'red' : '#666' }}>
            识别 {batchResult.found} 个，成功添加 {batchResult.added} 个。
            {batchResult.notFound.length > 0 && ` 未找到: ${batchResult.notFound.join(', ')}`}
          </div>
        )}
      </div>

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
  </div>
)
}
