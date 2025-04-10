import React, { useRef, useEffect, useState } from 'react';
import { useAudio } from '@/contexts/AudioContext';

interface MusicVisualizerProps {
  className?: string;
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  barCount?: number;
  sensitivity?: number;
  onVisualizationData?: (data: Uint8Array) => void; // 回调函数传递可视化数据
}

export default function MusicVisualizer({
  className = '',
  color = '#00ffcc',
  height = 120,
  barWidth = 4,
  gap = 1,
  barCount = 60,
  sensitivity = 2.5, // 增加默认灵敏度
  onVisualizationData
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, beatIntensity, audioRef } = useAudio();
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // 初始化音频分析器
  useEffect(() => {
    if (!audioRef.current) return;
    
    // 创建音频上下文和分析器
    if (!audioContextRef.current && window.AudioContext) {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // 较小的FFT大小使得计算更快速
        
        // 配置分析器
        analyserRef.current.smoothingTimeConstant = 0.7; // 平滑过渡
        analyserRef.current.minDecibels = -70;
        analyserRef.current.maxDecibels = -30;
        
        // 创建媒体元素源
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        
        // 连接节点
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        // 创建数据数组
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      } catch (error) {
        console.error("创建音频分析器失败:", error);
      }
    }
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioRef]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = (barWidth + gap) * barCount - gap;
    canvas.height = height;
    
    // 获取实时频率数据
    const getAudioData = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        return generateFallbackData();
      }
      
      // 获取频率数据
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // 将数据重新采样到所需的条数
      const sampledData = new Uint8Array(barCount);
      const frequencyBinCount = analyserRef.current.frequencyBinCount;
      
      // 使用对数缩放来更好地表示低频区域
      for (let i = 0; i < barCount; i++) {
        // 对数缩放，更好地表示人耳感知的频率范围
        const index = Math.floor(Math.pow(i / barCount, 1.5) * frequencyBinCount);
        sampledData[i] = dataArrayRef.current[index] || 0;
      }
      
      // 调用回调函数，传递可视化数据
      if (onVisualizationData) {
        onVisualizationData(sampledData);
      }
      
      return sampledData;
    };
    
    // 当无法获取实时数据时的备用数据生成
    const generateFallbackData = () => {
      const mockData = new Uint8Array(barCount);
      
      for (let i = 0; i < barCount; i++) {
        // 使用节拍强度创建动态波形效果
        const baseValue = Math.sin(Date.now() * 0.002 + i * 0.15) * 0.5 + 0.5;
        // 使用节拍强度影响波形高度
        const intensityFactor = beatIntensity * 1.5; // 增强节拍影响
        mockData[i] = Math.floor((baseValue * 0.4 + intensityFactor * 0.6) * 220);
      }
      
      // 调用回调函数，传递可视化数据
      if (onVisualizationData) {
        onVisualizationData(mockData);
      }
      
      return mockData;
    };
    
    const draw = () => {
      if (!ctx) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 获取音频数据
      const audioData = isPlaying ? getAudioData() : null;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        
        // 非播放状态显示静态波形，播放状态显示动态波形
        let barHeight;
        if (!isPlaying) {
          barHeight = Math.sin(i * 0.2) * 15 + 20; // 静态波形模式
        } else {
          const value = audioData ? audioData[i] || 0 : 0;
          // 应用灵敏度和额外的缩放
          barHeight = value * sensitivity / 255 * height;
          
          // 应用节拍强度来增强特定频段的响应
          if (i < barCount * 0.2) { // 低频区域 (前20%)
            barHeight *= (1 + beatIntensity * 0.8);
          } else if (i < barCount * 0.6) { // 中频区域 (20-60%)
            barHeight *= (1 + beatIntensity * 0.4);
          }
        }
        
        // 确保最小高度
        barHeight = Math.max(5, barHeight);
        
        // 创建渐变效果
        const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
        gradient.addColorStop(0, `${color}80`); // 顶部半透明
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // 添加发光效果
        ctx.shadowBlur = 15; // 增强发光效果
        ctx.shadowColor = color;
      }
      
      // 重置阴影效果
      ctx.shadowBlur = 0;
    };
    
    // 开始动画
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, height, barWidth, gap, barCount, sensitivity, beatIntensity, onVisualizationData]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`music-visualizer ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}