import React from 'react';

interface NLogoProps {
  className?: string;
  size?: number;
}

export function NLogo({ className = "", size = 40 }: NLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200"
      width={size} 
      height={size} 
      className={className}
    >
      {/* 等距视角N字母 - 现代几何风格 */}
      <g transform="translate(40, 40) scale(0.6)">
        {/* 左侧垂直柱体 */}
        <polygon points="30,20 60,0 60,120 30,140" fill="#ffffff" /> {/* 前面 */}
        <polygon points="30,20 0,40 0,160 30,140" fill="#999999" /> {/* 左侧面 */}
        <polygon points="0,40 30,20 60,0 30,20" fill="#cccccc" /> {/* 顶面 */}
        
        {/* 右侧垂直柱体 */}
        <polygon points="170,20 200,40 200,160 170,140" fill="#ffffff" /> {/* 前面 */}
        <polygon points="170,20 140,0 140,120 170,140" fill="#999999" /> {/* 右侧面 */}
        <polygon points="170,20 200,40 170,60 140,40" fill="#cccccc" /> {/* 顶面 */}
        
        {/* 对角线柱体 */}
        <polygon points="30,140 60,120 170,140 140,160" fill="#ffffff" /> {/* 前面底部连接 */}
        <polygon points="60,120 60,0 170,20 170,140" fill="#666666" /> {/* 对角线主体 */}
        <polygon points="60,0 30,20 140,40 170,20" fill="#cccccc" /> {/* 顶部连接 */}
        
        {/* 高光和阴影效果 */}
        <polygon points="60,0 140,0 170,20 140,40 60,0" fill="#e6e6e6" /> {/* 顶部高光 */}
        <polygon points="30,140 0,160 140,160 170,140" fill="#4d4d4d" /> {/* 底部阴影 */}
        
        {/* 轮廓描边 - 赛博朋克风格 */}
        <path d="M30,20 L60,0 L140,0 L170,20 L200,40 L200,160 L170,140 L140,160 L0,160 L0,40 Z" 
          stroke="#00ffcc" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
      </g>
    </svg>
  );
}