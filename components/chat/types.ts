import type { ActionChip } from "./ActionChips";

export type QuizQuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface LineItem {
  label: string;
  amount: string;
  period?: string;
}

export interface FinancialBreakdown {
  hasFinancialData: boolean;
  revenue: LineItem[];
  expenses: LineItem[];
  profitLoss: LineItem[];
  notes: string;
}

export interface BusinessAnalysis {
  executiveSummary: string;
  risks: string[];
  opportunities: string[];
  actionItems: string[];
  decisions: string[];
  importantDates: string[];
  financials: FinancialBreakdown;
}

export interface ChatMessageMetadata {
  suggestedActions?: ActionChip[];
  audio?: { url: string | null; status: "pending" | "generating" | "ready" | "failed" | "not_configured"; title: string; section?: string; text?: string };
  audioPlaylist?: { section: string; url: string | null; status: "ready" | "failed" | "not_configured" }[];
  creatorAudio?: { documentId: string };
  quiz?: Quiz;
  financials?: FinancialBreakdown;
  businessAnalysis?: BusinessAnalysis;
  documentName?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: ChatMessageMetadata;
  pending?: boolean;
}
