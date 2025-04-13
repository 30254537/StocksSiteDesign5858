import React, { useRef, useEffect, useState } from 'react';
import { useAudio } from '@/contexts/AudioContext';

interface ReactiveLogoProps {
  className?: string;
  color?: string;
  glowColor?: string;
  children: React.ReactNode;
}

export function ReactiveLogo({
  className = '',
  color = '#00ffcc',
  glowColor = 'rgba(0, 255, 204, 0.5)',
  children
}: ReactiveLogoProps) {
  const { beatIntensity } = useAudio();
  const [glowIntensity, setGlowIntensity] = useState(10);
  
  // 只更新发光效果，不改变文字大小
  useEffect(() => {
    // 更新发光强度，节拍越强，发光越强
    const newGlowIntensity = 10 + (beatIntensity * 25);
    setGlowIntensity(newGlowIntensity);
  }, [beatIntensity]);
  
  return (
    <div 
      className={`reactive-logo ${className}`}
      style={{
        textShadow: `0 0 ${glowIntensity}px ${glowColor}`,
        transition: 'text-shadow 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

interface ReactiveWaveformProps {
  className?: string;
  color?: string; 
  height?: number;
  width?: number;
  amplitude?: number;
  frequency?: number;
  speed?: number;
}

export function ReactiveWaveform({
  className = '',
  color = '#00ffcc',
  height = 40,
  width = 300,
  amplitude = 10,
  frequency = 0.02,
  speed = 0.05
}: ReactiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { beatIntensity } = useAudio();
  const [phase, setPhase] = useState(0);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const draw = () => {
      if (!ctx) return;
      
      // 更新相位，创建波浪移动的效果
      setPhase(prevPhase => (prevPhase + speed * (1 + beatIntensity)) % (Math.PI * 2));
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 保持振幅稳定，不随节拍强度放大
      const currentAmplitude = amplitude;
      
      // 根据参考图要求，将波形整体下移
      const wavePositionY = height * 0.7; // 波形中心线位于画布70%的高度处
      
      // 创建波浪路径
      ctx.beginPath();
      ctx.moveTo(0, wavePositionY);
      
      // 绘制正弦波形
      for (let x = 0; x < width; x++) {
        // 计算y值，使用两个不同频率的正弦波叠加以创建更复杂的波形
        const y = wavePositionY + 
          Math.sin(x * frequency + phase) * currentAmplitude +
          Math.sin(x * frequency * 1.5 + phase * 0.8) * (currentAmplitude * 0.4);
        
        ctx.lineTo(x, y);
      }
      
      // 完成路径，将线条延伸到画布底部然后回到起点，形成一个完整的形状
      // 使用画布高度作为底部边界，而不是固定偏移量，使填充更美观
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // 创建渐变填充
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `${color}00`); // 顶部完全透明
      gradient.addColorStop(0.5, `${color}40`); // 中部半透明
      gradient.addColorStop(1, `${color}ff`); // 底部全不透明
      
      // 应用填充和描边
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 设置发光效果
      ctx.shadowBlur = 10 + (beatIntensity * 10);
      ctx.shadowColor = color;
      
      // 描边路径
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 重置阴影
      ctx.shadowBlur = 0;
      
      // 继续动画循环
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // 开始动画
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, height, width, amplitude, frequency, speed, beatIntensity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`reactive-waveform ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}