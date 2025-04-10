import React, { useRef, useEffect } from 'react';
import { useAudio } from '@/contexts/AudioContext';

interface MusicVisualizerProps {
  className?: string;
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  barCount?: number;
  sensitivity?: number;
}

export default function MusicVisualizer({
  className = '',
  color = '#00ffcc',
  height = 120,
  barWidth = 4,
  gap = 1,
  barCount = 60,
  sensitivity = 1.2
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioRef, isPlaying, beatIntensity } = useAudio();
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = (barWidth + gap) * barCount - gap;
    canvas.height = height;
    
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array;
    let source: MediaElementAudioSourceNode | null = null;
    
    const setupAudio = () => {
      if (!audioRef.current) return;
      
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      draw();
    };
    
    const draw = () => {
      if (!ctx || !analyser) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isPlaying) {
        // Draw static bars when music is paused
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          const barHeight = Math.sin(i * 0.2) * 15 + 25; // Static wave pattern
          
          // Create gradient
          const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
          gradient.addColorStop(0, `${color}80`); // Semi-transparent at top
          gradient.addColorStop(1, color);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      for (let i = 0; i < barCount; i++) {
        // Get data for this bar (scale index to fit dataArray)
        const dataIndex = Math.floor(i * (dataArray.length / barCount));
        let value = dataArray[dataIndex] || 0;
        
        // Apply sensitivity and beatIntensity factor
        value = value * sensitivity * (1 + beatIntensity * 0.5);
        
        // Calculate bar height based on audio data
        const barHeight = (value / 255) * height;
        const x = i * (barWidth + gap);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
        gradient.addColorStop(0, `${color}80`); // Semi-transparent at top
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
      }
      
      // Reset shadow for next frame
      ctx.shadowBlur = 0;
    };
    
    // Only setup audio if it's playing
    if (isPlaying && audioRef.current && !audioContext) {
      setupAudio();
    } else if (animationRef.current) {
      // Just update the existing animation
      draw();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (source && audioContext) {
        source.disconnect();
        analyser?.disconnect();
        // Don't close audioContext as it might be used elsewhere
      }
    };
  }, [isPlaying, audioRef, color, height, barWidth, gap, barCount, sensitivity, beatIntensity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`music-visualizer ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}