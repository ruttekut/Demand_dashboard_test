import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DemandRequest, FitScore, ProviderSummary } from '../../types';
import { useRequestUiStore } from '../../state/useRequestUiStore';
import { useTelemetry } from '../../telemetry/TelemetryProvider';
import { computeFitScore } from '../chat/fitScore';

interface CompareWorkspaceProps {
  request: DemandRequest;
  providers: ProviderSummary[];
}

function ExpandableText({ text, limit = 120 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (text.length <= limit) {
    return <p>{text}</p>;
  }
  return (
    <div className="space-y-1 text-sm text-slate-700">
      <p>{expanded ? text : `${text.slice(0, limit)}…`}</p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}

const criteriaLabels = [
  'Rating & reviews',
  'Years in business',
  'Intro highlight',
  'Badges',
  'Average response time',
  'Availability',
  'Price or quote',
  'Warranty or guarantees',
  'Notable inclusions / exclusions',
  'Location',
  'Fit score'
];

export function CompareWorkspace({ request, providers }: CompareWorkspaceProps) {
  const queryClient = useQueryClient();
  const { compareSelection, setCompareSelection } = useRequestUiStore();
  const selectedProviderIds = compareSelection[request.id] ?? [];
  const { track } = useTelemetry();
  const [notes, setNotes] = useState('');

  const fitScoresQuery = useQuery({
    queryKey: ['fit-scores', request.id],
    queryFn: () => api.listFitScores(request.id)
  });

  const snapshotsQuery = useQuery({
    queryKey: ['compare-snapshots', request.id],
    queryFn: () => api.listCompareSnapshots(request.id)
  });

  useEffect(() => {
    if (providers.length === 0) return;
    if (selectedProviderIds.length === 0) {
      setCompareSelection(request.id, providers.slice(0, 2).map((provider) => provider.id));
    }
  }, [providers, request.id, selectedProviderIds.length, setCompareSelection]);

  useEffect(() => {
    if (selectedProviderIds.length > 0) {
      track('compare_started', { requestId: request.id, providerIds: selectedProviderIds });
    }
  }, [selectedProviderIds, request.id, track]);

  const upsertFitScoreMutation = useMutation({
    mutationFn: (score: FitScore) => api.upsertFitScore(score),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fit-scores', request.id] })
  });

  const selection = selectedProviderIds
    .map((id) => providers.find((provider) => provider.id === id))
    .filter((provider): provider is ProviderSummary => Boolean(provider));

  const toggleSelection = (providerId: string) => {
    const exists = selectedProviderIds.includes(providerId);
    let next = exists
      ? selectedProviderIds.filter((id) => id !== providerId)
      : [...selectedProviderIds, providerId];
    if (next.length > 4) {
      next = next.slice(next.length - 4);
    }
    setCompareSelection(request.id, next);
  };

  const highlight = useMemo(() => {
    if (selection.length === 0) return null;
    const sortedByRating = [...selection].sort((a, b) => b.ratingAvg - a.ratingAvg);
    const fastestResponse = [...selection].sort(
      (a, b) => a.responseTimeMinutesAvg - b.responseTimeMinutesAvg
    )[0];
    const topFitScore = selection.reduce<{ provider: ProviderSummary | null; score: number }>(
      (acc, provider) => {
        const score = fitScoresQuery.data?.find((item) => item.providerId === provider.id)?.score ?? 0;
        if (!acc.provider || score > acc.score) {
          return { provider, score };
        }
        return acc;
      },
      { provider: null, score: 0 }
    );
    if (!topFitScore.provider) return null;
    return {
      topProvider: topFitScore.provider,
      message: `${topFitScore.provider.displayName} leads with a fit score of ${topFitScore.score} and a ${fastestResponse.displayName === topFitScore.provider.displayName ? 'fast response time' : 'strong review record'}.`
    };
  }, [selection, fitScoresQuery.data]);

  const bestFitProvider = useMemo(() => {
    return selection.reduce<{ provider: ProviderSummary | null; score: number }>((acc, provider) => {
      const score = fitScoresQuery.data?.find((item) => item.providerId === provider.id)?.score ?? 0;
      if (!acc.provider || score > acc.score) {
        return { provider, score };
      }
      return acc;
    }, { provider: null, score: 0 });
  }, [selection, fitScoresQuery.data]);

  const persistSnapshotMutation = useMutation({
    mutationFn: api.createCompareSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compare-snapshots', request.id] });
    }
  });

  const handleSaveSnapshot = async () => {
    if (selection.length === 0) return;
    await persistSnapshotMutation.mutateAsync({
      id: '',
      requestId: request.id,
      providerIds: selection.map((provider) => provider.id),
      createdAt: new Date().toISOString(),
      criteria: criteriaLabels,
      notes
    });
  };

  const handleExport = () => {
    track('compare_exported', { requestId: request.id, providerIds: selection.map((provider) => provider.id) });
    window.print();
  };

  const handleShare = async () => {
    const sharePayload = {
      requestId: request.id,
      providers: selection.map((provider) => provider.displayName),
      notes
    };
    const text = JSON.stringify(sharePayload, null, 2);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    track('compare_shared', sharePayload);
    alert('Shareable summary copied to clipboard');
  };

  const ensureFitScores = () => {
    selection.forEach((provider) => {
      const existing = fitScoresQuery.data?.find((item) => item.providerId === provider.id);
      if (!existing) {
        const computed = computeFitScore({ request, provider, previous: undefined, signal: 'initial' });
        upsertFitScoreMutation.mutate(computed);
      }
    });
  };

  useEffect(() => {
    if (selection.length > 0) {
      ensureFitScores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Compare providers</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
          >
            Share link
          </button>
          <button
            type="button"
            onClick={handleSaveSnapshot}
            className="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring"
          >
            Save snapshot
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Select providers to compare">
        {providers.map((provider) => {
          const checked = selectedProviderIds.includes(provider.id);
          const disabled = !checked && selectedProviderIds.length >= 4;
          return (
            <label
              key={provider.id}
              className={`flex cursor-pointer flex-col gap-2 rounded border px-3 py-3 text-sm shadow-sm focus-within:outline-none focus-within:ring ${
                checked ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{provider.displayName}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelection(provider.id)}
                  disabled={disabled}
                  className="h-4 w-4"
                  aria-label={`Select ${provider.displayName}`}
                />
              </div>
              <p className="text-xs text-slate-500">{provider.introText.slice(0, 80)}…</p>
            </label>
          );
        })}
      </div>

      {highlight && (
        <div className="rounded border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
          Smart highlight: {highlight.message}
        </div>
      )}

      {selection.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse" role="grid">
            <thead className="sticky top-0 bg-white shadow" role="rowgroup">
              <tr role="row">
                <th className="w-48 border border-slate-200 bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Criteria
                </th>
                {selection.map((provider) => (
                  <th
                    key={provider.id}
                    scope="col"
                    className="border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span>{provider.displayName}</span>
                      <span className="text-xs text-slate-500">{provider.ratingAvg.toFixed(1)} ★ ({provider.ratingCount})</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {criteriaLabels.map((label) => (
                <tr key={label} role="row" className="border-b border-slate-200">
                  <th
                    scope="row"
                    className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {label}
                  </th>
                  {selection.map((provider) => {
                    const fitScore = fitScoresQuery.data?.find((item) => item.providerId === provider.id);
                    return (
                      <td key={provider.id} className="px-4 py-3 align-top text-sm text-slate-700">
                        {renderCell(label, provider, fitScore)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          Choose up to four providers to view a detailed comparison.
        </p>
      )}

      {bestFitProvider.provider && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {bestFitProvider.provider.displayName} looks like the best fit with a score of {bestFitProvider.score}. Focus on
          their proposal and confirm availability soon.
        </div>
      )}

      {snapshotsQuery.data && snapshotsQuery.data.length > 0 && (
        <div className="space-y-2 rounded border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Saved compare snapshots</h3>
          <ul className="space-y-1 text-xs text-slate-500" role="list">
            {snapshotsQuery.data.map((snapshot) => (
              <li key={snapshot.id} className="flex justify-between">
                <span>
                  {new Date(snapshot.createdAt).toLocaleString()} – {snapshot.providerIds.length} providers
                </span>
                <span>
                  {(snapshot.notes ?? '').slice(0, 60)}
                  {(snapshot.notes ?? '').length > 60 ? '…' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="block text-sm font-medium text-slate-700" htmlFor="compare-notes">
        Notes
      </label>
      <textarea
        id="compare-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring"
        placeholder="Capture reasoning or follow-ups here"
      />
    </div>
  );
}

function renderCell(label: string, provider: ProviderSummary, fitScore?: FitScore) {
  switch (label) {
    case 'Rating & reviews':
      return (
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">{provider.ratingAvg.toFixed(1)} / 5</p>
          <p className="text-xs text-slate-500">{provider.ratingCount} reviews • Top mentions: quality, communication</p>
        </div>
      );
    case 'Years in business':
      return <p>{provider.yearsInBusiness} years</p>;
    case 'Intro highlight':
      return <ExpandableText text={provider.introText} limit={140} />;
    case 'Badges':
      return provider.badges.length ? (
        <ul className="flex flex-wrap gap-1" role="list">
          {provider.badges.map((badge) => (
            <li key={badge} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600" title={badge}>
              {badge}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-xs text-slate-400">No badges</span>
      );
    case 'Average response time':
      return <p>{provider.responseTimeMinutesAvg} min average</p>;
    case 'Availability':
      return <p>{provider.availability}</p>;
    case 'Price or quote':
      return <p>{provider.priceRange ?? 'Awaiting quote'}</p>;
    case 'Warranty or guarantees':
      return <p>Request written warranty details to confirm coverage.</p>;
    case 'Notable inclusions / exclusions':
      return (
        <ul className="list-disc pl-4 text-xs text-slate-500" role="list">
          <li>Badge count: {provider.badges.length}</li>
          <li>Average response {provider.responseTimeMinutesAvg} min</li>
        </ul>
      );
    case 'Location':
      return <p>{provider.locationCity}</p>;
    case 'Fit score':
      return fitScore ? (
        <div className="space-y-1">
          <p className="text-base font-semibold text-brand-700">{fitScore.score}</p>
          <ul className="list-disc pl-4 text-xs text-slate-500" role="list">
            {fitScore.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Calculating…</span>
      );
    default:
      return null;
  }
}
