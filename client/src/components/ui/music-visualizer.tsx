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
  position?: 'top' | 'bottom';
}

export default function MusicVisualizer({
  className = '',
  color = '#00ffcc',
  height = 120,
  barWidth = 1, // 默认使用1像素宽度的极细条
  gap = 2, // 默认更大的间隙
  barCount = 150, // 默认更多的条数
  sensitivity = 1.2, // 调整灵敏度
  position = 'bottom' // 默认将波纹放在底部
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
        // 生成俄罗斯方块式的离散高度数据
        // 这会创建不连续的高度变化，像俄罗斯方块一样
        let baseValue;
        
        // 使用离散的高度级别
        // 这样可以创建像俄罗斯方块一样的梯形效果
        if (i % 7 === 0) {
          baseValue = 0.9; // 很高的块
        } else if (i % 7 === 1) {
          baseValue = 0.7; // 高的块
        } else if (i % 7 === 2) {
          baseValue = 0.5; // 中等高度的块
        } else if (i % 7 === 3) {
          baseValue = 0.3; // 中低高度的块
        } else if (i % 7 === 4) {
          baseValue = 0.2; // 较低的块
        } else if (i % 7 === 5) {
          baseValue = 0.1; // 很低的块
        } else {
          baseValue = 0.4; // 中等偏低的块
        }
        
        // 添加少量随机变化，但范围要小，保持俄罗斯方块的感觉
        const randomness = (Math.random() - 0.5) * 0.05;
        
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
      
      // 先清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制黑色背景但只在底部
      // 如果position为bottom，波纹在黑色背景的底部
      // 如果position为top，波纹在黑色背景的顶部
      if (position === 'bottom') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        
        // 创建俄罗斯方块样式长短不一的竖条
        let barHeight;
        
        // 使用"阶梯式"随机高度而不是渐变式
        // 创建更像俄罗斯方块的离散高度变化
        let blockHeight;
        
        // 通过取模运算创建不同高度级别的块
        // 这样会产生更像俄罗斯方块的离散高度效果
        if (i % 6 === 0) {
          blockHeight = height * 0.3; // 较高的块
        } else if (i % 6 === 1) {
          blockHeight = height * 0.5; // 中等高度的块
        } else if (i % 6 === 2) {
          blockHeight = height * 0.2; // 较矮的块
        } else if (i % 6 === 3) {
          blockHeight = height * 0.4; // 中高的块
        } else if (i % 6 === 4) {
          blockHeight = height * 0.15; // 最矮的块
        } else {
          blockHeight = height * 0.25; // 中矮的块
        }
        
        // 添加少量随机变化，使其看起来不那么规则
        const randomOffset = (Math.random() - 0.5) * height * 0.1;
        
        if (!isPlaying) {
          // 非播放状态时，只显示静态的竖条
          barHeight = Math.max(5, blockHeight + randomOffset);
        } else {
          // 播放状态时，结合音频数据和静态高度
          const value = audioData ? audioData[i] || 0 : 0;
          
          // 音频值影响竖条高度，但保持较小的影响
          const baseHeight = Math.max(5, blockHeight + randomOffset);
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
  }, [isPlaying, color, height, barWidth, gap, barCount, sensitivity, beatIntensity, position]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`music-visualizer ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}