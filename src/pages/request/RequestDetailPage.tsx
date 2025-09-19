import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { DemandRequest, DemandRequestStatus, FileRef, ProviderChat, ProviderSummary } from '../../types';
import { formatDistanceToNow } from '../../utils/date';
import { ChatWorkspace } from '../../features/chat/ChatWorkspace';
import { CompareWorkspace } from '../../features/compare/CompareWorkspace';
import { GuidanceWorkspace } from '../../features/guidance/GuidanceWorkspace';
import { useTelemetry } from '../../telemetry/TelemetryProvider';
import { useRequestUiStore } from '../../state/useRequestUiStore';

const statusOrder: DemandRequestStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];

function StatusStepper({ status }: { status: DemandRequestStatus }) {
  return (
    <ol className="flex items-center gap-4" aria-label="Request status">
      {statusOrder.map((value) => {
        const done = statusOrder.indexOf(value) <= statusOrder.indexOf(status);
        return (
          <li key={value} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                done ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-slate-200 text-slate-400'
              }`}
              aria-current={status === value ? 'step' : undefined}
            >
              {statusOrder.indexOf(value) + 1}
            </span>
            <span className={done ? 'text-slate-900' : 'text-slate-400'}>
              {value.replace('_', ' ')}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AttachmentManager({ attachments }: { attachments: FileRef[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-600">No attachments yet.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2" role="list">
      {attachments.map((file) => (
        <li key={file.id} className="flex items-center gap-3 rounded border border-slate-200 bg-white p-3 text-sm">
          <span className="flex-1">
            <span className="block font-medium text-slate-900">{file.name}</span>
            <span className="text-xs text-slate-500">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
          </span>
          <a href={file.url} download className="rounded bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function RequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'chats') as 'chats' | 'compare' | 'guidance';
  const { selectChat } = useRequestUiStore();
  const { track } = useTelemetry();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [pendingDescription, setPendingDescription] = useState('');

  useEffect(() => {
    if (!requestId) {
      navigate('/');
    }
  }, [requestId, navigate]);

  const requestQuery = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => api.getRequest(requestId!),
    enabled: Boolean(requestId)
  });

  const chatsQuery = useQuery({
    queryKey: ['request-chats', requestId],
    queryFn: () => api.listRequestChats(requestId!),
    enabled: Boolean(requestId)
  });

  const providersQuery = useQuery({
    queryKey: ['request-providers', requestId],
    queryFn: () => api.listRequestProviders(requestId!),
    enabled: Boolean(requestId)
  });

  const updateRequestMutation = useMutation({
    mutationFn: (input: Partial<DemandRequest>) => api.updateRequest(requestId!, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['request', requestId], updated);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });

  const request = requestQuery.data;
  const chats = chatsQuery.data ?? [];
  const providers = providersQuery.data ?? [];

  useEffect(() => {
    if (request && chats.length > 0) {
      selectChat(request.id, chats[0].id);
    }
  }, [request, chats, selectChat]);

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'chats' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const providerMap = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);

  const handleEditDescription = () => {
    if (!request) return;
    setIsEditingDescription(true);
    setPendingDescription(request.description);
  };

  const handleSaveDescription = async () => {
    if (!request) return;
    if (!pendingDescription.trim()) return;
    await updateRequestMutation.mutateAsync({ description: pendingDescription.trim() });
    setIsEditingDescription(false);
    track('description_edited', { requestId: request.id });
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!request) return;
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    const newFiles: FileRef[] = Array.from(fileList).map((file, index) => ({
      id: `${request.id}-file-${Date.now()}-${index}`,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url: URL.createObjectURL(file)
    }));
    await updateRequestMutation.mutateAsync({ attachments: [...request.attachments, ...newFiles] });
  };

  const handleReminder = () => {
    if (!request) return;
    const value = window.prompt('Set reminder (e.g., tomorrow 9am)');
    if (value) {
      track('reminder_set', { requestId: request.id, reminder: value });
      alert(`Reminder scheduled: ${value}`);
    }
  };

  if (requestQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading request…</p>;
  }

  if (!request) {
    return <p className="text-sm text-rose-600">Request not found.</p>;
  }

  const tabButton = (tab: 'chats' | 'compare' | 'guidance', label: string, description: string) => (
    <button
      key={tab}
      role="tab"
      aria-selected={activeTab === tab}
      className={`rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring ${
        activeTab === tab ? 'border-brand-500 text-brand-700 shadow' : 'border-transparent text-slate-600'
      }`}
      onClick={() => setSearchParams({ tab })}
      aria-controls={`${tab}-panel`}
    >
      <span className="block text-left">{label}</span>
      <span className="block text-xs font-normal text-slate-500">{description}</span>
    </button>
  );

  const attachments = request.attachments;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">{request.title}</h1>
            <p className="text-sm text-slate-600">
              {request.category} • {request.location} • Updated {formatDistanceToNow(request.updatedAt)}
            </p>
            <StatusStepper status={request.status} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring"
              onClick={handleReminder}
            >
              Set reminder
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {isEditingDescription ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="description-editor">
                Description
              </label>
              <textarea
                id="description-editor"
                value={pendingDescription}
                onChange={(event) => setPendingDescription(event.target.value)}
                rows={4}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring"
                  onClick={handleSaveDescription}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
                  onClick={() => setIsEditingDescription(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-700">{request.description}</p>
              <button
                type="button"
                className="rounded border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
                onClick={handleEditDescription}
              >
                Edit description
              </button>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Attachments</h2>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 focus-within:outline-none focus-within:ring">
                <span>Upload</span>
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={handleAttachmentUpload}
                  aria-label="Upload attachments"
                />
              </label>
            </div>
            <AttachmentManager attachments={attachments} />
          </div>
        </div>
      </div>

      <div>
        <div role="tablist" aria-label="Request tools" className="flex flex-wrap gap-3">
          {tabButton('chats', 'Chats', 'Coordinate with providers')}
          {tabButton('compare', 'Compare', 'Side-by-side evaluation')}
          {tabButton('guidance', 'Guidance', 'AI quote insights')}
        </div>
        <section id="chats-panel" role="tabpanel" hidden={activeTab !== 'chats'} className="mt-4">
          <ChatWorkspace
            request={request}
            chats={chats}
            providerMap={providerMap}
          />
        </section>
        <section id="compare-panel" role="tabpanel" hidden={activeTab !== 'compare'} className="mt-4">
          <CompareWorkspace request={request} providers={providers} />
        </section>
        <section id="guidance-panel" role="tabpanel" hidden={activeTab !== 'guidance'} className="mt-4">
          <GuidanceWorkspace request={request} providerMap={providerMap} chats={chats} />
        </section>
      </div>
    </div>
  );
}
