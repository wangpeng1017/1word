'use client'

import { useState, useRef } from 'react'
import { Button, Modal, Spin, message, Radio, Space } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'

interface PdfExportProps {
    title: string
    data: Array<{
        word: string
        meaning: string
        wrongCount?: number
        wrongAnswer?: string
        correctAnswer?: string
        wrongAt?: string
    }>
    studentName?: string
    className?: string
}

export default function PdfExport({ title, data, studentName, className }: PdfExportProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [sortBy, setSortBy] = useState<'word' | 'wrongCount'>('wrongCount')
    const [showModal, setShowModal] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const handleExport = async () => {
        if (data.length === 0) {
            message.warning('没有数据可导出')
            return
        }

        setIsExporting(true)

        try {
            // 动态导入 html2pdf.js（仅在客户端）
            const html2pdf = (await import('html2pdf.js')).default

            // 排序数据
            const sortedData = [...data].sort((a, b) => {
                if (sortBy === 'word') {
                    return a.word.localeCompare(b.word)
                }
                return (b.wrongCount || 0) - (a.wrongCount || 0)
            })

            // 创建PDF内容
            const content = document.createElement('div')
            content.innerHTML = `
                <div style="font-family: 'Microsoft YaHei', sans-serif; padding: 20px;">
                    <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">${title}</h1>
                    ${studentName ? `<p style="text-align: center; color: #666; margin: 5px 0;">学生：${studentName}</p>` : ''}
                    ${className ? `<p style="text-align: center; color: #666; margin: 5px 0;">班级：${className}</p>` : ''}
                    <p style="text-align: center; color: #999; font-size: 12px; margin-bottom: 20px;">生成日期：${new Date().toLocaleDateString('zh-CN')}</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; width: 60px;">序号</th>
                                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left;">单词</th>
                                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left;">正确释义</th>
                                ${data[0]?.wrongCount !== undefined ? '<th style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; width: 80px;">错误次数</th>' : ''}
                                ${data[0]?.wrongAnswer !== undefined ? '<th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left;">错误答案</th>' : ''}
                                ${data[0]?.correctAnswer !== undefined ? '<th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left;">正确答案</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedData.map((item, index) => `
                                <tr style="background: ${index % 2 === 0 ? '#fff' : '#fafafa'};">
                                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${index + 1}</td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 500;">${item.word}</td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.meaning}</td>
                                    ${item.wrongCount !== undefined ? `<td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${item.wrongCount > 3 ? '#ef4444' : '#f59e0b'};">${item.wrongCount}</td>` : ''}
                                    ${item.wrongAnswer !== undefined ? `<td style="border: 1px solid #e5e7eb; padding: 8px; color: #ef4444;">${item.wrongAnswer}</td>` : ''}
                                    ${item.correctAnswer !== undefined ? `<td style="border: 1px solid #e5e7eb; padding: 8px; color: #22c55e;">${item.correctAnswer}</td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                        共 ${sortedData.length} 个单词 | 智能词汇复习系统
                    </p>
                </div>
            `

            const opt = {
                margin: 10,
                filename: `${title}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            }

            await html2pdf().set(opt).from(content).save()
            message.success('PDF导出成功')
            setShowModal(false)
        } catch (error) {
            console.error('PDF导出失败:', error)
            message.error('PDF导出失败，请重试')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <>
            <Button
                icon={<FilePdfOutlined />}
                onClick={() => setShowModal(true)}
            >
                导出PDF
            </Button>

            <Modal
                title="导出PDF设置"
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowModal(false)}>
                        取消
                    </Button>,
                    <Button
                        key="export"
                        type="primary"
                        onClick={handleExport}
                        loading={isExporting}
                        icon={<FilePdfOutlined />}
                    >
                        {isExporting ? '生成中...' : '导出PDF'}
                    </Button>
                ]}
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ marginRight: 12 }}>排序方式：</span>
                        <Radio.Group value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <Radio value="wrongCount">按错误次数（降序）</Radio>
                            <Radio value="word">按单词字母顺序</Radio>
                        </Radio.Group>
                    </div>
                    <div style={{ color: '#666', fontSize: 13 }}>
                        <p>• 将导出 {data.length} 条记录</p>
                        <p>• 文件格式：PDF (A4)</p>
                        <p>• 导出内容：单词、释义、错误次数等</p>
                    </div>
                </div>
            </Modal>
        </>
    )
}
