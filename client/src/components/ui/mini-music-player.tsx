import { useState, useEffect } from 'react';
import { useAudio } from '@/contexts/AudioContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 导航栏使用的迷你音乐播放器
export function MiniMusicPlayer() {
  const { isPlaying, togglePlay } = useAudio();
  const { language } = useLanguage();
  
  return (
    <div 
      className="flex items-center cursor-pointer" 
      onClick={(e) => {
        e.preventDefault(); // 防止链接点击导航
        e.stopPropagation(); // 阻止事件冒泡
        togglePlay();
      }}
    >
      <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center overflow-hidden">
        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
          <i className={`fas ${isPlaying ? 'fa-music' : 'fa-pause'} text-accent text-xs`}></i>
        </div>
      </div>
      <div className="ml-1.5">
        <span className={`text-xs text-accent ${language === 'en' ? 'whitespace-nowrap min-w-[90px]' : ''}`}>
          STONKS MUSIC
        </span>
      </div>
    </div>
  );
}

// 同时提供默认导出和命名导出
export default MiniMusicPlayer;