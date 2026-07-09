// libs/ui/src/lib/cn.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines conditional class names and resolves conflicting Tailwind utilities.
 *
 * @example
 * cn('px-3 py-2', isActive && 'bg-ae-primary', className);
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
