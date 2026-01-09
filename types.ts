
export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'short' | 'moderate' | 'long';
  subject: string;
  timestamp: number;
}

export interface Question {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  type: 'mcq' | 'classic';
}

export interface HistoryItem {
  id: string;
  action: string;
  type: 'note' | 'voice' | 'practice';
  timestamp: number;
  details: string;
}

export type Theme = 'light' | 'dark';
