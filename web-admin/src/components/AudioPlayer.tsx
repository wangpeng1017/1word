'use client';

import React, { useRef, useState } from 'react';
import { Button, Tag, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined } from '@ant-design/icons';

interface AudioPlayerProps {
  audioUrl: string;
  accent?: 'US' | 'UK';
  word?: string;
  size?: 'small' | 'middle' | 'large';
  showAccent?: boolean;
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

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('播放失败:', err);
      setError(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setError(true);
    setIsPlaying(false);
  };

  if (error) {
    return (
      <Tooltip title="音频加载失败">
        <Tag color="error">
          <SoundOutlined /> 加载失败
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Space size="small">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
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
