import { createContext, useState, useEffect, useRef, useContext, ReactNode } from 'react';

// 音频文件路径 
const DEFAULT_MUSIC_URL = "/uploads/hz9gl-thdkf.mp3";
const FALLBACK_MUSIC_URL = "/uploads/stonks-music.mp3";

// 定义音频上下文类型
interface AudioContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  beatIntensity: number; // 0到1之间的节拍强度值
}

// 创建上下文
const AudioContext = createContext<AudioContextType | null>(null);

// 提供器组件
export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [beatIntensity, setBeatIntensity] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // 播放/暂停音乐
  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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
        startAnalyzing();
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  // 初始化音频分析器
  const setupAnalyser = () => {
    if (!audioRef.current) return;
    
    try {
      // 创建音频上下文
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建媒体源节点
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      // 创建分析器节点
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // 连接节点
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // 创建数据数组
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // 开始分析
      startAnalyzing();
    } catch (error) {
      console.error("设置音频分析器时出错:", error);
    }
  };

  // 分析音频数据
  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    // 获取频率数据
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // 计算平均振幅
    const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;
    
    // 将平均值归一化到0-1范围
    const normalizedValue = Math.min(1, average / 128);
    
    // 更新状态
    setBeatIntensity(normalizedValue);
    
    // 继续循环
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  // 开始分析
  const startAnalyzing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };
  
  // 初始化音频并尝试播放
  const initAudio = () => {
    // 创建一个用户交互事件处理器
    const userInteractionHandler = () => {
      if (audioRef.current) {
        // 尝试播放音频
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setupAnalyser();
          }).catch(error => {
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
        audioRef.current.play().then(() => {
          setupAnalyser();
        }).catch(error => {
          console.error("备用音乐播放被阻止:", error);
          // 添加用户交互事件监听器
          document.addEventListener('click', userInteractionHandler);
          document.addEventListener('touchstart', userInteractionHandler);
        });
      }
    };
    
    // 当音频可以播放时设置分析器
    audioRef.current.oncanplaythrough = () => {
      setupAnalyser();
    };
    
    // 尝试播放
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setupAnalyser();
      }).catch(error => {
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
    initAudio();
    
    // 组件卸载时清理
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <AudioContext.Provider value={{ isPlaying, togglePlay, audioRef, beatIntensity }}>
      {children}
    </AudioContext.Provider>
  );
}

// 自定义Hook
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio必须在AudioProvider内部使用');
  }
  return context;
}