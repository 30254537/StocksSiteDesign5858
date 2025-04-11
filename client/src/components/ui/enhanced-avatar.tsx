import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EnhancedAvatarProps {
  authorName: string;
  authorProfileImage: string | null;
  className?: string;
}

export const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({
  authorName,
  authorProfileImage,
  className = "h-10 w-10"
}) => {
  return (
    <Avatar className={className}>
      {authorProfileImage && authorProfileImage !== 'undefined' && authorProfileImage !== 'null' ? (
        <AvatarImage 
          src={authorProfileImage} 
          alt={authorName}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // 防止循环
            // 隐藏图片
            target.style.display = 'none';
            // 显示回退头像
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
      ) : (
        <AvatarFallback>{authorName.substring(0, 2)}</AvatarFallback>
      )}
    </Avatar>
  );
};

export default EnhancedAvatar;