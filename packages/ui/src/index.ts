import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Tag,
  Paperclip,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Check,
  Notebook,
} from 'lucide-react';
