'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Button, Divider, Space, Tag, Upload, Image, Modal, Row, Col, App } from 'antd'
import { SaveOutlined, DeleteOutlined, PlusOutlined, LockOutlined, EyeOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

export default function BasicSettings() {
  const { modal, message } = App.useApp()
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qrcodeUrl, setQrcodeUrl] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

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

        form.setFieldsValue({
          interruptTimeout: settings.studyConfig?.interruptTimeout || 10,
        })

        // 加载客服二维码
        if (settings.customerService?.qrcodeUrl) {
          setQrcodeUrl(settings.customerService.qrcodeUrl)
        }
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

      const settings = {
        studyConfig: {
          interruptTimeout: values.interruptTimeout,
        },
        customerService: {
          qrcodeUrl: qrcodeUrl,
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
        modal.success({ title: '保存成功', content: '系统设置已保存' })
      } else {
        modal.error({ title: '保存失败', content: result.error || '保存失败，请重试' })
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      modal.error({ title: '保存失败', content: '网络错误，请重试' })
    } finally {
      setSaving(false)
    }
  }

  // 处理二维码上传
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file as File)
      formData.append('type', 'qrcode')

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.data?.url) {
        setQrcodeUrl(result.data.url)
        message.success('二维码上传成功')
        onSuccess?.(result)
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error: any) {
      message.error(error.message || '上传失败')
      onError?.(error)
    } finally {
      setUploading(false)
    }
  }

  // 删除二维码
  const handleDeleteQrcode = () => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除客服二维码吗？删除后学生将无法看到联系客服按钮。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setQrcodeUrl('')
        message.success('二维码已删除，请点击"保存设置"生效')
      },
    })
  }

  // 预览二维码
  const handlePreview = () => {
    setPreviewOpen(true)
  }

  // 更改密码
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      setChangingPassword(true)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()
      if (result.success) {
        message.success('密码修改成功')
        setPasswordModalVisible(false)
        passwordForm.resetFields()
      } else {
        message.error(result.error || '密码修改失败')
      }
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误，不需要额外提示
        return
      }
      message.error('密码修改失败')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {/* 账号安全 */}
          <div>
            <Divider orientation="left">
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>账号安全</span>
                <Tag color="red">密码管理</Tag>
              </Space>
            </Divider>

            <div style={{
              background: '#f5f7fa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <div>
                    <span style={{ fontWeight: 500 }}>登录密码</span>
                    <p style={{ color: '#666', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                      定期更换密码可以提高账号安全性
                    </p>
                  </div>
                </Col>
                <Col>
                  <Button
                    icon={<LockOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                  >
                    修改密码
                  </Button>
                </Col>
              </Row>
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

          {/* 客服设置 */}
          <div>
            <Divider orientation="left">
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>客服设置</span>
                <Tag color="orange">联系方式</Tag>
              </Space>
            </Divider>

            <div style={{
              background: '#f5f7fa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Form.Item
                label="客服微信二维码"
                tooltip="上传客服微信二维码，学生可在登录页扫码添加客服"
                style={{ marginBottom: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {qrcodeUrl ? (
                    <div>
                      <Image
                        src={qrcodeUrl}
                        alt="客服二维码"
                        width={120}
                        height={120}
                        style={{ borderRadius: 8, border: '1px solid #d9d9d9', display: 'block' }}
                        preview={false}
                      />
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <Button size="small" icon={<EyeOutlined />} onClick={handlePreview}>预览</Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleDeleteQrcode}
                        >
                          删除
                        </Button>
                      </div>
                      {/* 隐藏的 Image 组件用于预览功能 */}
                      <Image
                        src={qrcodeUrl}
                        style={{ display: "none" }}
                        preview={{
                          visible: previewOpen,
                          onVisibleChange: setPreviewOpen,
                        }}
                      />
                    </div>
                  ) : (
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={handleUpload}
                    >
                      <div style={{
                        width: 120,
                        height: 120,
                        border: '1px dashed #d9d9d9',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#fafafa',
                      }}>
                        {uploading ? (
                          <span>上传中...</span>
                        ) : (
                          <>
                            <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                            <span style={{ marginTop: 8, color: '#666', fontSize: 12 }}>上传二维码</span>
                          </>
                        )}
                      </div>
                    </Upload>
                  )}
                  <div style={{ color: '#666', fontSize: 12, lineHeight: 1.8 }}>
                    <p>• 支持 JPG、PNG 格式</p>
                    <p>• 建议尺寸 300x300 像素以上</p>
                    <p>• 上传后学生可在登录页看到"联系客服"按钮</p>
                    <p>• 删除二维码后按钮将隐藏</p>
                  </div>
                </div>
              </Form.Item>
            </div>
          </div>

          {/* 操作按钮 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} htmlType="submit">保存设置</Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        title={
          <Space>
            <LockOutlined />
            <span>修改密码</span>
          </Space>
        }
        open={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        confirmLoading={changingPassword}
        okText="确认修改"
        cancelText="取消"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 复习规则说明卡片 */}
      <Card
        title="复习规则说明"
        style={{ marginTop: 16 }}
        size="small"
      >
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
    </>
  )
}
