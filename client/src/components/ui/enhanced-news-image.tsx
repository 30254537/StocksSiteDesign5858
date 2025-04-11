import React, { useState, useEffect } from 'react';

interface EnhancedNewsImageProps {
  source: string;
  sourceName: string;
  fallbackImage: string;
  className?: string;
  alt?: string;
}

export const EnhancedNewsImage: React.FC<EnhancedNewsImageProps> = ({
  source,
  sourceName,
  fallbackImage,
  className = "w-full h-full object-cover",
  alt = "News image"
}) => {
  const [imgError, setImgError] = useState(false);
  const [validUrl, setValidUrl] = useState(false);
  
  // 验证URL是否有效
  useEffect(() => {
    if (!source || 
        source === 'undefined' || 
        source === 'null' || 
        !source.startsWith('http')) {
      setValidUrl(false);
    } else {
      setValidUrl(true);
    }
  }, [source]);

  return (
    <>
      {validUrl && !imgError ? (
        <img 
          src={source} 
          alt={alt}
          className={className}
          onError={() => setImgError(true)}
        />
      ) : (
        <img 
          src={fallbackImage} 
          alt={`${sourceName} news`}
          className={className}
        />
      )}
    </>
  );
};

export default EnhancedNewsImage;