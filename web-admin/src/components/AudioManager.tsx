'use client';

import React, { useState, useEffect } from 'react';
import { Button, List, Space, Modal, Form, Input, Select, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import AudioPlayer from './AudioPlayer';

interface Audio {
  id: string;
  audioUrl: string;
  accent: 'US' | 'UK';
  duration: number | null;
  createdAt: string;
}

interface AudioManagerProps {
  vocabularyId: string;
  word?: string;
}

/**
 * 音频管理组件
 * 用于管理单词的音频文件
 */
export default function AudioManager({ vocabularyId, word }: AudioManagerProps) {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAudio, setEditingAudio] = useState<Audio | null>(null);
  const [form] = Form.useForm();

  // 加载音频列表
  const loadAudios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vocabularies/${vocabularyId}/audios`);
      const data = await response.json();
      
      if (data.success) {
        setAudios(data.data);
      } else {
        message.error('加载音频失败');
      }
    } catch (error) {
      console.error('加载音频失败:', error);
      message.error('加载音频失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudios();
  }, [vocabularyId]);

  // 打开添加/编辑对话框
  const handleOpenModal = (audio?: Audio) => {
    if (audio) {
      setEditingAudio(audio);
      form.setFieldsValue(audio);
    } else {
      setEditingAudio(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 保存音频
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const url = editingAudio
        ? `/api/vocabularies/${vocabularyId}/audios/${editingAudio.id}`
        : `/api/vocabularies/${vocabularyId}/audios`;
      
      const method = editingAudio ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(editingAudio ? '更新成功' : '添加成功');
        setModalVisible(false);
        loadAudios();
      } else {
        message.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  // 删除音频
  const handleDelete = async (audioId: string) => {
    try {
      const response = await fetch(
        `/api/vocabularies/${vocabularyId}/audios/${audioId}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        message.success('删除成功');
        loadAudios();
      } else {
        message.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  return (
    <Card
      title="发音音频"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          添加音频
        </Button>
      }
    >
      <List
        loading={loading}
        dataSource={audios}
        locale={{ emptyText: '暂无音频' }}
        renderItem={(audio) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(audio)}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确定要删除这个音频吗?"
                onConfirm={() => handleDelete(audio.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            ]}
          >
            <Space>
              <AudioPlayer
                audioUrl={audio.audioUrl}
                accent={audio.accent}
                word={word}
                showAccent={true}
              />
              {audio.duration && <span>({audio.duration}秒)</span>}
            </Space>
          </List.Item>
        )}
      />

      <Modal
        title={editingAudio ? '编辑音频' : '添加音频'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ accent: 'US' }}
        >
          <Form.Item
            label="音频URL"
            name="audioUrl"
            rules={[{ required: true, message: '请输入音频URL' }]}
          >
            <Input placeholder="https://example.com/audio.mp3" />
          </Form.Item>

          <Form.Item
            label="口音"
            name="accent"
            rules={[{ required: true, message: '请选择口音' }]}
          >
            <Select>
              <Select.Option value="US">美式</Select.Option>
              <Select.Option value="UK">英式</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="时长（秒）"
            name="duration"
          >
            <Input type="number" placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
