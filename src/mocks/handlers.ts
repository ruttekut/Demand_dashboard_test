import { rest } from 'msw';
import {
  chatMessages,
  compareSnapshots,
  demandRequests,
  fitScores,
  providerChats,
  providerSummaries,
  quoteAnalyses
} from './data';
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

const findRequest = (id: string): DemandRequest | undefined =>
  demandRequests.find((req) => req.id === id);

const findProvider = (id: string): ProviderSummary | undefined =>
  providerSummaries.find((prov) => prov.id === id);

const findChat = (id: string): ProviderChat | undefined =>
  providerChats.find((chat) => chat.id === id);

export const handlers = [
  rest.get(`${API_BASE}/requests`, (_req, res, ctx) => {
    return res(ctx.json(demandRequests));
  }),
  rest.get(`${API_BASE}/requests/:id`, (req, res, ctx) => {
    const requestId = req.params.id as string;
    const request = findRequest(requestId);
    if (!request) {
      return res(ctx.status(404));
    }
    return res(ctx.json(request));
  }),
  rest.patch(`${API_BASE}/requests/:id`, async (req, res, ctx) => {
    const requestId = req.params.id as string;
    const body = await req.json();
    const existing = findRequest(requestId);
    if (!existing) {
      return res(ctx.status(404));
    }
    const updated: DemandRequest = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString()
    };
    const index = demandRequests.findIndex((r) => r.id === requestId);
    demandRequests[index] = updated;
    return res(ctx.json(updated));
  }),
  rest.get(`${API_BASE}/requests/:id/providers`, (req, res, ctx) => {
    const requestId = req.params.id as string;
    const chats = providerChats.filter((chat) => chat.requestId === requestId);
    const providers = chats
      .map((chat) => findProvider(chat.providerId))
      .filter((prov): prov is ProviderSummary => Boolean(prov));
    return res(ctx.json(providers));
  }),
  rest.get(`${API_BASE}/providers/:id`, (req, res, ctx) => {
    const providerId = req.params.id as string;
    const provider = findProvider(providerId);
    if (!provider) {
      return res(ctx.status(404));
    }
    return res(ctx.json(provider));
  }),
  rest.get(`${API_BASE}/requests/:id/chats`, (req, res, ctx) => {
    const requestId = req.params.id as string;
    const chats = providerChats.filter((chat) => chat.requestId === requestId);
    return res(ctx.json(chats));
  }),
  rest.get(`${API_BASE}/chats/:id/messages`, (req, res, ctx) => {
    const chatId = req.params.id as string;
    const messages = chatMessages
      .filter((msg) => msg.chatId === chatId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return res(ctx.json(messages));
  }),
  rest.post(`${API_BASE}/chats/:id/messages`, async (req, res, ctx) => {
    const chatId = req.params.id as string;
    const body = (await req.json()) as Partial<ChatMessage>;
    const newMsg: ChatMessage = {
      id: `msg-${chatMessages.length + 1}`,
      chatId,
      author: body.author ?? 'user',
      text: body.text ?? '',
      file: body.file,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString()
    };
    chatMessages.push(newMsg);
    return res(ctx.status(201), ctx.json(newMsg));
  }),
  rest.get(`${API_BASE}/requests/:id/fit-scores`, (req, res, ctx) => {
    const requestId = req.params.id as string;
    const scores = fitScores.filter((score) => score.requestId === requestId);
    return res(ctx.json(scores));
  }),
  rest.post(`${API_BASE}/fit-scores`, async (req, res, ctx) => {
    const payload = (await req.json()) as FitScore;
    const index = fitScores.findIndex(
      (score) => score.providerId === payload.providerId && score.requestId === payload.requestId
    );
    if (index >= 0) {
      fitScores[index] = payload;
    } else {
      fitScores.push(payload);
    }
    return res(ctx.status(201), ctx.json(payload));
  }),
  rest.get(`${API_BASE}/quote-analyses`, (_req, res, ctx) => res(ctx.json(quoteAnalyses))),
  rest.get(`${API_BASE}/quote-analyses/:id`, (req, res, ctx) => {
    const analysis = quoteAnalyses.find((qa) => qa.id === (req.params.id as string));
    if (!analysis) {
      return res(ctx.status(404));
    }
    return res(ctx.json(analysis));
  }),
  rest.post(`${API_BASE}/quote-analyses`, async (req, res, ctx) => {
    const payload = (await req.json()) as QuoteAnalysis;
    const newAnalysis: QuoteAnalysis = {
      ...payload,
      id: payload.id ?? `qa-${quoteAnalyses.length + 1}`,
      valueScore: payload.valueScore ?? Math.round(Math.random() * 30 + 60)
    };
    quoteAnalyses.push(newAnalysis);
    return res(ctx.status(201), ctx.json(newAnalysis));
  }),
  rest.get(`${API_BASE}/compare-snapshots`, (req, res, ctx) => {
    const requestId = req.url.searchParams.get('requestId');
    if (requestId) {
      return res(ctx.json(compareSnapshots.filter((snap) => snap.requestId === requestId)));
    }
    return res(ctx.json(compareSnapshots));
  }),
  rest.post(`${API_BASE}/compare-snapshots`, async (req, res, ctx) => {
    const payload = (await req.json()) as CompareSnapshot;
    const snapshot: CompareSnapshot = {
      ...payload,
      id: payload.id ?? `comp-${compareSnapshots.length + 1}`,
      createdAt: new Date().toISOString()
    };
    compareSnapshots.push(snapshot);
    return res(ctx.status(201), ctx.json(snapshot));
  })
];
