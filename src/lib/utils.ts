import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date(0);
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  // Handle cases where timestamp might be a string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(0);
}
