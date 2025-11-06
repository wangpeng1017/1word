'use client';

import React, { useState, useEffect } from 'react';
import { Button, List, Modal, Form, Input, message, Popconfirm, Card, Image, Space, Upload, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, PictureOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

interface WordImage {
  id: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
}

interface ImageManagerProps {
  vocabularyId: string;
  word?: string;
}

/**
 * 图片管理组件
 * 用于管理单词的实物图片
 */
export default function ImageManager({ vocabularyId, word }: ImageManagerProps) {
  const [images, setImages] = useState<WordImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingImage, setEditingImage] = useState<WordImage | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vocabularies/${vocabularyId}/images`);
      const data = await response.json();
      
      if (data.success) {
        setImages(data.data);
      } else {
        message.error('加载图片失败');
      }
    } catch (error) {
      console.error('加载图片失败:', error);
      message.error('加载图片失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [vocabularyId]);

  // 打开添加/编辑对话框
  const handleOpenModal = (image?: WordImage) => {
    if (image) {
      setEditingImage(image);
      form.setFieldsValue(image);
      setUploadMethod('url');
    } else {
      setEditingImage(null);
      form.resetFields();
      setUploadMethod('file');
      setFileList([]);
    }
    setModalVisible(true);
  };

  // 上传图片文件
  const handleUploadFile = async () => {
    if (fileList.length === 0) {
      message.error('请选择图片文件');
      return null;
    }

    const file = fileList[0].originFileObj;
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        message.success('文件上传成功');
        return data.data.url;
      } else {
        message.error(data.error || '上传失败');
        return null;
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 保存图片
  const handleSave = async () => {
    try {
      let values = await form.validateFields();
      
      // 如果是文件上传模式,先上传文件
      if (uploadMethod === 'file' && !editingImage) {
        const imageUrl = await handleUploadFile();
        if (!imageUrl) return;
        values.imageUrl = imageUrl;
      }
      
      const url = editingImage
        ? `/api/vocabularies/${vocabularyId}/images/${editingImage.id}`
        : `/api/vocabularies/${vocabularyId}/images`;
      
      const method = editingImage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(editingImage ? '更新成功' : '添加成功');
        setModalVisible(false);
        setFileList([]);
        loadImages();
      } else {
        message.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  // 删除图片
  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(
        `/api/vocabularies/${vocabularyId}/images/${imageId}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        message.success('删除成功');
        loadImages();
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
      title="实物图片"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          添加图片
        </Button>
      }
    >
      <List
        loading={loading}
        dataSource={images}
        locale={{ emptyText: '暂无图片' }}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
        renderItem={(image) => (
          <List.Item>
            <Card
              hoverable
              cover={
                <Image
                  alt={image.description || word || '单词图片'}
                  src={image.imageUrl}
                  height={200}
                  style={{ objectFit: 'cover' }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                />
              }
              actions={[
                <EditOutlined
                  key="edit"
                  onClick={() => handleOpenModal(image)}
                />,
                <Popconfirm
                  key="delete"
                  title="确定要删除这张图片吗?"
                  onConfirm={() => handleDelete(image.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <DeleteOutlined style={{ color: '#ff4d4f' }} />
                </Popconfirm>
              ]}
            >
              <Card.Meta
                avatar={<PictureOutlined />}
                title={word || '单词图片'}
                description={image.description || '无描述'}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingImage ? '编辑图片' : '添加图片'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          setFileList([]);
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={uploading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {!editingImage && (
            <Form.Item label="上传方式">
              <Radio.Group
                value={uploadMethod}
                onChange={(e) => setUploadMethod(e.target.value)}
              >
                <Radio.Button value="file">
                  <UploadOutlined /> 上传文件
                </Radio.Button>
                <Radio.Button value="url">
                  <LinkOutlined /> 输入URL
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          {uploadMethod === 'file' && !editingImage ? (
            <Form.Item
              label="选择图片文件"
              required
              extra="支持 JPG, PNG, GIF, WEBP 格式,最大10MB"
            >
              <Upload
                accept="image/*"
                maxCount={1}
                fileList={fileList}
                listType="picture-card"
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
              >
                {fileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>选择图片</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          ) : (
            <Form.Item
              label="图片URL"
              name="imageUrl"
              rules={[
                { required: true, message: '请输入图片URL' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
              extra="支持jpg, png, gif等格式"
            >
              <Input placeholder="https://example.com/image.jpg" />
            </Form.Item>
          )}

          <Form.Item
            label="图片描述"
            name="description"
            extra="可选，用于辅助说明图片内容"
          >
            <Input.TextArea
              placeholder="描述这张图片..."
              rows={3}
            />
          </Form.Item>

          {form.getFieldValue('imageUrl') && (
            <Form.Item label="预览">
              <Image
                src={form.getFieldValue('imageUrl')}
                alt="图片预览"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
