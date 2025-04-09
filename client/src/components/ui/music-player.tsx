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

// 默认音乐URL - YouTube 嵌入式播放
const DEFAULT_MUSIC_URL = "https://www.youtube.com/embed/UB-6dYV_PPQ?si=8bGAxT_9TsLwwVlp&autoplay=1&loop=1&playlist=UB-6dYV_PPQ";

export function MusicPlayer() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicUrl, setMusicUrl] = useState(DEFAULT_MUSIC_URL);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // 播放/暂停音乐
  const togglePlay = () => {
    if (isPlaying) {
      if (iframeRef.current && iframeRef.current.parentNode) {
        // 移除 iframe 来停止音乐
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    } else {
      // 创建一个隐藏的 iframe 来播放音乐
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.allow = 'autoplay';
      iframe.src = musicUrl;
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // 保存新的音乐链接
  const saveSettings = () => {
    if (inputUrl) {
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
      
      setMusicUrl(embedUrl);
      
      // 如果当前正在播放，重新开始播放新的音乐
      if (isPlaying && iframeRef.current) {
        iframeRef.current.remove();
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.allow = 'autoplay';
        iframe.src = embedUrl;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }
    }
    setIsSettingsOpen(false);
  };
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.remove();
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
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://youtu.be/UB-6dYV_PPQ"
              className="bg-primary/20 border-gray-700"
            />
            <p className="text-xs text-gray-400 mt-2">
              {t("audio.linkFormats")}
            </p>
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