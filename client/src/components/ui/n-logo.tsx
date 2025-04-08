import React from 'react';

interface NLogoProps {
  className?: string;
  size?: number;
}

export function NLogo({ className = "", size = 40 }: NLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 240 240"
      width={size} 
      height={size} 
      className={className}
    >
      {/* 极简几何风格的三维等距N字母 */}
      <g transform="translate(20, 20)">
        {/* 左侧立方体 */}
        <polygon points="20,50 50,30 50,150 20,170" fill="#ffffff" /> {/* 前面 */}
        <polygon points="20,50 0,60 0,180 20,170" fill="#666666" /> {/* 左侧面 */}
        <polygon points="20,50 50,30 30,20 0,40" fill="#dddddd" /> {/* 顶面 */}
        
        {/* 中间斜向方块连接 */}
        <polygon points="50,30 130,30 150,50 70,50" fill="#ffffff" /> {/* 上方连接前面 */}
        <polygon points="50,30 70,50 70,170 50,150" fill="#333333" /> {/* 斜向主体左侧 */}
        <polygon points="130,30 150,50 150,170 130,150" fill="#333333" /> {/* 斜向主体右侧 */}
        <polygon points="70,50 150,50 150,170 70,170" fill="#111111" /> {/* 斜向主体前面 */}
        <polygon points="50,150 70,170 150,170 130,150" fill="#dddddd" /> {/* 下方连接顶面 */}
        
        {/* 右侧立方体 */}
        <polygon points="150,50 180,30 180,150 150,170" fill="#ffffff" /> {/* 前面 */}
        <polygon points="180,30 200,40 200,160 180,150" fill="#666666" /> {/* 右侧面 */}
        <polygon points="150,50 180,30 200,40 170,60" fill="#dddddd" /> {/* 顶面 */}

        {/* 底部阴影 */}
        <polygon points="0,180 20,170 70,170 50,190" fill="#333333" /> {/* 左侧底部 */}
        <polygon points="150,170 200,160 170,180 130,190" fill="#333333" /> {/* 右侧底部 */}
        <polygon points="50,190 70,170 150,170 130,190" fill="#111111" /> {/* 中间底部 */}
        
        {/* 边缘高光 */}
        <line x1="20" y1="50" x2="20" y2="170" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="150" y1="50" x2="150" y2="170" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="70" y1="50" x2="70" y2="170" stroke="#444444" strokeWidth="1" />
        
        {/* 轮廓光效 */}
        <path 
          d="M0,40 L30,20 L180,20 L200,40 L200,160 L170,180 L30,180 L0,160 Z" 
          stroke="#00ffcc" 
          strokeWidth="1" 
          fill="none" 
          strokeOpacity="0.9" 
        />
        
        {/* 增强立体感的额外线条 */}
        <line x1="50" y1="30" x2="50" y2="150" stroke="#888888" strokeWidth="0.7" opacity="0.8" />
        <line x1="180" y1="30" x2="180" y2="150" stroke="#888888" strokeWidth="0.7" opacity="0.8" />
        <line x1="130" y1="30" x2="130" y2="150" stroke="#222222" strokeWidth="0.7" opacity="0.8" />
        
        {/* 现代感点缀效果 */}
        <circle cx="20" cy="50" r="2" fill="#00ffcc" opacity="0.8" />
        <circle cx="180" cy="150" r="2" fill="#00ffcc" opacity="0.8" />
      </g>
    </svg>
  );
}