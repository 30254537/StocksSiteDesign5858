import { createContext, useState, useEffect, useRef, useContext, ReactNode } from 'react';

// 音频文件路径 
const DEFAULT_MUSIC_URL = "/uploads/hz9gl-thdkf.mp3";
const FALLBACK_MUSIC_URL = "/uploads/stonks-music.mp3";

// 定义音频上下文类型
interface MusicContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  beatIntensity: number; // 0到1之间的节拍强度值
}

// 创建上下文
const MusicContext = createContext<MusicContextType | null>(null);

// 提供器组件
export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<any>(null); // 使用any类型避免与Web Audio API的AudioContext冲突
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
      // 检查是否已经创建了音频上下文和分析器
      if (!audioContextRef.current) {
        // 创建音频上下文
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // 创建媒体源节点
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        
        // 创建分析器节点
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512; // 增加FFT大小以获得更精确的频率分析
        analyserRef.current.smoothingTimeConstant = 0.8; // 平滑过渡
        
        // 连接节点
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        // 创建数据数组
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }
      
      // 恢复音频上下文（可能被浏览器暂停）
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // 开始分析
      startAnalyzing();
    } catch (error) {
      console.error("设置音频分析器时出错:", error);
      // 即使设置失败，也要提供一个默认的节拍强度
      // 通过定时函数模拟节拍
      if (!animationFrameRef.current) {
        let intensity = 0;
        const simulateBeats = () => {
          intensity = (intensity + 0.05) % 1;
          setBeatIntensity(Math.sin(intensity * Math.PI) * 0.7 + 0.3);
          animationFrameRef.current = requestAnimationFrame(simulateBeats);
        };
        animationFrameRef.current = requestAnimationFrame(simulateBeats);
      }
    }
  };

  // 分析音频数据
  const prevBeatValuesRef = useRef<number[]>([]);
  const beatHistoryRef = useRef<number[]>([]);
  const prevTimestampRef = useRef<number>(0);
  
  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    const timestamp = performance.now();
    const deltaTime = timestamp - prevTimestampRef.current;
    prevTimestampRef.current = timestamp;
    
    // 获取频率数据
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // 计算各个频段的能量
    // 低频(bass)部分 (20-150Hz) - 通常包含低音鼓和贝斯的节拍信息
    const bassRange = dataArrayRef.current.slice(0, Math.floor(dataArrayRef.current.length * 0.08));
    const bassAverage = bassRange.reduce((acc, val) => acc + val, 0) / bassRange.length;
    
    // 低中频部分 (150-500Hz) - 包含更多节奏元素
    const lowMidRange = dataArrayRef.current.slice(
      Math.floor(dataArrayRef.current.length * 0.08),
      Math.floor(dataArrayRef.current.length * 0.15)
    );
    const lowMidAverage = lowMidRange.reduce((acc, val) => acc + val, 0) / lowMidRange.length;
    
    // 中频部分 (500Hz-2kHz) - 包含主要和声和旋律
    const midRange = dataArrayRef.current.slice(
      Math.floor(dataArrayRef.current.length * 0.15),
      Math.floor(dataArrayRef.current.length * 0.4)
    );
    const midAverage = midRange.reduce((acc, val) => acc + val, 0) / midRange.length;
    
    // 保存前几帧的低频值，用于检测节拍
    if (!prevBeatValuesRef.current) {
      prevBeatValuesRef.current = [];
    }
    
    // 存储历史值 (最多30帧)
    prevBeatValuesRef.current.push(bassAverage);
    if (prevBeatValuesRef.current.length > 30) {
      prevBeatValuesRef.current.shift();
    }
    
    // 计算低频的平均值和标准差，用于识别显著的节拍
    const avgBass = prevBeatValuesRef.current.reduce((acc, val) => acc + val, 0) / prevBeatValuesRef.current.length;
    const variance = prevBeatValuesRef.current.reduce((acc, val) => acc + Math.pow(val - avgBass, 2), 0) / prevBeatValuesRef.current.length;
    const stdDev = Math.sqrt(variance);
    
    // 节拍检测 - 当当前的低频值显著高于平均值时
    const beatThreshold = avgBass + (stdDev * 0.8); // 可调整阈值敏感度
    const isBeat = bassAverage > beatThreshold && bassAverage > 50; // 确保有足够的音量
    
    // 创建节拍反应值 - 如果检测到节拍，则迅速增加强度
    let beatReaction = 0;
    if (isBeat) {
      beatReaction = Math.min(1, bassAverage / 200); // 根据低音强度调整节拍反应
    }
    
    // 保存节拍历史以创建衰减效果
    beatHistoryRef.current.push(beatReaction);
    if (beatHistoryRef.current.length > 20) { // 调整此值以控制节拍效果的持续时间
      beatHistoryRef.current.shift();
    }
    
    // 计算当前节拍强度 - 随时间指数衰减
    const currentBeatStrength = beatHistoryRef.current.length > 0 
      ? Math.max(...beatHistoryRef.current) 
      : 0;
    
    // 添加平滑渐变效果
    const fadeSpeed = 0.05; // 值越小，衰减越慢
    for (let i = 0; i < beatHistoryRef.current.length; i++) {
      beatHistoryRef.current[i] *= (1 - fadeSpeed);
    }
    
    // 综合加权 - 结合实时频谱分析与节拍检测
    // 权重较高的低频以强调节拍，同时也加入一定的中频信息以增加反应的丰富性
    const spectrumWeight = 0.5;
    const beatWeight = 0.5;
    
    const spectrumValue = (
      (bassAverage * 0.6) + 
      (lowMidAverage * 0.3) + 
      (midAverage * 0.1)
    ) / 255;
    
    // 最终的节拍强度计算
    let finalBeatIntensity = (
      (spectrumValue * spectrumWeight) + 
      (currentBeatStrength * beatWeight)
    );
    
    // 确保值在0-1范围内
    finalBeatIntensity = Math.min(1, Math.max(0, finalBeatIntensity));
    
    // 更新状态
    setBeatIntensity(finalBeatIntensity);
    
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
    <MusicContext.Provider value={{ isPlaying, togglePlay, audioRef, beatIntensity }}>
      {children}
    </MusicContext.Provider>
  );
}

// 创建稳定的引用以支持HMR
export const useAudio = function useAudioHook() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useAudio必须在AudioProvider内部使用');
  }
  return context;
}