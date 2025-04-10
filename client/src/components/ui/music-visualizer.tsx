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
}

export default function MusicVisualizer({
  className = '',
  color = '#00ffcc',
  height = 120,
  barWidth = 1, // 默认使用1像素宽度的极细条
  gap = 2, // 默认更大的间隙
  barCount = 150, // 默认更多的条数
  sensitivity = 1.2 // 调整灵敏度
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, beatIntensity } = useAudio();
  const animationRef = useRef<number>();
  const [phase, setPhase] = useState(0); // 添加相位变量以创建更流畅的动画
  const prevBeatIntensityRef = useRef(0); // 用于存储上一帧的beatIntensity值
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = (barWidth + gap) * barCount - gap;
    canvas.height = height;
    
    // 生成音频响应数据
    const generateAudioData = () => {
      const audioData = new Uint8Array(barCount);
      
      // 计算beatIntensity的变化率，用于创建更强的视觉冲击力
      const beatDelta = Math.abs(beatIntensity - prevBeatIntensityRef.current);
      prevBeatIntensityRef.current = beatIntensity;
      
      // 更新相位，但不随节拍强度变化太快
      setPhase(prev => (prev + 0.05) % (2 * Math.PI));
      
      for (let i = 0; i < barCount; i++) {
        // 基础波形 - 使用正弦波和相位
        // 减小baseFrequency使波纹更细密
        const baseFrequency = 0.05; // 降低频率，使波形更加平滑
        const baseSine = Math.sin(phase + i * baseFrequency) * 0.3 + 0.5; // 减小振幅
        
        // 节拍响应 - 只改变颜色和发光效果，不改变波形高度
        const centerEffect = 1 - Math.abs((i - barCount/2) / (barCount/2)) * 0.7;
        
        // 保持基本波形的形状和高度
        const amplitude = baseSine;
        
        // 添加小的随机变化使波形更自然，但限制幅度
        const randomness = Math.random() * 0.1; // 减少随机性，不受节拍影响
        
        // 计算最终值，但限制最大值以保持波形小
        audioData[i] = Math.floor((amplitude + randomness) * 120); // 降低最大值
      }
      
      return audioData;
    };
    
    const draw = () => {
      if (!ctx) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 获取音频响应数据
      const audioData = isPlaying ? generateAudioData() : null;
      
      // 设置全局投影，创建整体发光效果
      if (isPlaying && beatIntensity > 0.5) {
        // 随着节拍强度增加发光
        ctx.shadowBlur = 15 + (beatIntensity * 10);
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
      }
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        
        // 始终保持小声波纹样式，无论是否播放
        let barHeight;
        
        // 创建更细的声波纹效果
        // 使用更小的振幅和频率
        const staticWaveHeight = Math.sin(i * 0.05) * 10 + 15;
        
        if (!isPlaying) {
          barHeight = staticWaveHeight;
        } else {
          const value = audioData ? audioData[i] || 0 : 0;
          
          // 限制动态波形的高度，保持小声波纹效果
          // 使用静态波形作为基础，加上少量的音频数据影响
          const dynamicComponent = (value * sensitivity / 255) * 10; // 限制最大高度
          barHeight = staticWaveHeight + (dynamicComponent * 0.3); // 减弱动态影响
        }
        
        // 创建渐变效果
        const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
        
        // 根据beatIntensity修改渐变色，使颜色随节拍变化
        const alphaTop = 0.5 + (beatIntensity * 0.5); // 顶部透明度随节拍增强
        gradient.addColorStop(0, `${color}${Math.floor(alphaTop * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }
      
      // 绘制全局脉动效果 - 在强节拍时添加一个淡淡的背景光晕
      if (isPlaying && beatIntensity > 0.6) {
        const pulseRadius = Math.min(canvas.width, canvas.height) * 0.5 * beatIntensity;
        const pulseGradient = ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, 0,
          canvas.width/2, canvas.height/2, pulseRadius
        );
        
        pulseGradient.addColorStop(0, `${color}40`); // 中心淡色
        pulseGradient.addColorStop(1, 'transparent'); // 边缘透明
        
        ctx.fillStyle = pulseGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  }, [isPlaying, color, height, barWidth, gap, barCount, sensitivity, beatIntensity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`music-visualizer ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}