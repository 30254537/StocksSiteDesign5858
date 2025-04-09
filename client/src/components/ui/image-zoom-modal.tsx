import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  altText: string;
}

export function ImageZoomModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  altText
}: ImageZoomModalProps) {
  const [localIndex, setLocalIndex] = useState(currentIndex);

  // Sync the external index with local state
  useEffect(() => {
    setLocalIndex(currentIndex);
  }, [currentIndex]);

  const handlePrevImage = () => {
    const newIndex = localIndex === 0 ? images.length - 1 : localIndex - 1;
    setLocalIndex(newIndex);
    onIndexChange(newIndex);
  };

  const handleNextImage = () => {
    const newIndex = localIndex === images.length - 1 ? 0 : localIndex + 1;
    setLocalIndex(newIndex);
    onIndexChange(newIndex);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, localIndex, images.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/90 border-accent/50" aria-describedby="zoom-modal-description">
        <VisuallyHidden>
          <DialogTitle>{`${altText} - Image Zoom View`}</DialogTitle>
          <span id="zoom-modal-description">View larger image. Use arrow keys to navigate between images.</span>
        </VisuallyHidden>
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-30 bg-black/70 hover:bg-accent/90 text-white p-2 rounded-full transition-colors opacity-90 shadow-lg"
            aria-label="Close zoom view"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-[95vw] h-[90vh] max-h-[90vh] flex items-center justify-center">
            <img
              src={images[localIndex]}
              alt={`${altText} - zoomed view`}
              className="max-w-full max-h-full object-contain p-4"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 z-20 bg-black/70 hover:bg-accent/90 text-white p-3 rounded-full transition-colors opacity-90 shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 z-20 bg-black/70 hover:bg-accent/90 text-white p-3 rounded-full transition-colors opacity-90 shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => {
                        setLocalIndex(index);
                        onIndexChange(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all shadow-md ${
                        localIndex === index 
                          ? "bg-accent scale-125" 
                          : "bg-white/80 hover:bg-white"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}