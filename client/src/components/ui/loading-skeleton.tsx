import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => {
  return (
    <div 
      className={cn(
        "rounded-md bg-gray-800 animate-pulse", 
        className
      )} 
    />
  );
};

export default LoadingSkeleton;