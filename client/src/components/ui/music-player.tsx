import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// 默认本地音乐URL
const DEFAULT_MUSIC_URL = "/assets/music/user/background-music.mp3";
const FALLBACK_MUSIC_URL = "/assets/music/default-music.mp3";

// 播放来源类型
type MusicSourceType = "local" | "youtube";

export function MusicPlayer() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true); // 默认设置为播放状态
  const [musicUrl, setMusicUrl] = useState(DEFAULT_MUSIC_URL);
  const [musicSource, setMusicSource] = useState<MusicSourceType>("local");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // 播放/暂停音乐
  const togglePlay = () => {
    if (isPlaying) {
      if (musicSource === "local" && audioRef.current) {
        audioRef.current.pause();
      } else if (musicSource === "youtube" && iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    } else {
      if (musicSource === "local") {
        // 播放本地音乐文件
        if (!audioRef.current) {
          audioRef.current = new Audio(musicUrl);
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
          
          // 添加错误处理 - 如果主音乐文件加载失败，尝试备用音乐
          audioRef.current.onerror = () => {
            console.log("主音乐文件加载失败，尝试备用音乐");
            if (audioRef.current) {
              audioRef.current.src = FALLBACK_MUSIC_URL;
              audioRef.current.play().catch(error => {
                console.error("备用音乐播放被阻止:", error);
              });
            }
          };
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("播放被阻止:", error);
          });
        }
      } else {
        // 播放YouTube视频
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.allow = 'autoplay';
        iframe.src = musicUrl;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // 保存新的音乐设置
  const saveSettings = () => {
    if (musicSource === "youtube" && inputUrl) {
      // 转换普通 YouTube 链接为嵌入式链接
      let embedUrl = inputUrl;
      if (inputUrl.includes('youtube.com/watch?v=')) {
        const videoId = new URL(inputUrl).searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
        }
      } else if (inputUrl.includes('youtu.be/')) {
        const videoId = inputUrl.split('/').pop();
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
        }
      }
      
      // 停止当前播放
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (iframeRef.current && iframeRef.current.parentNode) {
          iframeRef.current.remove();
          iframeRef.current = null;
        }
        
        // 重新开始播放新的音乐
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.allow = 'autoplay';
        iframe.src = embedUrl;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }
      
      setMusicUrl(embedUrl);
    } else if (musicSource === "local" && isPlaying) {
      // 如果切换到本地音乐并且当前正在播放
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }
      
      // 开始播放本地音乐
      if (!audioRef.current) {
        audioRef.current = new Audio(DEFAULT_MUSIC_URL);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        
        // 添加错误处理 - 如果主音乐文件加载失败，尝试备用音乐
        audioRef.current.onerror = () => {
          console.log("主音乐文件加载失败，尝试备用音乐");
          if (audioRef.current) {
            audioRef.current.src = FALLBACK_MUSIC_URL;
            audioRef.current.play().catch(error => {
              console.error("备用音乐播放被阻止:", error);
            });
          }
        };
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("播放被阻止:", error);
        });
      }
    }
    
    setIsSettingsOpen(false);
  };
  
  // 组件挂载时自动播放音乐
  useEffect(() => {
    // 组件挂载后自动播放音乐
    if (musicSource === "local") {
      // 创建音频元素并播放
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      
      // 添加错误处理 - 如果主音乐文件加载失败，尝试备用音乐
      audioRef.current.onerror = () => {
        console.log("主音乐文件加载失败，尝试备用音乐");
        if (audioRef.current) {
          audioRef.current.src = FALLBACK_MUSIC_URL;
          audioRef.current.play().catch(error => {
            console.error("备用音乐播放被阻止:", error);
          });
        }
      };
      
      // 尝试播放
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("自动播放被阻止:", error);
          // 自动播放被阻止时，更新状态
          setIsPlaying(false);
        });
      }
    }
    
    // 组件卸载时清理
    return () => {
      // 清理音频元素
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // 清理iframe元素
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.remove();
        iframeRef.current = null;
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
      
      {/* 设置按钮 - 只显示当音乐正在播放时 */}
      {isPlaying && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
          className="text-white hover:bg-transparent hover:text-accent transition-colors"
          aria-label={t("audio.settings")}
        >
          <Settings size={16} />
        </Button>
      )}
      
      {/* 音乐设置对话框 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-secondary border border-accent/30 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-orbitron">{t("audio.settingsTitle")}</DialogTitle>
            <DialogDescription>
              {t("audio.settingsDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup 
              value={musicSource} 
              onValueChange={(val) => setMusicSource(val as MusicSourceType)}
              className="mb-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local">{t("audio.localMusic")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="youtube" id="youtube" />
                <Label htmlFor="youtube">{t("audio.youtubeMusic")}</Label>
              </div>
            </RadioGroup>
            
            {musicSource === "youtube" && (
              <>
                <Input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://youtu.be/UB-6dYV_PPQ"
                  className="bg-primary/20 border-gray-700"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {t("audio.linkFormats")}
                </p>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsSettingsOpen(false)}
            >
              {t("audio.cancel")}
            </Button>
            <Button
              className="bg-accent text-primary hover:bg-white transition-colors"
              onClick={saveSettings}
            >
              {t("audio.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}