import * as React from 'react';

export function Skeleton({ className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      style={style}
      {...props}
    />
  );
}
