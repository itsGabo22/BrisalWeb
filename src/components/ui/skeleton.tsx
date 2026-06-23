import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-brand-neutral-200 dark:bg-brand-neutral-800',
        className
      )}
      {...props}
    />
  );
}
