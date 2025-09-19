export type DemandRequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface FileRef {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface DemandRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: DemandRequestStatus;
  location: string;
  budget: { min: number; max: number; currency: string } | null;
  deadline: string | null;
  attachments: FileRef[];
  providerChatIds: string[];
}

export interface ProviderSummary {
  id: string;
  displayName: string;
  introText: string;
  ratingAvg: number;
  ratingCount: number;
  yearsInBusiness: number;
  badges: string[];
  responseTimeMinutesAvg: number;
  availability: string;
  priceRange: string | null;
  locationCity: string;
}

export interface ProviderChat {
  id: string;
  requestId: string;
  providerId: string;
  lastReadAt: string;
  createdAt: string;
}

export type ChatAuthor = 'user' | 'provider' | 'system';

export interface ChatMessage {
  id: string;
  chatId: string;
  author: ChatAuthor;
  text: string;
  file?: FileRef | null;
  createdAt: string;
  pending?: boolean;
  deliveredAt?: string;
  readAt?: string;
}

export interface QuoteAnalysisFindings {
  summary: string;
  totalPrice?: number;
  includes: string[];
  excludes: string[];
  risks: string[];
  warranty?: string | null;
  timeline?: string | null;
}

export interface QuoteAnalysis {
  id: string;
  requestId: string;
  providerId: string | null;
  uploadedFile: FileRef;
  findings: QuoteAnalysisFindings;
  suggestedQuestions: string[];
  valueScore: number;
}

export interface FitScore {
  providerId: string;
  requestId: string;
  score: number;
  reasons: string[];
}

export interface CompareSnapshot {
  id: string;
  requestId: string;
  providerIds: string[];
  createdAt: string;
  criteria: string[];
  notes: string;
}

export interface TelemetryEvent {
  name:
    | 'request_opened'
    | 'message_sent'
    | 'quote_uploaded'
    | 'compare_started'
    | 'provider_selected'
    | 'reminder_set'
    | 'description_edited'
    | 'compare_shared'
    | 'compare_exported';
  payload?: Record<string, unknown>;
  occurredAt: string;
}
