import React, { useRef, useEffect, useState } from 'react';
import { useAudio } from '@/contexts/AudioContext';

interface ReactiveLogoProps {
  className?: string;
  text?: string;
  color?: string;
  glowColor?: string;
  fontSize?: number;
  sensitivity?: number;
  audioData?: Uint8Array;
}

export function ReactiveLogo({
  className = '',
  text = 'STONKS DEX SHOP',
  color = '#00ffcc',
  glowColor = '#00ffcc',
  fontSize = 32,
  sensitivity = 0.6,
  audioData
}: ReactiveLogoProps) {
  const { beatIntensity } = useAudio();
  const [glow, setGlow] = useState(10);
  const [scale, setScale] = useState(1);
  
  // 根据音频数据更新视觉效果
  useEffect(() => {
    if (!audioData) return;
    
    // 计算平均值作为强度参数
    const avgValue = Array.from(audioData).reduce((sum, value) => sum + value, 0) / audioData.length;
    const normalizedValue = avgValue / 255;
    
    // 计算适当的发光值
    const newGlow = 5 + (normalizedValue * 25 * sensitivity);
    // 计算适当的缩放值，使其更加微妙
    const newScale = 1 + (normalizedValue * 0.05 * sensitivity);
    
    setGlow(newGlow);
    setScale(newScale);
  }, [audioData, sensitivity]);
  
  // 当没有音频数据时，使用节拍强度
  useEffect(() => {
    if (audioData) return;
    
    // 使用节拍强度作为备用
    const newGlow = 5 + (beatIntensity * 25);
    const newScale = 1 + (beatIntensity * 0.08);
    
    setGlow(newGlow);
    setScale(newScale);
  }, [beatIntensity, audioData]);
  
  return (
    <div className={`reactive-logo ${className} text-center`}>
      <h1
        className="font-bold"
        style={{
          color: color,
          fontSize: `${fontSize}px`,
          textShadow: `0 0 ${glow}px ${glowColor}`,
          transform: `scale(${scale})`,
          transition: 'text-shadow 100ms ease, transform 100ms ease',
          whiteSpace: 'nowrap'
        }}
      >
        {text}
      </h1>
    </div>
  );
}

// 创建一个包装波形图的组件，将数据传递给Logo
export function ReactiveWaveform({
  className = '',
  height = 120,
  color = '#00ffcc',
  logoText = 'STONKS DEX SHOP',
  logoClassName = '',
}) {
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  
  // 处理音频可视化数据
  const handleVisualizationData = (data: Uint8Array) => {
    setAudioData(data);
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Logo组件放在顶部，接收相同的音频数据 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center py-4">
        <ReactiveLogo 
          text={logoText}
          audioData={audioData}
          className={logoClassName}
        />
      </div>
      
      {/* 波形可视化器 */}
      <MusicVisualizer
        height={height}
        color={color}
        sensitivity={2.5}
        onVisualizationData={handleVisualizationData}
      />
    </div>
  );
}

// 导入MusicVisualizer组件避免TypeScript错误
import MusicVisualizer from './music-visualizer';