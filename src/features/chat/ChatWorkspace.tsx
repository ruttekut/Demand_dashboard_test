import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DemandRequest, ProviderChat, ProviderSummary, ChatMessage, FitScore } from '../../types';
import { useRequestUiStore } from '../../state/useRequestUiStore';
import { useTelemetry } from '../../telemetry/TelemetryProvider';
import { socket } from '../../api/mockSocket';
import { computeFitScore } from './fitScore';
import { formatDistanceToNow } from '../../utils/date';

const quickPrompts = ['Ask about warranty', 'Clarify scope', 'Request timeline', 'Discuss budget'];

interface ChatWorkspaceProps {
  request: DemandRequest;
  chats: ProviderChat[];
  providerMap: Map<string, ProviderSummary>;
}

export function ChatWorkspace({ request, chats, providerMap }: ChatWorkspaceProps) {
  const queryClient = useQueryClient();
  const { selectedChatByRequest, selectChat, composerDrafts, setComposerDraft, clearComposerDraft } = useRequestUiStore();
  const { track } = useTelemetry();
  const activeChatId = selectedChatByRequest[request.id] ?? chats[0]?.id;
  const [typingProviderId, setTypingProviderId] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (!activeChatId && chats[0]) {
      selectChat(request.id, chats[0].id);
    }
  }, [activeChatId, chats, request.id, selectChat]);

  useEffect(() => {
    if (!activeChatId) return;
    const offMessage = socket.on('message', ({ chatId, message }) => {
      if (chatId === activeChatId) {
        queryClient.setQueryData<ChatMessage[]>(['messages', chatId], (prev = []) => [...prev, message]);
      }
    });
    const offTyping = socket.on('typing', ({ chatId, providerId }) => {
      if (chatId === activeChatId) {
        setTypingProviderId(providerId);
        window.setTimeout(() => setTypingProviderId(null), 3000);
      }
    });
    return () => {
      offMessage();
      offTyping();
    };
  }, [activeChatId, queryClient]);

  const fitScoresQuery = useQuery({
    queryKey: ['fit-scores', request.id],
    queryFn: () => api.listFitScores(request.id)
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', activeChatId],
    queryFn: () => api.listMessages(activeChatId!),
    enabled: Boolean(activeChatId)
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: string; message: Partial<ChatMessage> }) =>
      api.sendMessage(chatId, message),
    onMutate: async ({ chatId, message }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      const previous = queryClient.getQueryData<ChatMessage[]>(['messages', chatId]);
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        chatId,
        author: 'user',
        text: message.text ?? '',
        file: message.file,
        createdAt: new Date().toISOString(),
        pending: true
      };
      queryClient.setQueryData<ChatMessage[]>(['messages', chatId], (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_error, { chatId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', chatId], context.previous);
      }
    },
    onSettled: (_data, _error, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    }
  });

  const upsertFitScoreMutation = useMutation({
    mutationFn: (score: FitScore) => api.upsertFitScore(score),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fit-scores', request.id] })
  });

  const handleSendMessage = async (event: FormEvent | KeyboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    if (!activeChatId) return;
    const draft = composerDrafts[activeChatId];
    if (!draft?.trim() && attachments.length === 0) return;
    const file = attachments[0];
    const filePayload = file
      ? {
          id: `${activeChatId}-upload-${Date.now()}`,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          url: URL.createObjectURL(file)
        }
      : undefined;
    await sendMessageMutation.mutateAsync({
      chatId: activeChatId,
      message: { text: draft, file: filePayload }
    });
    clearComposerDraft(activeChatId);
    setAttachments([]);
    track('message_sent', { requestId: request.id, chatId: activeChatId });

    const chat = chats.find((item) => item.id === activeChatId);
    const provider = chat ? providerMap.get(chat.providerId) : undefined;
    if (chat && provider) {
      const updatedScore = computeFitScore({
        request,
        provider,
        previous: fitScoresQuery.data?.find((score) => score.providerId === provider.id),
        signal: 'user_message'
      });
      upsertFitScoreMutation.mutate(updatedScore);
    }
  };

  const selectProvider = (chatId: string) => {
    selectChat(request.id, chatId);
    setTimeout(() => {
      messageListRef.current?.focus();
    }, 50);
    track('provider_selected', { requestId: request.id, chatId });
  };

  const activeMessages = messagesQuery.data ?? [];
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const activeProvider = activeChat ? providerMap.get(activeChat.providerId) : undefined;
  const fitScore = activeProvider
    ? fitScoresQuery.data?.find((score) => score.providerId === activeProvider.id)
    : undefined;

  const unreadChatIds = useMemo(() => {
    const result = new Set<string>();
    chats.forEach((chat) => {
      const lastMessage = queryClient.getQueryData<ChatMessage[]>(['messages', chat.id])?.slice(-1)[0];
      if (lastMessage && new Date(lastMessage.createdAt) > new Date(chat.lastReadAt)) {
        result.add(chat.id);
      }
    });
    return result;
  }, [chats, queryClient]);

  const handlePromptClick = (prompt: string) => {
    if (!activeChatId) return;
    const existing = composerDrafts[activeChatId] ?? '';
    const merged = existing ? `${existing.trim()} ${prompt}?` : `${prompt}?`;
    setComposerDraft(activeChatId, merged);
    composerRef.current?.focus();
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    setAttachments(Array.from(event.target.files));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3" aria-label="Providers">
        <h2 className="text-sm font-semibold text-slate-700">Providers</h2>
        <ul className="space-y-2" role="list">
          {chats.map((chat) => {
            const provider = providerMap.get(chat.providerId);
            if (!provider) return null;
            const isActive = chat.id === activeChatId;
            const score = fitScoresQuery.data?.find((item) => item.providerId === provider.id);
            const unread = unreadChatIds.has(chat.id);
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => selectProvider(chat.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm focus:outline-none focus:ring ${
                    isActive ? 'border-brand-500 bg-brand-50 text-brand-700 shadow' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  aria-current={isActive}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{provider.displayName}</span>
                    {score && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {score.score}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{provider.locationCity}</p>
                  {unread && <span className="mt-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">Unread</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <section className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm" aria-live="polite">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{activeProvider?.displayName ?? 'Select a provider'}</h2>
            {activeProvider && (
              <p className="text-xs text-slate-500">
                {activeProvider.introText.slice(0, 100)}
                {activeProvider.introText.length > 100 ? '…' : ''}
              </p>
            )}
          </div>
          {fitScore && (
            <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Fit score {fitScore.score}
            </div>
          )}
        </header>
        <div
          ref={messageListRef}
          tabIndex={0}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4 focus:outline-none"
          aria-label="Chat messages"
        >
          {activeMessages.map((message) => (
            <article
              key={message.id}
              className={`max-w-lg rounded-lg border px-3 py-2 text-sm shadow ${
                message.author === 'user'
                  ? 'ml-auto border-brand-200 bg-brand-50 text-brand-900'
                  : message.author === 'system'
                  ? 'mx-auto border-dashed border-slate-300 bg-slate-100 text-slate-600'
                  : 'mr-auto border-slate-200 bg-white text-slate-800'
              }`}
            >
              <header className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                <span>{message.author}</span>
                <span>{formatDistanceToNow(message.createdAt)}</span>
              </header>
              <p>{message.text}</p>
              {message.file && (
                <a
                  href={message.file.url}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Attachment: {message.file.name}
                </a>
              )}
              {message.pending && <span className="mt-1 block text-[10px] uppercase text-slate-400">Sending…</span>}
              {message.deliveredAt && !message.pending && (
                <span className="mt-1 block text-[10px] uppercase text-slate-400">Delivered</span>
              )}
            </article>
          ))}
          {typingProviderId && activeProvider && typingProviderId === activeProvider.id && (
            <p className="text-xs text-slate-500">{activeProvider.displayName} is typing…</p>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4" aria-label="Send a message">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="chat-composer">
            Message
          </label>
          <textarea
            id="chat-composer"
            ref={composerRef}
            value={activeChatId ? composerDrafts[activeChatId] ?? '' : ''}
            onChange={(event) => activeChatId && setComposerDraft(activeChatId, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                handleSendMessage(event);
              }
            }}
            rows={3}
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring"
            aria-describedby="composer-help"
          />
          <p id="composer-help" className="mt-1 text-xs text-slate-500">
            Attach PDFs or images below. Press Ctrl+Enter to send.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 focus-within:outline-none focus-within:ring">
              <span>Attach</span>
              <input
                type="file"
                className="sr-only"
                onChange={handleAttachmentChange}
                accept="image/*,application/pdf"
                aria-label="Upload a file"
              />
            </label>
            {attachments.length > 0 && (
              <span className="text-xs text-slate-500">{attachments.length} file ready to send</span>
            )}
            <button
              type="submit"
              className="ml-auto inline-flex items-center rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
