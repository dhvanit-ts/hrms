import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  className,
  size = 'sm',
  variant = 'outline',
  showText = false
}) => {
  const handleClick = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'transition-all duration-200',
        isLoading && 'cursor-not-allowed',
        className
      )}
    >
      <RotateCcw
        className={cn(
          'h-4 w-4',
          isLoading && 'animate-spin',
          showText && 'mr-2'
        )}
      />
      {showText && (isLoading ? 'Refreshing...' : 'Refresh')}
    </Button>
  );
};