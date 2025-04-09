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
    
    // 根据节拍强度调整glow
    const baseGlow = '0 0 5px #fff';
    const mediumGlow = `0 0 ${Math.max(5, 10 * beatIntensity)}px #fff`;
    const strongGlow1 = `0 0 ${Math.max(10, 15 * beatIntensity)}px #00ffcc`;
    const strongGlow2 = `0 0 ${Math.max(15, 25 * beatIntensity)}px #00ffcc`;
    const extraGlow = beatIntensity > 0.5 ? `0 0 ${Math.max(20, 35 * beatIntensity)}px #00ffcc` : '';
    
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