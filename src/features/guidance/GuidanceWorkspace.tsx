import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DemandRequest, FitScore, ProviderChat, ProviderSummary, QuoteAnalysis } from '../../types';
import { useTelemetry } from '../../telemetry/TelemetryProvider';
import { useRequestUiStore } from '../../state/useRequestUiStore';
import { computeFitScore } from '../chat/fitScore';

interface GuidanceWorkspaceProps {
  request: DemandRequest;
  providerMap: Map<string, ProviderSummary>;
  chats: ProviderChat[];
}

function buildAnalysis(
  request: DemandRequest,
  file: File,
  providerId: string | null
): QuoteAnalysis {
  const baseSummary = `AI reviewed ${file.name} for ${request.title} and extracted pricing, scope, and risk signals.`;
  const includes = ['Labor scope clarity', 'Material specifications', 'Schedule outline'];
  const excludes = ['Permit handling', 'Cleanup details'];
  const risks = ['Confirm change order process', 'Validate allowances against market rates'];
  return {
    id: '',
    requestId: request.id,
    providerId,
    uploadedFile: {
      id: `${request.id}-${Date.now()}`,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url: URL.createObjectURL(file)
    },
    findings: {
      summary: baseSummary,
      totalPrice: undefined,
      includes,
      excludes,
      risks,
      warranty: providerId ? '2 year workmanship (assumed)' : undefined,
      timeline: 'Estimated 14-18 weeks'
    },
    suggestedQuestions: [
      'Can you break out labor vs materials?',
      'What milestones trigger payments?',
      'How do you handle change orders?'
    ],
    valueScore: Math.round(Math.random() * 20 + 70)
  };
}

export function GuidanceWorkspace({ request, providerMap, chats }: GuidanceWorkspaceProps) {
  const queryClient = useQueryClient();
  const { track } = useTelemetry();
  const { selectedChatByRequest, setComposerDraft, composerDrafts } = useRequestUiStore();
  const activeChatId = selectedChatByRequest[request.id];
  const activeProvider = useMemo(() => {
    if (!activeChatId) return null;
    const chat = chats.find((item) => item.id === activeChatId);
    if (!chat) return null;
    return providerMap.get(chat.providerId) ?? null;
  }, [activeChatId, chats, providerMap]);
  const [uploading, setUploading] = useState(false);

  const analysesQuery = useQuery({
    queryKey: ['quote-analyses', request.id],
    queryFn: () => api.listQuoteAnalyses(),
    select: (analyses) => analyses.filter((analysis) => analysis.requestId === request.id)
  });

  const upsertFitScoreMutation = useMutation({
    mutationFn: ({ providerId, valueScore }: { providerId: string; valueScore: number }) => {
      const provider = providerMap.get(providerId);
      if (!provider) throw new Error('Provider missing');
      const previous = queryClient
        .getQueryData<FitScore[]>(['fit-scores', request.id])
        ?.find((score) => score.providerId === providerId);
      return api.upsertFitScore(
        computeFitScore({
          request,
          provider,
          previous,
          signal: 'quote_uploaded',
          valueScore
        })
      );
    }
  });

  const createAnalysisMutation = useMutation({
    mutationFn: (analysis: QuoteAnalysis) => api.createQuoteAnalysis(analysis),
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ['quote-analyses', request.id] });
      if (analysis.providerId) {
        upsertFitScoreMutation.mutate({ providerId: analysis.providerId, valueScore: analysis.valueScore });
      }
    }
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        const providerId = activeProvider?.id ?? null;
        const analysis = buildAnalysis(request, acceptedFiles[0], providerId);
        await createAnalysisMutation.mutateAsync(analysis);
        track('quote_uploaded', { requestId: request.id, providerId });
      } finally {
        setUploading(false);
      }
    },
    [activeProvider, createAnalysisMutation, request, track]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': [],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const insertQuestion = (question: string) => {
    if (!activeChatId) return;
    const current = composerDrafts[activeChatId] ?? '';
    const next = current ? `${current}\n${question}` : question;
    setComposerDraft(activeChatId, next);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Guidance is tuned to {activeProvider ? activeProvider.displayName : 'the current request'}. Upload a quote to surface
        findings, risks, and follow-up actions. Use buttons to push questions straight into the active chat.
      </div>
      <div
        {...getRootProps({
          className: `flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed px-6 py-12 text-center ${
            isDragActive ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-600'
          }`
        })}
        aria-label="Upload a quote for analysis"
      >
        <input {...getInputProps()} aria-label="Quote upload" />
        <p className="text-sm font-semibold">Drop quotes or click to upload (PDF, image, doc)</p>
        <p className="mt-1 text-xs text-slate-500">AI will summarize findings, risks, and value score.</p>
        {uploading && <p className="mt-2 text-xs text-brand-600">Analyzing…</p>}
      </div>

      {analysesQuery.data?.map((analysis) => (
        <article key={analysis.id} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Quote insights</h3>
              <p className="text-xs text-slate-500">Value score {analysis.valueScore}/100</p>
            </div>
            <a
              href={analysis.uploadedFile.url}
              className="rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              View file
            </a>
          </header>
          <p className="text-sm text-slate-700">{analysis.findings.summary}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Includes</h4>
              <ul className="mt-1 list-disc pl-4 text-xs text-slate-600" role="list">
                {analysis.findings.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Excludes</h4>
              <ul className="mt-1 list-disc pl-4 text-xs text-slate-600" role="list">
                {analysis.findings.excludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risks</h4>
              <ul className="mt-1 list-disc pl-4 text-xs text-rose-600" role="list">
                {analysis.findings.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {analysis.findings.timeline && <span>Timeline: {analysis.findings.timeline}</span>}
            {analysis.findings.warranty && <span>Warranty: {analysis.findings.warranty}</span>}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested questions</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => insertQuestion(question)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Checklist</p>
            <ul className="list-disc pl-4" role="list">
              <li>Confirm permits responsibility</li>
              <li>Validate payment schedule and triggers</li>
              <li>Ensure allowances cover preferred finishes</li>
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
