import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// 音频文件路径 
const DEFAULT_MUSIC_URL = "/uploads/hz9gl-thdkf.mp3";
const FALLBACK_MUSIC_URL = "/uploads/stonks-music.mp3";

export function MusicPlayer() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true); // 默认设置为播放状态
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 播放/暂停音乐
  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      if (!audioRef.current) {
        initAudio();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("播放被阻止:", error);
          });
        }
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // 初始化音频并尝试播放
  const initAudio = () => {
    // 创建一个用户交互事件处理器
    const userInteractionHandler = () => {
      if (audioRef.current) {
        // 尝试播放音频
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("用户交互后播放仍被阻止:", error);
          });
        }
      }
      
      // 移除事件监听器
      document.removeEventListener('click', userInteractionHandler);
      document.removeEventListener('touchstart', userInteractionHandler);
    };
    
    // 创建音频元素
    audioRef.current = new Audio(DEFAULT_MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    // 添加错误处理
    audioRef.current.onerror = () => {
      console.log("主音乐文件加载失败，尝试备用音乐");
      if (audioRef.current) {
        audioRef.current.src = FALLBACK_MUSIC_URL;
        // 尝试播放备用音乐
        audioRef.current.play().catch(error => {
          console.error("备用音乐播放被阻止:", error);
          // 添加用户交互事件监听器
          document.addEventListener('click', userInteractionHandler);
          document.addEventListener('touchstart', userInteractionHandler);
        });
      }
    };
    
    // 尝试播放
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("自动播放被阻止:", error);
        // 自动播放被阻止时，等待用户交互
        document.addEventListener('click', userInteractionHandler);
        document.addEventListener('touchstart', userInteractionHandler);
        // 更新状态
        setIsPlaying(false);
      });
    }
  };
  
  // 组件挂载时初始化音频
  useEffect(() => {
    // 初始化音频
    initAudio();
    
    // 组件卸载时清理
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={togglePlay}
        className="text-white hover:bg-transparent hover:text-accent transition-colors"
        aria-label={isPlaying ? t("audio.pause") : t("audio.play")}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </Button>
    </div>
  );
}