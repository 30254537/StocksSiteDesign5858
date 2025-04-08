import React from 'react';

interface NLogoProps {
  className?: string;
  size?: number;
}

export function NLogo({ className = "", size = 40 }: NLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 60"
      width={size} 
      height={size * 0.6} 
      className={className}
      style={{ background: 'transparent' }}
    >
      <rect width="100" height="60" fill="transparent" />
      
      {/* 完全匹配图片中的N形状 */}
      <g transform="translate(10, 0) scale(0.8)">
        {/* 顶部水平长条 */}
        <polygon points="10,10 80,10 90,20 20,20" fill="#ffffff" /> {/* 顶面 */}
        <polygon points="10,10 10,15 20,25 20,20" fill="#333333" /> {/* 左侧面 */}
        
        {/* 左侧竖条 */}
        <polygon points="10,15 20,25 20,50 10,40" fill="#333333" /> {/* 左侧面 */}
        <polygon points="20,20 30,20 30,45 20,45" fill="#ffffff" /> {/* 前面 */}
        
        {/* 中间连接块 - 从左上到右中 */}
        <polygon points="30,20 80,10 80,25 30,35" fill="#222222" /> {/* 前面 */}
        
        {/* 右侧小立方体 */}
        <polygon points="80,25 90,20 90,35 80,40" fill="#444444" /> {/* 右侧面 */}
        <polygon points="80,25 80,40 70,50 70,35" fill="#333333" /> {/* 左侧面 */}
        <polygon points="70,35 80,25 90,35 80,45" fill="#ffffff" /> {/* 顶面 */}
        
        {/* 底部水平长条 */}
        <polygon points="20,45 30,45 40,55 30,55" fill="#dddddd" /> {/* 顶面连接 */}
        <polygon points="20,45 20,50 30,60 30,55" fill="#333333" /> {/* 左侧面 */}
        <polygon points="30,45 100,45 90,55 40,55" fill="#ffffff" /> {/* 前面 */}
        <polygon points="90,55 100,45 100,50 90,60" fill="#444444" /> {/* 右侧面 */}
        
        {/* 阴影部分 */}
        <polygon points="40,55 90,55 90,60 40,60" fill="#111111" /> {/* 底部 */}
        <polygon points="30,35 30,45 70,35 80,25" fill="#111111" /> {/* 中间连接阴影 */}
        <polygon points="10,40 20,50 30,60 20,50" fill="#111111" /> {/* 左下连接处 */}
      </g>
    </svg>
  );
}