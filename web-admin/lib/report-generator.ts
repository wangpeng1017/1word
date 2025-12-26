import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, HeadingLevel, WidthType, VerticalAlign } from 'docx'
import fs from 'fs'
import path from 'path'

export interface ReportData {
    student: {
        name: string
        studentNo: string
        className?: string
    }
    period: {
        startDate: string
        endDate: string
    }
    overview: {
        totalQuestions: number
        correctCount: number
        wrongCount: number
        accuracy: number
        totalTimeSeconds: number
    }
    partOfSpeechStats: Record<string, number>
    topWrongWords: Array<{
        word: string
        meaning: string
        wrongCount: number
        partOfSpeech: string
    }>
}

/**
 * 生成PDF报告
 */
export async function generatePDFReport(data: ReportData, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 })
            const stream = fs.createWriteStream(filepath)
            doc.pipe(stream)

            // 配置中文字体 - 使用Windows系统字体
            const chineseFontPaths = [
                'C:\\\\Windows\\\\Fonts\\\\msyh.ttc',    // 微软雅黑
                'C:\\\\Windows\\\\Fonts\\\\simsun.ttc',  // 宋体
                'C:\\\\Windows\\\\Fonts\\\\simhei.ttf',  // 黑体
            ]

            let fontConfigured = false
            for (const fontPath of chineseFontPaths) {
                if (fs.existsSync(fontPath)) {
                    try {
                        doc.font(fontPath)
                        fontConfigured = true
                        console.log(`✓ PDF使用中文字体: ${fontPath}`)
                        break
                    } catch (e) {
                        console.warn(`无法加载字体 ${fontPath}`)
                    }
                }
            }

            if (!fontConfigured) {
                console.warn('⚠ 未找到中文字体，使用默认字体（可能无法正确显示中文）')
            }

            // 标题
            doc.fontSize(24).text('学习统计报告', { align: 'center' })
            doc.moveDown(1.5)

            // 学生信息
            doc.fontSize(12)
            doc.text(`学生姓名: ${data.student.name}`)
            doc.text(`学号: ${data.student.studentNo}`)
            if (data.student.className) {
                doc.text(`班级: ${data.student.className}`)
            }
            doc.text(`统计周期: ${data.period.startDate} 至 ${data.period.endDate}`)
            doc.moveDown(1)

            // 分隔线
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
            doc.moveDown(1)

            // 一、学习概况
            doc.fontSize(16).text('一、学习概况')
            doc.fontSize(12).moveDown(0.5)

            const { overview } = data
            const timeMinutes = Math.floor(overview.totalTimeSeconds / 60)
            const timeSeconds = overview.totalTimeSeconds % 60
            const timeString = `${timeMinutes}分${timeSeconds}秒`

            doc.text(`总题数: ${overview.totalQuestions}`)
            doc.text(`正确数: ${overview.correctCount}`)
            doc.text(`错误数: ${overview.wrongCount}`)
            doc.text(`正确率: ${overview.accuracy}%`, { continued: true })
            doc.fillColor(overview.accuracy >= 80 ? 'green' : overview.accuracy >= 60 ? 'orange' : 'red')
                .text(` ${overview.accuracy >= 80 ? '(优秀)' : overview.accuracy >= 60 ? '(良好)' : '(需加强)'}`)
            doc.fillColor('black')
            doc.text(`累计用时: ${timeString}`)
            doc.moveDown(1)

            // 二、错题词性分布
            doc.fontSize(16).text('二、错题词性分布')
            doc.fontSize(12).moveDown(0.5)

            const posEntries = Object.entries(data.partOfSpeechStats).sort((a, b) => b[1] - a[1])
            if (posEntries.length > 0) {
                posEntries.forEach(([pos, count]) => {
                    doc.text(`${getPosName(pos)}: ${count}次`)
                })
            } else {
                doc.text('暂无错题数据')
            }
            doc.moveDown(1)

            // 三、高频错词列表
            doc.fontSize(16).text('三、高频错词列表 (Top 10)')
            doc.fontSize(12).moveDown(0.5)

            if (data.topWrongWords.length > 0) {
                data.topWrongWords.forEach((item, index) => {
                    doc.text(`${index + 1}. ${item.word} (${getPosName(item.partOfSpeech)}) - ${item.meaning}`, {
                        continued: true,
                    })
                    doc.fillColor('red').text(` (错误${item.wrongCount}次)`)
                    doc.fillColor('black')
                })
            } else {
                doc.text('暂无错题记录')
            }
            doc.moveDown(1)

            // 页脚
            doc.fontSize(10).fillColor('gray')
                .text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 50, doc.page.height - 50, {
                    align: 'center',
                })

            doc.end()
            stream.on('finish', () => resolve())
            stream.on('error', reject)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * 生成Word报告
 */
export async function generateWordReport(data: ReportData, filepath: string): Promise<void> {
    const { overview } = data
    const timeMinutes = Math.floor(overview.totalTimeSeconds / 60)
    const timeSeconds = overview.totalTimeSeconds % 60
    const timeString = `${timeMinutes}分${timeSeconds}秒`

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: '学习统计报告',
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: '学生姓名: ', bold: true }),
                            new TextRun(data.student.name),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: '学号: ', bold: true }),
                            new TextRun(data.student.studentNo),
                        ],
                    }),
                    ...(data.student.className
                        ? [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: '班级: ', bold: true }),
                                    new TextRun(data.student.className),
                                ],
                            }),
                        ]
                        : []),
                    new Paragraph({
                        children: [
                            new TextRun({ text: '统计周期: ', bold: true }),
                            new TextRun(`${data.period.startDate} 至 ${data.period.endDate}`),
                        ],
                        spacing: { after: 200 },
                    }),

                    new Paragraph({
                        text: '一、学习概况',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 100 },
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: '统计项', alignment: AlignmentType.CENTER })],
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '数值', alignment: AlignmentType.CENTER })],
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                ],
                            }),
                            createTableRow('总题数', overview.totalQuestions.toString()),
                            createTableRow('正确数', overview.correctCount.toString()),
                            createTableRow('错误数', overview.wrongCount.toString()),
                            createTableRow('正确率', `${overview.accuracy}%`),
                            createTableRow('累计用时', timeString),
                        ],
                    }),

                    new Paragraph({
                        text: '二、错题词性分布',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 100 },
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: '词性', alignment: AlignmentType.CENTER })],
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '错误次数', alignment: AlignmentType.CENTER })],
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                ],
                            }),
                            ...Object.entries(data.partOfSpeechStats)
                                .sort((a, b) => b[1] - a[1])
                                .map(([pos, count]) => createTableRow(getPosName(pos), `${count}次`)),
                        ],
                    }),

                    new Paragraph({
                        text: '三、高频错词列表',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 100 },
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: '排名', alignment: AlignmentType.CENTER })],
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '单词', alignment: AlignmentType.CENTER })],
                                        width: { size: 25, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '词性', alignment: AlignmentType.CENTER })],
                                        width: { size: 15, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '释义', alignment: AlignmentType.CENTER })],
                                        width: { size: 35, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '错误次数', alignment: AlignmentType.CENTER })],
                                        width: { size: 15, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.CENTER,
                                        shading: { fill: 'EEEEEE' },
                                    }),
                                ],
                            }),
                            ...data.topWrongWords.map((item, index) =>
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                                            verticalAlign: VerticalAlign.CENTER,
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: item.word })],
                                            verticalAlign: VerticalAlign.CENTER,
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: getPosName(item.partOfSpeech), alignment: AlignmentType.CENTER })],
                                            verticalAlign: VerticalAlign.CENTER,
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: item.meaning })],
                                            verticalAlign: VerticalAlign.CENTER,
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: `${item.wrongCount}次`, alignment: AlignmentType.CENTER })],
                                            verticalAlign: VerticalAlign.CENTER,
                                        }),
                                    ],
                                })
                            ),
                        ],
                    }),

                    new Paragraph({
                        text: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                    }),
                ],
            },
        ],
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(filepath, buffer)
}

function createTableRow(label: string, value: string): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph(label)],
                verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
                children: [new Paragraph(value)],
                verticalAlign: VerticalAlign.CENTER,
            }),
        ],
    })
}

function getPosName(pos: string): string {
    const posMap: Record<string, string> = {
        'n.': '名词',
        'v.': '动词',
        'adj.': '形容词',
        'adv.': '副词',
        'prep.': '介词',
        'conj.': '连词',
        'pron.': '代词',
        'interj.': '感叹词',
        'art.': '冠词',
        'unknown': '未知',
    }
    return posMap[pos] || pos
}

export function ensureExportDir(): string {
    // 在Vercel等无服务器环境中，只有/tmp目录是可写的
    const exportDir = path.join('/tmp', 'exports')
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true })
    }
    return exportDir
}

export function generateFileName(studentId: string, format: 'pdf' | 'word'): string {
    const timestamp = Date.now()
    const ext = format === 'pdf' ? 'pdf' : 'docx'
    return `report_${studentId}_${timestamp}.${ext}`
}
