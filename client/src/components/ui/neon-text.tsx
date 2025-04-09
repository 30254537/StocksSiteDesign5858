import { ReactNode } from 'react';
import { useAudio } from '@/contexts/AudioContext';
import { cn } from '@/lib/utils';

interface NeonTextProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function NeonText({ children, className, style }: NeonTextProps) {
  const { beatIntensity, isPlaying } = useAudio();
  
  // 根据音频节奏计算glow强度
  const calculateGlowIntensity = () => {
    if (!isPlaying) return '0 0 5px #fff, 0 0 10px #00ffcc';
    
    // 计算增强的节拍强度，使得视觉效果更加明显
    // 使用非线性映射使小变化更明显
    const enhancedIntensity = Math.pow(beatIntensity, 0.7) * 1.3; // 指数小于1让较低的值放大更多
    
    // 根据节拍强度调整glow
    const baseGlow = '0 0 5px #fff';
    const mediumGlow = `0 0 ${Math.max(5, 10 * enhancedIntensity)}px #fff`;
    const strongGlow1 = `0 0 ${Math.max(10, 20 * enhancedIntensity)}px #00ffcc`;
    const strongGlow2 = `0 0 ${Math.max(15, 30 * enhancedIntensity)}px #00ffcc`;
    const extraGlow = enhancedIntensity > 0.4 ? `0 0 ${Math.max(20, 40 * enhancedIntensity)}px #00ffcc` : '';
    
    return [baseGlow, mediumGlow, strongGlow1, strongGlow2, extraGlow].filter(Boolean).join(', ');
  };
  
  // 动态样式
  const dynamicStyle = {
    ...style,
    textShadow: calculateGlowIntensity(),
    transition: 'text-shadow 50ms ease-out', // 平滑过渡
  };
  
  return (
    <span 
      className={cn('text-white', className)} 
      style={dynamicStyle}
    >
      {children}
    </span>
  );
}