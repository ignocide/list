export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  lastNotebookId: string | null;
  lastScrollMemoId: string | null;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: string;
  userId: string;
  notebookId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
}

export interface Attachment {
  id: string;
  memoId: string;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  size: number;
  createdAt: string;
}
