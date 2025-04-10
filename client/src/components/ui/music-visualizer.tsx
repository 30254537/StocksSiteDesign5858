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
      
      // 添加相位变量，用于创建动态效果
      let phaseOffset = phase;
      
      for (let i = 0; i < barCount; i++) {
        // 生成不同频率的随机高度
        // 这些随机高度将被用于创建竖条状的波形
        let baseValue;
        
        // 使用更密集的随机生成，使条的分布更自然
        if (i % 3 === 0) {
          baseValue = Math.abs(Math.sin(i * 0.12 + phaseOffset)) * 0.7;
        } else if (i % 3 === 1) {
          baseValue = Math.abs(Math.cos(i * 0.22 + phaseOffset * 0.7)) * 0.6;
        } else {
          baseValue = Math.abs(Math.sin(i * 0.32 + phaseOffset * 1.3)) * 0.8;
        }
        
        // 添加小的随机变化使波形更自然
        const randomness = Math.random() * 0.1;
        
        // 生成最终音频数据
        audioData[i] = Math.floor((baseValue + randomness) * 200);
      }
      
      return audioData;
    };
    
    const draw = () => {
      if (!ctx) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // 清除画布 
      // 注意：我们会在后面重新清除画布，这里不做操作
      
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
      
      // 先清除画布为纯黑色
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        
        // 创建不规则高度的竖条
        let barHeight;
        
        // 使用多个频率的正弦波创建更自然的随机高度效果
        // 这样可以创建类似图中长短不一的竖条效果
        const seed1 = Math.abs(Math.sin(i * 0.2 + phase * 0.5)); // 慢变化
        const seed2 = Math.abs(Math.sin(i * 0.7)); // 快变化
        const seed3 = Math.abs(Math.cos(i * 0.4)); // 中速变化
        
        // 混合不同频率的影响
        const seed = (seed1 * 0.4 + seed2 * 0.3 + seed3 * 0.3);
        
        if (!isPlaying) {
          // 非播放状态时，只显示静态的竖条
          barHeight = Math.max(5, seed * height * 0.5);
        } else {
          // 播放状态时，结合音频数据和静态高度
          const value = audioData ? audioData[i] || 0 : 0;
          
          // 音频值影响竖条高度，但保持较小的影响
          const baseHeight = Math.max(5, seed * height * 0.5);
          const audioInfluence = (value / 255) * height * 0.3 * sensitivity;
          
          // 结合基础高度和音频影响
          barHeight = baseHeight + audioInfluence;
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