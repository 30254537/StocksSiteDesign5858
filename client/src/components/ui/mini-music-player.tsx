import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { useAudio } from '@/contexts/AudioContext';
import { useTranslation } from '@/lib/translations';

// 导航栏使用的迷你音乐播放器
export function MiniMusicPlayer() {
  const { t } = useTranslation();
  const { isPlaying, audioRef } = useAudio();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackInfo, setTrackInfo] = useState({
    title: t('music.defaultTitle'),
    artist: t('music.defaultArtist')
  });

  useEffect(() => {
    if (!audioRef.current) return;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('durationchange', handleDurationChange);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('durationchange', handleDurationChange);
      }
    };
  }, [audioRef]);

  return (
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <i className={`fas ${isPlaying ? 'fa-music' : 'fa-pause'} text-accent text-xs`}></i>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <span className="text-xs text-accent">{trackInfo.title}</span>
        </div>
      </div>
    </div>
  );
}

// 同时提供默认导出和命名导出
export default MiniMusicPlayer;