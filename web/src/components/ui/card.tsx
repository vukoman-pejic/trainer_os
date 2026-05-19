import * as React from 'react';
import { cn } from '../../lib/utils';

function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl',
        className
      )}
      {...props}
    />
  );
}

export { Card };