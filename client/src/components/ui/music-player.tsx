import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAudio } from "@/contexts/AudioContext";

export function MusicPlayer() {
  const { t } = useLanguage();
  const { isPlaying, togglePlay } = useAudio();
  
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