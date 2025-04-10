import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useAudio } from '@/contexts/AudioContext';
import { MusicTrack } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface MusicPlayerProps {
  tracks?: MusicTrack[];
  currentTrackIndex?: number;
  onTrackChange?: (index: number) => void;
  minimal?: boolean; // 简化版模式，仅显示播放/暂停按钮
}

const MusicPlayer = ({ 
  tracks = [], 
  currentTrackIndex = 0, 
  onTrackChange = () => {},
  minimal = false
}: MusicPlayerProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isPlaying, togglePlay, audioRef, beatIntensity } = useAudio();
  const progressRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = useRef(volume);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : undefined;

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

    const handleEnded = () => {
      nextTrack();
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('durationchange', handleDurationChange);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('durationchange', handleDurationChange);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioRef, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;

    const progressRect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - progressRect.left) / progressRect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume.current;
      }
    } else {
      previousVolume.current = volume;
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const previousTrack = () => {
    if (tracks.length > 0) {
      const newIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      onTrackChange(newIndex);
    }
  };

  const nextTrack = () => {
    if (tracks.length > 0) {
      const newIndex = (currentTrackIndex + 1) % tracks.length;
      onTrackChange(newIndex);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // 如果是精简模式，只显示播放/暂停按钮
  if (minimal) {
    return (
      <div className="flex items-center space-x-2">
        <Button 
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault(); // 防止链接导航
            togglePlay();
          }}
          className={`rounded-full bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary transition-all duration-300 ${
            beatIntensity > 0.6 ? 'scale-110' : ''
          }`}
          style={{
            boxShadow: `0 0 ${5 + beatIntensity * 10}px ${beatIntensity * 5}px rgba(0, 255, 204, ${beatIntensity * 0.4})`
          }}
        >
          {isPlaying ? (
            <Pause size={16} className="text-accent" />
          ) : (
            <Play size={16} className="text-accent ml-0.5" />
          )}
        </Button>
        <span className="text-xs text-accent">
          {currentTrack?.title || t('music.defaultTitle')}
        </span>
      </div>
    );
  }
  
  // 完整播放器模式
  return (
    <Card className="w-full bg-background/80 backdrop-blur-sm border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div 
            ref={progressRef}
            className="w-full h-2 bg-primary/10 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleMute}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={previousTrack}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <SkipBack size={18} />
              </Button>
              
              <Button 
                size="icon"
                variant="outline"
                onClick={togglePlay}
                className={`rounded-full bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary transition-all duration-300 ${
                  beatIntensity > 0.6 ? 'scale-110' : ''
                }`}
                style={{
                  boxShadow: `0 0 ${10 + beatIntensity * 20}px ${beatIntensity * 10}px rgba(0, 255, 204, ${beatIntensity * 0.5})`
                }}
              >
                {isPlaying ? (
                  <Pause size={20} className="text-primary" />
                ) : (
                  <Play size={20} className="text-primary ml-0.5" />
                )}
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={nextTrack}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <SkipForward size={18} />
              </Button>
            </div>
            
            <div className="text-right flex-1 hidden sm:block">
              <h3 className="text-sm font-medium truncate">{currentTrack?.title || t('music.defaultTitle')}</h3>
              <p className="text-xs text-muted-foreground truncate">{currentTrack?.artist || t('music.defaultArtist')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;