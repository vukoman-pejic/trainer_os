import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };