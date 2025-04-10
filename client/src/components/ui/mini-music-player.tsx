import { useState, useEffect } from 'react';
import { useAudio } from '@/contexts/AudioContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 导航栏使用的迷你音乐播放器
export function MiniMusicPlayer() {
  const { isPlaying, togglePlay } = useAudio();
  const { language } = useLanguage();
  
  return (
    <div 
      className="flex items-center cursor-pointer group" 
      onClick={(e) => {
        e.preventDefault(); // 防止链接点击导航
        e.stopPropagation(); // 阻止事件冒泡
        togglePlay();
      }}
    >
      <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center overflow-hidden mr-2 group-hover:bg-accent/20 transition-colors duration-300">
        <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors duration-300">
          <i className={`fas ${isPlaying ? 'fa-music' : 'fa-pause'} text-accent text-xs`}></i>
        </div>
      </div>
      <div>
        <span className="text-xs text-accent whitespace-nowrap font-medium">
          STONKS MUSIC
        </span>
      </div>
    </div>
  );
}

// 同时提供默认导出和命名导出
export default MiniMusicPlayer;