'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Button, message, Divider, Space, Tag } from 'antd'
import { SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'

export default function SettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      
      if (result.success) {
        const settings = result.data
        
        // 设置表单值
        form.setFieldsValue({
          // 复习规则
          masteryThreshold: settings.reviewRules?.masteryThreshold || 3,
          difficultThreshold: settings.reviewRules?.difficultThreshold || 3,
          dailyNewWords: settings.reviewRules?.dailyNewWords || 20,
          dailyReviewWords: settings.reviewRules?.dailyReviewWords || 30,
          interruptHours: settings.reviewRules?.interruptHours || 24,
          
          // 系统信息
          systemName: settings.systemInfo?.systemName || '智能词汇复习助手',
          defaultPassword: settings.systemInfo?.defaultPassword || '123456',
        })
      }
    } catch (error) {
      message.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const token = localStorage.getItem('token')
      
      // 构建设置对象
      const settings = {
        reviewRules: {
          masteryThreshold: values.masteryThreshold,
          difficultThreshold: values.difficultThreshold,
          dailyNewWords: values.dailyNewWords,
          dailyReviewWords: values.dailyReviewWords,
          interruptHours: values.interruptHours,
        },
        systemInfo: {
          systemName: values.systemName,
          version: 'v1.0.0',
          defaultPassword: values.defaultPassword,
        },
      }

      const response = await fetch('/api/settings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      })

      const result = await response.json()
      if (result.success) {
        message.success('设置已保存')
      } else {
        message.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    loadSettings()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </h1>
        <p style={{ color: '#6B7280' }}>配置复习规则和系统参数</p>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {/* 复习规则设置 */}
          <div>
            <Divider orientation="left">
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>复习规则配置</span>
                <Tag color="blue">核心参数</Tag>
              </Space>
            </Divider>

            <div style={{ 
              background: '#f5f7fa', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Form.Item
                label="掌握判定标准"
                name="masteryThreshold"
                tooltip="连续正确多少次后判定为已掌握"
                rules={[{ required: true, message: '请输入掌握判定标准' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  addonAfter="次连续正确"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="难点判定标准"
                name="difficultThreshold"
                tooltip="累计错误多少次后标记为重点难点"
                rules={[{ required: true, message: '请输入难点判定标准' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  addonAfter="次累计错误"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="每日新词数量"
                name="dailyNewWords"
                tooltip="每天新学习的单词数量"
                rules={[{ required: true, message: '请输入每日新词数量' }]}
              >
                <InputNumber
                  min={5}
                  max={100}
                  addonAfter="个单词/天"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="每日复习词数量"
                name="dailyReviewWords"
                tooltip="每天复习的单词数量"
                rules={[{ required: true, message: '请输入每日复习词数量' }]}
              >
                <InputNumber
                  min={10}
                  max={200}
                  addonAfter="个单词/天"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="中断判定时长"
                name="interruptHours"
                tooltip="超过多少小时未完成学习任务视为中断"
                rules={[{ required: true, message: '请输入中断判定时长' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={1}
                  max={72}
                  addonAfter="小时"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>

          {/* 系统信息设置 */}
          <div>
            <Divider orientation="left">
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>系统信息</span>
                <Tag color="green">基本信息</Tag>
              </Space>
            </Divider>

            <div style={{ 
              background: '#f5f7fa', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Form.Item
                label="系统名称"
                name="systemName"
                rules={[{ required: true, message: '请输入系统名称' }]}
              >
                <Input placeholder="例如: 智能词汇复习助手" />
              </Form.Item>

              <Form.Item
                label="默认密码"
                name="defaultPassword"
                tooltip="新建学生账号时的默认密码"
                rules={[{ required: true, message: '请输入默认密码' }]}
                style={{ marginBottom: 0 }}
              >
                <Input.Password placeholder="例如: 123456" />
              </Form.Item>
            </div>
          </div>

          {/* 操作按钮 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                htmlType="submit"
              >
                保存设置
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 说明卡片 */}
      <Card 
        title="配置说明" 
        style={{ marginTop: 16 }}
        size="small"
      >
        <div style={{ lineHeight: 1.8, color: '#666' }}>
          <p><strong>复习规则说明：</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>掌握判定：学生连续答对N次后，该单词会从复习队列中移除</li>
            <li>难点判定：累计错误N次后，单词会被标记为难点，增加复习频率</li>
            <li>每日新词：建议根据学生能力设置，一般为10-30个</li>
            <li>每日复习：建议设置为新词数量的1.5-2倍</li>
            <li>中断时长：超过设定时长未完成的任务会被标记为中断</li>
          </ul>
          
          <p style={{ marginTop: 16 }}><strong>注意事项：</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>修改复习规则后，只对新的学习计划生效</li>
            <li>已有的学习记录和掌握度不会受影响</li>
            <li>建议在学期开始前设置好参数，避免频繁调整</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
