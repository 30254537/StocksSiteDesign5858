import React, { useRef, useEffect } from 'react';
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
  barWidth = 4,
  gap = 1,
  barCount = 60,
  sensitivity = 1.2
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, beatIntensity } = useAudio();
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = (barWidth + gap) * barCount - gap;
    canvas.height = height;
    
    // 模拟数据数组
    const generateMockData = () => {
      const mockData = new Uint8Array(barCount);
      
      for (let i = 0; i < barCount; i++) {
        // 使用节拍强度创建动态波形效果
        const baseValue = Math.sin(Date.now() * 0.001 + i * 0.15) * 0.5 + 0.5;
        // 添加随机性和节拍强度的影响
        mockData[i] = Math.floor((baseValue * 0.6 + beatIntensity * 0.4) * 200 * Math.random() * 0.5 + 55);
      }
      
      return mockData;
    };
    
    const draw = () => {
      if (!ctx) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 获取模拟数据
      const mockData = isPlaying ? generateMockData() : null;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        
        // 非播放状态显示静态波形，播放状态显示动态波形
        let barHeight;
        if (!isPlaying) {
          barHeight = Math.sin(i * 0.2) * 15 + 15; // 静态波形模式
        } else {
          const value = mockData ? mockData[i] || 0 : 0;
          // 应用灵敏度
          barHeight = value * sensitivity / 255 * height;
        }
        
        // 创建渐变效果
        const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
        gradient.addColorStop(0, `${color}80`); // 顶部半透明
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // 添加发光效果
        ctx.shadowBlur = 10;
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
  }, [isPlaying, color, height, barWidth, gap, barCount, sensitivity, beatIntensity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`music-visualizer ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}