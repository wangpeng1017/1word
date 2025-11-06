'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button, Tag, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined, ReloadOutlined } from '@ant-design/icons';

interface AudioPlayerProps {
  audioUrl: string;
  accent?: 'US' | 'UK';
  word?: string;
  size?: 'small' | 'middle' | 'large';
  showAccent?: boolean;
}

/**
 * 构建完整的音频URL
 * 处理各种URL格式
 */
function buildFullAudioUrl(audioUrl: string): string {
  if (!audioUrl) return '';
  
  // 如果已经是完整的URL，直接返回
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  
  // 处理相对路径，构建完整URL
  // thousandlemons项目的音频通常托管在这里
  const baseUrl = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford';
  return `${baseUrl}/${audioUrl}`;
}

/**
 * 音频播放器组件
 * 用于播放单词发音
 */
export default function AudioPlayer({
  audioUrl,
  accent = 'US',
  word,
  size = 'middle',
  showAccent = true
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [fullAudioUrl, setFullAudioUrl] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // 初始化完整的音频URL
  useEffect(() => {
    const url = buildFullAudioUrl(audioUrl);
    setFullAudioUrl(url);
    setError(false);
    setRetryCount(0);
  }, [audioUrl]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // 重置错误状态
        if (error) {
          setError(false);
          // 强制重新加载音频
          audioRef.current.load();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('播放失败:', err, '音频URL:', fullAudioUrl);
      setError(true);
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleError = (e: any) => {
    console.error('音频加载错误:', {
      word,
      audioUrl: fullAudioUrl,
      error: e,
      audioState: audioRef.current?.readyState,
      networkState: audioRef.current?.networkState
    });
    setError(true);
    setIsPlaying(false);
  };

  const handleRetry = () => {
    setError(false);
    setRetryCount(prev => prev + 1);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  // 如果没有音频URL
  if (!audioUrl || !fullAudioUrl) {
    return (
      <Tooltip title="暂无音频">
        <Tag color="default">
          <SoundOutlined /> 无音频
        </Tag>
      </Tooltip>
    );
  }

  if (error) {
    return (
      <Tooltip title={`音频加载失败: ${fullAudioUrl}`}>
        <Space size="small">
          <Tag color="error">
            <SoundOutlined /> 加载失败
          </Tag>
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleRetry}
          >
            重试
          </Button>
        </Space>
      </Tooltip>
    );
  }

  return (
    <Space size="small">
      <audio
        ref={audioRef}
        src={fullAudioUrl}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <Button
        type="text"
        size={size}
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={handlePlay}
        title={word ? `播放 "${word}" 的发音` : '播放发音'}
      >
        {word && size !== 'small' && word}
      </Button>

      {showAccent && (
        <Tag color={accent === 'US' ? 'blue' : 'green'}>
          {accent === 'US' ? '美式' : '英式'}
        </Tag>
      )}
    </Space>
  );
}
