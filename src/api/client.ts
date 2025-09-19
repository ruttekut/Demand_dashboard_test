import {
  ChatMessage,
  CompareSnapshot,
  DemandRequest,
  FitScore,
  ProviderChat,
  ProviderSummary,
  QuoteAnalysis
} from '../types';

const API_BASE = '/api';

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listRequests(): Promise<DemandRequest[]> {
    return request<DemandRequest[]>(`${API_BASE}/requests`);
  },
  getRequest(id: string): Promise<DemandRequest> {
    return request<DemandRequest>(`${API_BASE}/requests/${id}`);
  },
  updateRequest(id: string, input: Partial<DemandRequest>): Promise<DemandRequest> {
    return request<DemandRequest>(`${API_BASE}/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  },
  listRequestChats(requestId: string): Promise<ProviderChat[]> {
    return request(`${API_BASE}/requests/${requestId}/chats`);
  },
  listRequestProviders(requestId: string): Promise<ProviderSummary[]> {
    return request(`${API_BASE}/requests/${requestId}/providers`);
  },
  listMessages(chatId: string): Promise<ChatMessage[]> {
    return request(`${API_BASE}/chats/${chatId}/messages`);
  },
  sendMessage(chatId: string, message: Partial<ChatMessage>): Promise<ChatMessage> {
    return request(`${API_BASE}/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  },
  listFitScores(requestId: string): Promise<FitScore[]> {
    return request(`${API_BASE}/requests/${requestId}/fit-scores`);
  },
  upsertFitScore(score: FitScore): Promise<FitScore> {
    return request(`${API_BASE}/fit-scores`, {
      method: 'POST',
      body: JSON.stringify(score)
    });
  },
  listQuoteAnalyses(): Promise<QuoteAnalysis[]> {
    return request(`${API_BASE}/quote-analyses`);
  },
  createQuoteAnalysis(analysis: QuoteAnalysis): Promise<QuoteAnalysis> {
    return request(`${API_BASE}/quote-analyses`, {
      method: 'POST',
      body: JSON.stringify(analysis)
    });
  },
  listCompareSnapshots(requestId?: string): Promise<CompareSnapshot[]> {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const url = new URL(`${API_BASE}/compare-snapshots`, base);
    if (requestId) {
      url.searchParams.set('requestId', requestId);
    }
    return request(url);
  },
  createCompareSnapshot(snapshot: CompareSnapshot): Promise<CompareSnapshot> {
    return request(`${API_BASE}/compare-snapshots`, {
      method: 'POST',
      body: JSON.stringify(snapshot)
    });
  }
};
