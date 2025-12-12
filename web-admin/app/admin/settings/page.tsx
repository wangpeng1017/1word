'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Button, message, Divider, Space, Tag, Alert } from 'antd'
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
          systemName: settings.systemInfo?.systemName || '智能词汇复习助手',
          defaultPassword: settings.systemInfo?.defaultPassword || '123456',
          interruptTimeout: settings.studyConfig?.interruptTimeout || 10,
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
        systemInfo: {
          systemName: values.systemName,
          version: 'v1.0.0',
          defaultPassword: values.defaultPassword,
        },
        studyConfig: {
          interruptTimeout: values.interruptTimeout,
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
        <p style={{ color: '#6B7280' }}>配置系统基本参数</p>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
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

          {/* 学习配置 */}
          <div>
            <Divider orientation="left">
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>学习配置</span>
                <Tag color="blue">复习规则</Tag>
              </Space>
            </Divider>

            <div style={{
              background: '#f5f7fa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Form.Item
                label="中断超时时间（分钟）"
                name="interruptTimeout"
                tooltip="学生开始复习后，超过该时间未完成将自动标记为【中断】"
                rules={[{ required: true, message: '请输入超时时间' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={1}
                  max={1440}
                  placeholder="10"
                  style={{ width: 200 }}
                  addonAfter="分钟"
                />
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

      {/* 复习规则说明卡片 */}
      <Card
        title="复习规则说明"
        style={{ marginTop: 16 }}
        size="small"
      >
        <Alert
          message="以下规则为系统内置，无需配置"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ lineHeight: 1.8, color: '#666' }}>
          <p><strong>艾宾浩斯复习间隔：</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>严格按记忆曲线：1天 → 2天 → 4天 → 7天 → 15天</li>
          </ul>

          <p style={{ marginTop: 16 }}><strong>掌握与难点判定：</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>掌握判定：最近3次答题全部正确，标记为已掌握</li>
            <li>难点判定：累计错误≥3次，标记为重点难点</li>
          </ul>

          <p style={{ marginTop: 16 }}><strong>中断检测：</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>学生开始复习后，超过设定时间未完成，自动标记为"中断"</li>
            <li>中断的任务会在【学习数据】中显示，学生可选择继续复习</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
