import React, { useState, useEffect } from 'react';
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
  const [imgError, setImgError] = useState(false);
  const [validUrl, setValidUrl] = useState(false);
  
  // 验证URL是否有效
  useEffect(() => {
    if (!authorProfileImage || 
        authorProfileImage === 'undefined' || 
        authorProfileImage === 'null' || 
        !authorProfileImage.startsWith('http')) {
      setValidUrl(false);
    } else {
      setValidUrl(true);
    }
  }, [authorProfileImage]);

  // 获取用户名首字母(用于回退显示)
  const getInitials = () => {
    if (!authorName || authorName.length === 0) return "?";
    return authorName.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className={className}>
      {validUrl && !imgError ? (
        <AvatarImage 
          src={authorProfileImage!} 
          alt={authorName || "User"}
          onError={() => setImgError(true)}
        />
      ) : (
        <AvatarFallback>{getInitials()}</AvatarFallback>
      )}
    </Avatar>
  );
};

export default EnhancedAvatar;