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
    <div className="audio-control">
      <button 
        id="play-pause" 
        onClick={togglePlayPause}
        className={`audio-button ${isPlaying ? 'pause' : 'play'}`}
        aria-label={isPlaying ? t('audio.pause') : t('audio.play')}
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#091428] border-2 border-[#00ffcc] shadow-[0_0_10px_#00ffcc] transition-all duration-300 hover:shadow-[0_0_15px_#00ffcc] hover:scale-110">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
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