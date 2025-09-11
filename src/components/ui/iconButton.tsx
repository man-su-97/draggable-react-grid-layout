import * as React from 'react'
import { cn } from '@/lib/utils'

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      {...props}
    />
  )
}
