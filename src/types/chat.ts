export type Category = '進路' | '学習' | '人間関係';

export type ChatMode = 'normal' | 'detailed' | 'quick' | 'encouraging';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  category?: Category;
  mode?: ChatMode;
}

export interface ChatHistory {
  id: string;
  studentId: string;
  question: string;
  aiResponse: string;
  category: Category;
  chatMode: ChatMode;
  isAnonymous: boolean;
  urgencyLevel: number;
  teacherComment?: string;
  isFlagged: boolean;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  category: Category;
  mode: ChatMode;
  isAnonymous: boolean;
  urgencyLevel: number;
}