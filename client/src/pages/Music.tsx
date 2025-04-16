import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudio } from '@/contexts/AudioContext';
import { useToast } from '@/hooks/use-toast';
import MusicTrackCard, { MusicTrack } from '@/components/ui/music-track-card';
import MusicVisualizer from '@/components/ui/music-visualizer';
import { ReactiveLogo, ReactiveWaveform } from '@/components/ui/reactive-logo';
import { queryClient } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { PlayCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MusicPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isPlaying, togglePlay, audioRef } = useAudio();
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const isMobile = useIsMobile();
  const pageRef = useRef<HTMLDivElement>(null);
  
  const { data: tracks = [], isLoading } = useQuery<MusicTrack[]>({
    queryKey: ['/api/music'],
    staleTime: 60000,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/music/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/music'] });
      toast({
        title: 'Track deleted',
        description: 'The track has been successfully deleted',
      });
      
      // If current track is deleted, stop playing
      if (currentTrack && currentTrack.id === deleteMutation.variables) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setCurrentTrack(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete track: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle play action
  const handlePlay = (track: MusicTrack) => {
    if (!audioRef.current) return;
    
    // Different track selected
    if (!currentTrack || currentTrack.id !== track.id) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: 'Playback Error',
          description: 'Could not play the selected track',
          variant: 'destructive',
        });
      });
      setCurrentTrack(track);
      return;
    }
    
    // Same track - toggle play/pause
    togglePlay();
  };
  
  // Handle pause action
  const handlePause = () => {
    if (isPlaying) {
      togglePlay();
    }
  };
  
  // Filter tracks based on active tab
  const filteredTracks = () => {
    switch (activeTab) {
      case 'new':
        // Get tracks from the last 30 days
        return tracks.filter(
          track => new Date(track.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
      case 'trending':
        // In a real app, this would be based on play count or similar metrics
        // For now, return a subset of tracks as "trending"
        return tracks.slice(0, Math.min(5, tracks.length));
      default:
        return tracks;
    }
  };
  
  // Scroll to top when changing tabs
  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, [activeTab]);
  
  return (
    <div 
      ref={pageRef}
      className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-32 pb-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header without Visualizer */}
        <div className="relative mb-12">
          <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"></div>
          </div>
          
          <div className="relative z-20 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            {/* Reactive Logo/Title with Waveform */}
            <div className="relative mb-4 w-full max-w-md mx-auto">
              <ReactiveWaveform 
                height={30} // 减小高度
                width={isMobile ? 300 : 500}
                amplitude={5} // 减小波幅
                frequency={0.03} // 调整频率以获得更紧凑的波纹
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full"
              />
              <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron py-3 relative z-10">
                <ReactiveLogo>
                  {t('music.title')}
                </ReactiveLogo>
              </h1>
            </div>
            
            <p className="text-xl text-gray-300 mb-16 max-w-2xl">
              {t('music.subtitle')}
            </p>
            
            {/* 音乐波纹可视化效果 - 不显示上传按钮，前端不需要上传功能 */}
            <div className="w-full relative overflow-hidden mx-auto" style={{ height: "240px" }}>
              <MusicVisualizer 
                className="w-full" 
                height={240} 
                barCount={isMobile ? 100 : 180}
                barWidth={2}
                gap={2}
                sensitivity={1.5}
                position="bottom"
              />
            </div>
          </div>
        </div>
        
        {/* Music Tabs and Track List */}
        <div className="bg-background/30 backdrop-blur-sm rounded-xl border border-accent/10 p-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{t('music.tracksTitle')}</h2>
              
              <TabsList className="bg-background/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-primary">
                  {t('music.allTracks')}
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-accent data-[state=active]:text-primary">
                  {t('music.newReleases')}
                </TabsTrigger>
                <TabsTrigger value="trending" className="data-[state=active]:bg-accent data-[state=active]:text-primary">
                  {t('music.trending')}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {renderTrackList(filteredTracks())}
            </TabsContent>
            
            <TabsContent value="new" className="space-y-4 mt-4">
              {renderTrackList(filteredTracks())}
            </TabsContent>
            
            <TabsContent value="trending" className="space-y-4 mt-4">
              {renderTrackList(filteredTracks())}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
  
  function renderTrackList(tracks: MusicTrack[]) {
    if (isLoading) {
      return (
        <div className="py-12 flex justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    if (tracks.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-xl text-gray-400">No tracks found in this category</p>
          {activeTab !== 'all' && (
            <Button 
              onClick={() => setActiveTab('all')}
              variant="link" 
              className="text-accent mt-2"
            >
              View all tracks
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.map((track) => (
          <MusicTrackCard
            key={track.id}
            track={track}
            isPlaying={isPlaying}
            isActive={currentTrack?.id === track.id}
            onPlay={() => handlePlay(track)}
            onPause={handlePause}
            onDelete={() => {
              if (window.confirm('Are you sure you want to delete this track?')) {
                deleteMutation.mutate(track.id);
              }
            }}
            isAdmin={true} // In a real app, check if user is admin
          />
        ))}
      </div>
    );
  }
}