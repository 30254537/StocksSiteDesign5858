import { ReactNode } from 'react';
import { useAudio } from '@/contexts/AudioContext';
import { cn } from '@/lib/utils';

export interface NeonTextProps {
  children?: ReactNode;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  glowIntensity?: 'light' | 'medium' | 'strong';
  as?: string;
}

export function NeonText({ 
  children, 
  text, 
  className, 
  style, 
  color = 'accent', 
  glowIntensity = 'medium',
  as = 'span'
}: NeonTextProps) {
  const { beatIntensity, isPlaying } = useAudio();
  
  // 根据音频节奏计算glow强度
  const calculateGlowIntensity = () => {
    // 默认颜色为accent(#00ffcc)，但如果传入了其他颜色则使用
    const glowColor = color === 'accent' ? '#00ffcc' : color;
    
    if (!isPlaying) {
      // 根据指定的强度提供静态glow效果
      if (glowIntensity === 'light') {
        return `0 0 3px #fff, 0 0 5px ${glowColor}`;
      } else if (glowIntensity === 'strong') {
        return `0 0 5px #fff, 0 0 10px ${glowColor}, 0 0 15px ${glowColor}`;
      } else { // medium (default)
        return `0 0 5px #fff, 0 0 10px ${glowColor}`;
      }
    }
    
    // 计算增强的节拍强度，使得视觉效果更加明显
    // 使用非线性映射使小变化更明显
    const enhancedIntensity = Math.pow(beatIntensity, 0.7) * 1.3; // 指数小于1让较低的值放大更多
    
    // 根据节拍强度调整glow
    const baseGlow = '0 0 5px #fff';
    const mediumGlow = `0 0 ${Math.max(5, 10 * enhancedIntensity)}px #fff`;
    const strongGlow1 = `0 0 ${Math.max(10, 20 * enhancedIntensity)}px ${glowColor}`;
    const strongGlow2 = `0 0 ${Math.max(15, 30 * enhancedIntensity)}px ${glowColor}`;
    const extraGlow = enhancedIntensity > 0.4 ? `0 0 ${Math.max(20, 40 * enhancedIntensity)}px ${glowColor}` : '';
    
    return [baseGlow, mediumGlow, strongGlow1, strongGlow2, extraGlow].filter(Boolean).join(', ');
  };
  
  // 动态样式
  const dynamicStyle = {
    ...style,
    textShadow: calculateGlowIntensity(),
    transition: 'text-shadow 50ms ease-out', // 平滑过渡
  };
  
  const Component = as as keyof JSX.IntrinsicElements;
  
  return (
    <Component 
      className={cn('text-white', className)} 
      style={dynamicStyle}
    >
      {text || children}
    </Component>
  );
}