import React from 'react';
import { Play, Pause, Edit2, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  filename: string;
  duration: number;
  url: string;
  createdAt: string;
}

interface MusicTrackCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  isActive: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isAdmin?: boolean;
  className?: string;
}

export default function MusicTrackCard({
  track,
  isPlaying,
  isActive,
  onPlay,
  onPause,
  onDelete,
  onEdit,
  isAdmin = false,
  className = '',
}: MusicTrackCardProps) {
  const { t } = useLanguage();
  
  return (
    <div 
      className={cn(
        'group flex items-center justify-between p-3 rounded-lg transition-all duration-300',
        isActive 
          ? 'bg-accent/10 border border-accent/30' 
          : 'bg-background/30 hover:bg-background/50 border border-transparent hover:border-accent/20',
        className
      )}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="relative">
          <div 
            className={cn(
              "w-12 h-12 rounded-md bg-gradient-to-br from-accent/40 to-primary/30 flex items-center justify-center",
              isActive && "shadow-lg shadow-accent/20"
            )}
          >
            <Button
              onClick={isPlaying && isActive ? onPause : onPlay}
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-accent"
            >
              {isPlaying && isActive ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          </div>
          {isActive && isPlaying && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-md font-medium truncate text-white group-hover:text-accent transition-colors">
            {track.title}
          </h3>
          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
        </div>
        
        <div className="text-xs text-gray-500 mr-2">
          {formatDuration(track.duration)}
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onEdit && (
            <Button 
              onClick={onEdit} 
              size="icon" 
              variant="ghost"
              className="h-8 w-8 text-gray-400 hover:text-accent hover:bg-accent/10"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={onDelete} 
              size="icon" 
              variant="ghost"
              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}