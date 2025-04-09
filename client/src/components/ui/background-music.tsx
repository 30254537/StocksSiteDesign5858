import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useLanguage();
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.muted = false;
        audioRef.current.play().catch(err => {
          console.error("Playback failed:", err);
          // Most browsers require user interaction before playing audio
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Save user preference in local storage
  useEffect(() => {
    const savedPreference = localStorage.getItem('musicEnabled');
    if (savedPreference === 'true' && audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {
        // Silent error - browsers require interaction
      });
      setIsPlaying(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('musicEnabled', isPlaying.toString());
  }, [isPlaying]);

  return (
    <div className="audio-control absolute bottom-4 right-4 z-50">
      <button 
        id="play-pause" 
        onClick={togglePlayPause}
        className={`audio-button ${isPlaying ? 'pause' : 'play'}`}
        aria-label={isPlaying ? t('audio.pause') : t('audio.play')}
      >
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#091428] shadow-[0_0_15px_#00ffcc] transition-all duration-300 hover:shadow-[0_0_20px_#00ffcc] hover:scale-110">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="none" stroke="#00ffcc" strokeWidth="2" />
              <circle cx="12" cy="12" r="2" fill="#00ffcc" />
            </svg>
          )}
        </div>
      </button>
      <audio 
        ref={audioRef} 
        id="background-music" 
        loop 
        muted
        preload="auto"
      >
        <source src="/assets/audio/stonks-bg-music.mp3" type="audio/mpeg" />
        <span className="sr-only">{t('audio.notSupported')}</span>
      </audio>
    </div>
  );
}