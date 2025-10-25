import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseArrayString(str:string) {
  if (typeof str !== 'string') return str;
  try {
    const jsonString = str
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') 
      .replace(/'/g, '"'); 
    return JSON.parse(jsonString);
  } catch {
    return str;
  }
}