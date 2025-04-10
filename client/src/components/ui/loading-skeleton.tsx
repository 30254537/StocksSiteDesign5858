import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-800 rounded-lg", 
        className
      )}
    />
  );
};

export default LoadingSkeleton;