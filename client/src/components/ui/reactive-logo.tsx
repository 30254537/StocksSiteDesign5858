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
      
      // 定义蜡烛图效果中的高低不一的点
      const variationPoints = [0.9, 0.5, 0.7, 0.3, 0.8, 0.4, 0.6, 0.2, 0.5, 0.7, 0.3, 0.8, 0.4];
      
      // 绘制类似BTC日线图的高低不一的波形
      const segmentWidth = width / (variationPoints.length - 1);
      
      for (let i = 0; i < variationPoints.length; i++) {
        const x = i * segmentWidth;
        
        // 使用变化点和少量随机性创建不规则高度
        const variationHeight = variationPoints[i % variationPoints.length];
        const randomOffset = (Math.random() - 0.5) * 0.1; // 加入一点随机性
        
        // 将高度变化应用到波形上，但保持在底部
        const y = wavePositionY - (variationHeight + randomOffset) * currentAmplitude * 2;
        
        // 创建更平滑的曲线连接点
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // 使用曲线而不是直线连接点
          const prevX = (i - 1) * segmentWidth;
          const prevY = wavePositionY - (variationPoints[(i - 1) % variationPoints.length]) * currentAmplitude * 2;
          
          const cpX1 = prevX + (x - prevX) / 3;
          const cpX2 = prevX + (x - prevX) * 2 / 3;
          
          ctx.bezierCurveTo(
            cpX1, prevY, 
            cpX2, y, 
            x, y
          );
        }
      }
      
      // 完成路径，将线条延伸到画布底部然后回到起点，形成一个完整的形状
      // 使用画布高度作为底部边界，而不是固定偏移量，使填充更美观
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // 创建类似BTC图表的渐变效果
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `${color}00`); // 顶部完全透明
      gradient.addColorStop(0.6, `${color}10`); // 上部非常淡的填充
      gradient.addColorStop(0.8, `${color}30`); // 底部略微加深
      gradient.addColorStop(1, `${color}60`); // 底部较深但不完全不透明
      
      // 应用填充和描边
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 减少阴影效果，让波形更清晰
      ctx.shadowBlur = 3; // 减小的阴影值
      ctx.shadowColor = color;
      
      // 描边路径 - 使线条更细，更清晰
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5; // 更细的线条
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